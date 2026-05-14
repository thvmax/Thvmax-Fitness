-- SQL Schema for THVMAX Fitness

-- 1. Workout Records Table
CREATE TABLE IF NOT EXISTS public.workout_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- For future auth, can be null for now
    date TEXT NOT NULL,
    day_key TEXT NOT NULL,
    day_title TEXT NOT NULL,
    exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
    completed_count INTEGER NOT NULL DEFAULT 0,
    total_count INTEGER NOT NULL DEFAULT 0,
    duration INTEGER,
    mood INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Progress Entries Table
CREATE TABLE IF NOT EXISTS public.progress_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- For future auth
    date TEXT NOT NULL,
    week INTEGER NOT NULL,
    photo_front TEXT,
    photo_side TEXT,
    photo_back TEXT,
    weight NUMERIC,
    body_fat NUMERIC,
    chest NUMERIC,
    waist NUMERIC,
    arms NUMERIC,
    thighs NUMERIC,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. User Stats Table (Only needed if storing user stats separately from calculating them)
CREATE TABLE IF NOT EXISTS public.user_stats (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    total_workouts INTEGER DEFAULT 0,
    join_date TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Current Session Table (To sync in-progress workouts across devices)
CREATE TABLE IF NOT EXISTS public.current_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    day_key TEXT NOT NULL,
    date TEXT NOT NULL,
    start_time BIGINT NOT NULL,
    exercises JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Storage Bucket for Photos
-- You will need to manually create a storage bucket named 'progress_photos' in the Supabase Dashboard
-- Make sure to set the bucket to "Public" if you want to access photos without signed URLs

-- Optional: Enable Row Level Security (RLS) if you plan to add Authentication
-- ALTER TABLE public.workout_records ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.progress_entries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.current_sessions ENABLE ROW LEVEL SECURITY;
