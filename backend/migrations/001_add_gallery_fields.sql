-- Migration: Add Cloudinary gallery fields to events table
-- Date: 2025-11-11
-- Description: Adds support for dynamic event galleries using Cloudinary

-- Create events table if it doesn't exist
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    location VARCHAR(255),
    description TEXT,
    flyer_url VARCHAR(500),
    attendees VARCHAR(50),
    artists VARCHAR(50),
    
    -- Cloudinary integration fields
    cloudinary_folder VARCHAR(255),
    gallery_enabled BOOLEAN DEFAULT false,
    photo_count INTEGER DEFAULT 0,
    video_count INTEGER DEFAULT 0,
    gallery_updated_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT unique_cloudinary_folder UNIQUE(cloudinary_folder)
);

-- Add Cloudinary fields if they don't exist (for existing tables)
DO $$ 
BEGIN
    -- Add cloudinary_folder column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='events' AND column_name='cloudinary_folder'
    ) THEN
        ALTER TABLE events ADD COLUMN cloudinary_folder VARCHAR(255);
    END IF;
    
    -- Add gallery_enabled column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='events' AND column_name='gallery_enabled'
    ) THEN
        ALTER TABLE events ADD COLUMN gallery_enabled BOOLEAN DEFAULT false;
    END IF;
    
    -- Add photo_count column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='events' AND column_name='photo_count'
    ) THEN
        ALTER TABLE events ADD COLUMN photo_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add video_count column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='events' AND column_name='video_count'
    ) THEN
        ALTER TABLE events ADD COLUMN video_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add gallery_updated_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='events' AND column_name='gallery_updated_at'
    ) THEN
        ALTER TABLE events ADD COLUMN gallery_updated_at TIMESTAMP;
    END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_events_gallery_enabled ON events(gallery_enabled);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date DESC);
CREATE INDEX IF NOT EXISTS idx_events_cloudinary_folder ON events(cloudinary_folder);

-- Insert sample events (only if table is empty)
INSERT INTO events (title, date, location, flyer_url, attendees, artists, cloudinary_folder, gallery_enabled)
SELECT 'BOTB - Season 2 Ep. 3', '2024-09-15', 'Atlanta Beltline', '/images/events/september-2024.png', '8,000+', '30+ DJs', 'events/1-september-2024', true
WHERE NOT EXISTS (SELECT 1 FROM events WHERE id = 1);

INSERT INTO events (title, date, location, flyer_url, attendees, artists, cloudinary_folder, gallery_enabled)
SELECT 'BOTB - Season 2 Ep. 2', '2024-07-20', 'Atlanta Beltline', '/images/events/july-2024.png', '7,500+', '28+ DJs', 'events/2-july-2024', true
WHERE NOT EXISTS (SELECT 1 FROM events WHERE id = 2);

INSERT INTO events (title, date, location, flyer_url, attendees, artists, cloudinary_folder, gallery_enabled)
SELECT 'BOTB - Season 2 Ep. 1', '2024-04-13', 'Atlanta Beltline', '/images/events/april-2024.png', '6,000+', '25+ DJs', 'events/3-april-2024', true
WHERE NOT EXISTS (SELECT 1 FROM events WHERE id = 3);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 001_add_gallery_fields completed successfully';
END $$;

