-- Migration: Add last_milestone_shown to profiles table
-- Used by IntelligenceMilestones to fire the unlock animation once per milestone per user.
-- Values: 0 (never shown), 50, 200, 1000, 5000
-- Per toneek_final_polish.md — Phase 5.

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_milestone_shown INTEGER DEFAULT 0;
