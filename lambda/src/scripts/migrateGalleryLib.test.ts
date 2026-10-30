import {
  toCsv, parseCsv, validateMapping, keyFromUrl, originalExt, libraryKeys, versionSizes, watermarkSvg,
  toLibraryPhoto, galleryOrderProblems, type LegacyPhoto, type MappingRow,
} from './migrateGalleryLib';

const row = (legacyId: string, eventId = 'e1'): MappingRow => ({
  legacyId, thumbnailUrl: `https://m/photos/thumbs/${legacyId}.jpg`, visible: 'true', sortOrder: '10', eventId, eventTitle: 'Aug',
});
const legacy = (id: string, sortOrder: number, visible = true): LegacyPhoto => ({
  id, url: `https://m/photos/${id}.jpg`, thumbnailUrl: `https://m/photos/thumbs/${id}.jpg`, visible, sortOrder, eventId: null, createdAt: '2026-01-01T00:00:00.000Z',
});

describe('CSV', () => {
  it('round-trips rows, including commas and quotes', () => {
    const rows = [row('a'), { ...row('b'), eventTitle: 'Beats, "Summer" Edition' }];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });

  it('accepts CRLF line endings, extra columns and blank lines (e.g. after editing in a spreadsheet)', () => {
    const text = 'legacyId,thumbnailUrl,visible,sortOrder,eventId,eventTitle,notes\r\na,t,true,10,e1,Aug,ok\r\n\r\n';
    expect(parseCsv(text)).toEqual([{ legacyId: 'a', thumbnailUrl: 't', visible: 'true', sortOrder: '10', eventId: 'e1', eventTitle: 'Aug' }]);
  });

  it('rejects a file missing a required column', () => {
    expect(() => parseCsv('legacyId,eventId\na,e1\n')).toThrow('missing the "thumbnailUrl" column');
  });
});

describe('validateMapping', () => {
  const events = new Set(['e1', 'e2']);

  it('passes when every legacy photo has a known event exactly once', () => {
    expect(validateMapping([row('a'), row('b', 'e2')], ['a', 'b'], events)).toEqual([]);
  });

  it('reports blank and unknown events, duplicates, extras and missing photos', () => {
    const problems = validateMapping([row('a', ''), row('b', 'nope'), row('b'), row('zzz')], ['a', 'b', 'c'], events);
    expect(problems).toEqual(expect.arrayContaining([
      'Photo a has no eventId',
      'Photo b: event nope does not exist',
      'Photo b appears more than once',
      'Photo zzz is not in the legacy gallery',
      'Photo c is missing from the mapping file',
    ]));
  });
});

describe('keys and sizes', () => {
  it('extracts the S3 key from a media URL', () => {
    expect(keyFromUrl('https://d1.cloudfront.net/photos/a.jpg', 'd1.cloudfront.net')).toBe('photos/a.jpg');
    expect(() => keyFromUrl('https://evil/photos/a.jpg', 'd1.cloudfront.net')).toThrow('not on the media domain');
  });

  it.each([['a.jpg', 'jpg'], ['a.JPEG', 'jpg'], ['a.png', 'png']])('normalizes %s → %s', (url, ext) => {
    expect(originalExt(`https://m/photos/${url}`)).toBe(ext);
  });

  it('rejects unsupported types', () => {
    expect(() => originalExt('https://m/photos/a.heic')).toThrow('Unsupported image type');
  });

  it('builds library keys matching the API validators', () => {
    expect(libraryKeys('id1', 5)).toEqual({
      web: 'library/web/id1-5.jpg', webThumb: 'library/web-thumbs/id1-5.jpg',
      preview: 'library/previews/id1-5.jpg', thumbnail: 'library/thumbs/id1-5.jpg',
    });
  });

  it('sizes versions like the browser and never upscales', () => {
    expect(versionSizes(6000, 4000)).toEqual({
      web: { width: 2000, height: 1333 }, preview: { width: 1600, height: 1067 }, thumb: { width: 600, height: 400 },
    });
    expect(versionSizes(500, 300).web).toEqual({ width: 500, height: 300 });
  });
});

describe('watermarkSvg', () => {
  it('tiles the brand text many times over a canvas of the given size', () => {
    const svg = watermarkSvg(1600, 1067);
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" width="1600" height="1067">/);
    expect(svg).toContain('rotate(-30)');
    expect(svg).toContain('fill="rgba(255,255,255,0.30)"');
    expect((svg.match(/BEATS ON THE BLOCK/g) ?? []).length).toBeGreaterThan(4);
  });

  it('escapes XML in the text', () => {
    expect(watermarkSvg(600, 400, 'A & <B>')).toContain('A &amp; &lt;B&gt;');
  });
});

describe('toLibraryPhoto', () => {
  const args = {
    collectionId: 'c1', originalKey: 'originals/a.png', originalBytes: 99, width: 10, height: 5, contentHash: 'h',
    urls: { webUrl: 'w', webThumbUrl: 'wt', previewUrl: 'p', thumbnailUrl: 't' }, now: '2026-10-30T00:00:00.000Z',
  };

  it('keeps id, order and gallery visibility; starts not for sale with no photographer', () => {
    const p = toLibraryPhoto({ ...args, legacy: legacy('a', 40) });
    expect(p).toMatchObject({
      id: 'a', collectionId: 'c1', sortOrder: 40, gallerySortOrder: 40, inGallery: true, galleryKey: 'GALLERY',
      forSale: false, photographerId: null, removed: false, originalFilename: 'a.png', createdAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('omits galleryKey for hidden legacy photos', () => {
    const p = toLibraryPhoto({ ...args, legacy: legacy('a', 40, false) });
    expect(p.inGallery).toBe(false);
    expect(p).not.toHaveProperty('galleryKey');
  });
});

describe('galleryOrderProblems', () => {
  const photos = [legacy('a', 20), legacy('b', 10), legacy('hidden', 5, false)];

  it('passes when visible legacy photos keep their relative order (new uploads interleaved)', () => {
    expect(galleryOrderProblems(photos, ['b', 'new1', 'a', 'new2'])).toEqual([]);
  });

  it('reports missing photos and wrong order', () => {
    expect(galleryOrderProblems(photos, ['b'])[0]).toMatch(/1 visible photo\(s\) are missing/);
    expect(galleryOrderProblems(photos, ['a', 'b'])).toEqual(['Gallery order differs from the legacy gallery']);
  });
});
