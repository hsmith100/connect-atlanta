-- Migration: Add setup field to vendor_applications table
-- Date: 2026-01-22

-- Add setup column to vendor_applications
ALTER TABLE vendor_applications
ADD COLUMN IF NOT EXISTS setup VARCHAR(500);

-- Add comment to the column
COMMENT ON COLUMN vendor_applications.setup IS 'Vendor setup type (e.g., food truck, table and canopy, etc.)';
