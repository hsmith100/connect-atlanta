-- Migration: Create table for sponsor inquiry submissions
-- Created: 2026-02-05

-- Sponsor Inquiries Table
CREATE TABLE IF NOT EXISTS sponsor_inquiries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    company VARCHAR(255) NOT NULL,
    product_industry TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sponsor_inquiries_email ON sponsor_inquiries(email);
CREATE INDEX IF NOT EXISTS idx_sponsor_inquiries_company ON sponsor_inquiries(company);
CREATE INDEX IF NOT EXISTS idx_sponsor_inquiries_status ON sponsor_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_sponsor_inquiries_created_at ON sponsor_inquiries(created_at DESC);

-- Add comment for documentation
COMMENT ON TABLE sponsor_inquiries IS 'Stores sponsor inquiry submissions from the Sponsor Inquiries form';
