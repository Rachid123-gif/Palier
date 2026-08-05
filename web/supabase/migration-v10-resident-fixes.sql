-- migration-v10-resident-fixes.sql
-- Post likes table & like_post function for server-side deduplication

-- 1. post_likes table
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, profile_id)
);
CREATE INDEX IF NOT EXISTS idx_post_likes_profile ON post_likes(profile_id);
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- 2. Replace increment_like_count with like_post (dedup via post_likes)
CREATE OR REPLACE FUNCTION like_post(p_post_id UUID, p_profile_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  inserted BOOLEAN;
BEGIN
  INSERT INTO post_likes (post_id, profile_id)
  VALUES (p_post_id, p_profile_id)
  ON CONFLICT (post_id, profile_id) DO NOTHING;

  GET DIAGNOSTICS inserted = ROW_COUNT;

  IF inserted THEN
    UPDATE posts SET like_count = like_count + 1 WHERE id = p_post_id;
  END IF;

  RETURN inserted;
END;
$$ LANGUAGE plpgsql;
