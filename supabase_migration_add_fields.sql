-- Migration: Add additional fields to credit_card_transactions table
-- Run this if you already have the credit_card_transactions table

-- Add new columns if they don't exist
ALTER TABLE IF EXISTS credit_card_transactions
  ADD COLUMN IF NOT EXISTS counter_party TEXT,
  ADD COLUMN IF NOT EXISTS reference_number TEXT,
  ADD COLUMN IF NOT EXISTS account_number TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS post_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS raw_data JSONB;

-- Add index on counter_party for faster searches
CREATE INDEX IF NOT EXISTS idx_cc_transactions_counter_party ON credit_card_transactions(counter_party) WHERE counter_party IS NOT NULL;

-- Add index on reference_number for faster searches
CREATE INDEX IF NOT EXISTS idx_cc_transactions_reference_number ON credit_card_transactions(reference_number) WHERE reference_number IS NOT NULL;

