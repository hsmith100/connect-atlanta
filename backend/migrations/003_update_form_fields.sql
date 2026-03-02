-- Migration: Update form tables to match new form fields
-- Created: 2026-01-21
-- Description: Updates vendor and artist tables with new fields from redesigned forms

-- ============================================
-- VENDOR APPLICATIONS - Add new fields
-- ============================================
ALTER TABLE vendor_applications 
    ADD COLUMN IF NOT EXISTS website_social TEXT,
    ADD COLUMN IF NOT EXISTS price_point VARCHAR(100),
    ADD COLUMN IF NOT EXISTS has_insurance VARCHAR(10),
    ADD COLUMN IF NOT EXISTS food_permit VARCHAR(10),
    ADD COLUMN IF NOT EXISTS additional_comments TEXT;

-- Drop old columns that are no longer used
ALTER TABLE vendor_applications 
    DROP COLUMN IF EXISTS website,
    DROP COLUMN IF EXISTS instagram,
    DROP COLUMN IF EXISTS previous_experience;

-- ============================================
-- VOLUNTEER APPLICATIONS - Update structure
-- ============================================
-- Split name into first_name and last_name
ALTER TABLE volunteer_applications
    ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);

-- Migrate existing data (if any)
UPDATE volunteer_applications 
SET 
    first_name = SPLIT_PART(name, ' ', 1),
    last_name = CASE 
        WHEN name LIKE '% %' THEN SUBSTRING(name FROM POSITION(' ' IN name) + 1)
        ELSE ''
    END
WHERE first_name IS NULL AND name IS NOT NULL;

-- Drop old name column
ALTER TABLE volunteer_applications 
    DROP COLUMN IF EXISTS name,
    DROP COLUMN IF EXISTS availability,
    DROP COLUMN IF EXISTS why_volunteer,
    DROP COLUMN IF EXISTS emergency_contact_name,
    DROP COLUMN IF EXISTS emergency_contact_phone;

-- Add experience as JSON/TEXT for flexibility
ALTER TABLE volunteer_applications
    ADD COLUMN IF NOT EXISTS experience TEXT;

-- ============================================
-- ARTIST APPLICATIONS - Complete restructure
-- ============================================
-- Drop the old table and recreate with new structure
DROP TABLE IF EXISTS artist_applications CASCADE;

CREATE TABLE artist_applications (
    id SERIAL PRIMARY KEY,
    -- Basic Information
    email VARCHAR(255) NOT NULL,
    full_legal_name VARCHAR(255) NOT NULL,
    dj_name VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    instagram_link VARCHAR(500),
    contact_method VARCHAR(50) NOT NULL,
    
    -- About the Artist
    artist_bio TEXT NOT NULL,
    b2b_favorite TEXT NOT NULL,
    
    -- Genre Information
    main_genre VARCHAR(100) NOT NULL,
    sub_genre VARCHAR(100) NOT NULL,
    other_sub_genre VARCHAR(100),
    other_genre_text TEXT,
    
    -- Links and Media
    live_performance_links TEXT NOT NULL,
    soundcloud_link VARCHAR(500) NOT NULL,
    spotify_link VARCHAR(500) NOT NULL,
    
    -- Additional Information
    rekordbox_familiar VARCHAR(10) NOT NULL,
    promo_kit_links TEXT NOT NULL,
    additional_info TEXT,
    
    -- Metadata
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_artist_applications_email ON artist_applications(email);
CREATE INDEX IF NOT EXISTS idx_artist_applications_status ON artist_applications(status);
CREATE INDEX IF NOT EXISTS idx_artist_applications_created_at ON artist_applications(created_at DESC);

-- Update comment
COMMENT ON TABLE artist_applications IS 'Stores artist/DJ application submissions with updated 2026 fields';
COMMENT ON TABLE vendor_applications IS 'Stores vendor application submissions with updated 2026 fields';
COMMENT ON TABLE volunteer_applications IS 'Stores volunteer application submissions with updated 2026 fields';
