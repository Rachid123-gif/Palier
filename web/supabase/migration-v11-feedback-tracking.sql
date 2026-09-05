-- v11: Add feedback tracking + beta invite building info
-- Run this migration on Supabase SQL Editor

-- Feedback tracking
ALTER TABLE feedback
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS admin_response TEXT,
  ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_feedback_profile_id ON feedback(profile_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);

-- Beta invites: link to building name + city
ALTER TABLE beta_invites
  ADD COLUMN IF NOT EXISTS building_name TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT;
