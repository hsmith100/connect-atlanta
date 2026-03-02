-- Migration: Create tables for form submissions
-- Created: 2025-12-24

-- Email Signups Table (for Let's Connect form)
CREATE TABLE IF NOT EXISTS email_signups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    marketing_consent BOOLEAN DEFAULT FALSE,
    source VARCHAR(50) DEFAULT 'website',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vendor Applications Table
CREATE TABLE IF NOT EXISTS vendor_applications (
    id SERIAL PRIMARY KEY,
    business_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    business_type VARCHAR(100),
    description TEXT,
    website VARCHAR(255),
    instagram VARCHAR(255),
    previous_experience TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Volunteer Applications Table
CREATE TABLE IF NOT EXISTS volunteer_applications (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    availability TEXT,
    skills TEXT,
    previous_experience TEXT,
    why_volunteer TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Artist/DJ Applications Table
CREATE TABLE IF NOT EXISTS artist_applications (
    id SERIAL PRIMARY KEY,
    artist_name VARCHAR(255) NOT NULL,
    real_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    genre VARCHAR(100),
    subgenres TEXT,
    experience_years INTEGER,
    bio TEXT,
    soundcloud VARCHAR(255),
    spotify VARCHAR(255),
    instagram VARCHAR(255),
    facebook VARCHAR(255),
    youtube VARCHAR(255),
    mixcloud VARCHAR(255),
    website VARCHAR(255),
    equipment_owned TEXT,
    past_performances TEXT,
    artist_references TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_email_signups_email ON email_signups(email);
CREATE INDEX IF NOT EXISTS idx_email_signups_created_at ON email_signups(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vendor_applications_email ON vendor_applications(email);
CREATE INDEX IF NOT EXISTS idx_vendor_applications_status ON vendor_applications(status);
CREATE INDEX IF NOT EXISTS idx_vendor_applications_created_at ON vendor_applications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_volunteer_applications_email ON volunteer_applications(email);
CREATE INDEX IF NOT EXISTS idx_volunteer_applications_status ON volunteer_applications(status);
CREATE INDEX IF NOT EXISTS idx_volunteer_applications_created_at ON volunteer_applications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_artist_applications_email ON artist_applications(email);
CREATE INDEX IF NOT EXISTS idx_artist_applications_status ON artist_applications(status);
CREATE INDEX IF NOT EXISTS idx_artist_applications_created_at ON artist_applications(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE email_signups IS 'Stores email signup submissions from the Let''s Connect form';
COMMENT ON TABLE vendor_applications IS 'Stores vendor application submissions';
COMMENT ON TABLE volunteer_applications IS 'Stores volunteer application submissions';
COMMENT ON TABLE artist_applications IS 'Stores artist/DJ application submissions';

