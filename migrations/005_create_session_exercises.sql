CREATE TABLE
    session_exercises (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        session_id UUID NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        order_index INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
    );

ALTER TABLE session_sets
ADD COLUMN session_exercise_id UUID REFERENCES session_exercises (id) ON DELETE CASCADE,
ALTER COLUMN exercise_id
DROP NOT NULL;