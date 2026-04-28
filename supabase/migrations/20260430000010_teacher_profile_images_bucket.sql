-- Public bucket for teacher profile images used in teacher/admin UIs.
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('teacher-profile-images', 'teacher-profile-images', true);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;
