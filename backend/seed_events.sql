-- Seed script to add past events to the database
-- Run this after uploading photos to Cloudinary

-- Clear existing data (optional - comment out if you want to keep existing events)
-- TRUNCATE TABLE events RESTART IDENTITY CASCADE;

-- Insert Past Events with Cloudinary folders
-- IDs are in CHRONOLOGICAL order (oldest to newest)
-- Frontend displays them in reverse order using ORDER BY date DESC
INSERT INTO events (id, title, date, location, description, flyer_url, attendees, artists, cloudinary_folder, gallery_enabled)
VALUES 
(
    1,
    'BOTB - Season 2 Ep. 1',
    '2025-04-05',
    'Atlanta Beltline',
    'Kicking off Season 2 with a bang',
    '/images/events/april-2025.png',
    '6,000+',
    '25+ DJs',
    'events/1-april-2025',
    true
),
(
    2,
    'BOTB - Season 2 Ep. 1.5',
    '2025-05-24',
    'Atlanta Beltline',
    'Spring vibes continue with an extra episode',
    '/images/events/may-2025.png',
    '5,500+',
    '24+ DJs',
    'events/2-may-2025',
    true
),
(
    3,
    'BOTB - Season 2 Ep. 2',
    '2025-07-12',
    'Atlanta Beltline',
    'Summer vibes and amazing music on the Beltline',
    '/images/events/july-2025.png',
    '7,500+',
    '28+ DJs',
    'events/3-july-2025',
    true
),
(
    4,
    'BOTB - Season 2 Ep. 3',
    '2025-09-06',
    'Atlanta Beltline',
    'The biggest episode yet with incredible energy and performances',
    '/images/events/september-2025.png',
    '8,000+',
    '30+ DJs',
    'events/4-september-2025',
    true
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    date = EXCLUDED.date,
    location = EXCLUDED.location,
    description = EXCLUDED.description,
    flyer_url = EXCLUDED.flyer_url,
    attendees = EXCLUDED.attendees,
    artists = EXCLUDED.artists,
    cloudinary_folder = EXCLUDED.cloudinary_folder,
    gallery_enabled = EXCLUDED.gallery_enabled;

-- Add a general gallery entry (ID 999) for the main gallery page
INSERT INTO events (id, title, date, location, description, flyer_url, attendees, artists, cloudinary_folder, gallery_enabled)
VALUES 
(
    999,
    'Event Gallery',
    '2025-01-01',
    'Atlanta Beltline',
    'General event gallery - all photos',
    '/images/events/placeholder.png',
    'N/A',
    'N/A',
    'events/gallery',
    true
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    cloudinary_folder = EXCLUDED.cloudinary_folder,
    gallery_enabled = EXCLUDED.gallery_enabled;

-- Update the sequence to continue from the highest ID (excluding the special gallery entry)
SELECT setval('events_id_seq', (SELECT MAX(id) FROM events WHERE id < 900));

-- Display the inserted events
SELECT id, title, date, cloudinary_folder, gallery_enabled FROM events ORDER BY date DESC;

