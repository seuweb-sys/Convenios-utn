-- Migration: Add signed PDF fields to convenios table
-- Date: 2026-01-19
-- Description: Adds fields to store the signed PDF document path and metadata
--              for the "PDF firmado" feature (R10)

-- Add fields for signed PDF storage to convenios table
ALTER TABLE convenios
ADD COLUMN IF NOT EXISTS signed_pdf_path TEXT,
ADD COLUMN IF NOT EXISTS signed_pdf_uploaded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS signed_pdf_uploaded_by UUID REFERENCES profiles(id);

-- Add comments for documentation
COMMENT ON COLUMN convenios.signed_pdf_path IS 'Google Drive link to the signed PDF document';
COMMENT ON COLUMN convenios.signed_pdf_uploaded_at IS 'Timestamp when the signed PDF was uploaded';
COMMENT ON COLUMN convenios.signed_pdf_uploaded_by IS 'ID of the admin who uploaded the signed PDF';

-- Create index for faster queries on signed PDF status
CREATE INDEX IF NOT EXISTS idx_convenios_signed_pdf_path ON convenios(signed_pdf_path) WHERE signed_pdf_path IS NOT NULL;
