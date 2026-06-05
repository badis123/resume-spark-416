
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own profile upsert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- CV uploads
CREATE TABLE public.cv_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  original_filename TEXT NOT NULL,
  extracted_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cv_uploads TO authenticated;
GRANT ALL ON public.cv_uploads TO service_role;
ALTER TABLE public.cv_uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cv all" ON public.cv_uploads FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Analyses
CREATE TABLE public.analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  cv_id UUID REFERENCES public.cv_uploads ON DELETE SET NULL,
  job_title TEXT,
  job_company TEXT,
  job_description TEXT NOT NULL,
  match_score INT NOT NULL DEFAULT 0,
  ats_score INT NOT NULL DEFAULT 0,
  missing_keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommended_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  optimized_summary TEXT,
  improved_experience JSONB NOT NULL DEFAULT '[]'::jsonb,
  cover_letter TEXT,
  paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analysis_results TO authenticated;
GRANT ALL ON public.analysis_results TO service_role;
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own analyses all" ON public.analysis_results FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  analysis_id UUID REFERENCES public.analysis_results ON DELETE SET NULL,
  stripe_session_id TEXT,
  amount_cents INT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own payments read" ON public.payments FOR SELECT USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
