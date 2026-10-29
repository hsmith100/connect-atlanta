import { hashFile } from './hashFile'

const realCrypto = globalThis.crypto

afterEach(() => {
  Object.defineProperty(globalThis, 'crypto', { value: realCrypto, configurable: true })
})

it('returns the SHA-256 digest as lowercase hex', async () => {
  const digest = jest.fn().mockResolvedValue(new Uint8Array([0, 15, 171, 255]).buffer)
  Object.defineProperty(globalThis, 'crypto', { value: { subtle: { digest } }, configurable: true })
  const bytes = new ArrayBuffer(3)
  const file = { arrayBuffer: () => Promise.resolve(bytes) } as unknown as Blob

  await expect(hashFile(file)).resolves.toBe('000fabff')
  expect(digest).toHaveBeenCalledWith('SHA-256', bytes)
})
