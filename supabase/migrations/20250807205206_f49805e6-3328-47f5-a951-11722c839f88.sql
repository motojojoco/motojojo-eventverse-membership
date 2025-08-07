-- Membership plans and user memberships schema
-- 1) Create membership_plans table
CREATE TABLE IF NOT EXISTS public.membership_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  price_inr INTEGER NOT NULL CHECK (price_inr >= 0),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Create user_memberships table (subscriptions)
CREATE TABLE IF NOT EXISTS public.user_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES public.membership_plans(id) ON DELETE RESTRICT,
  status VARCHAR NOT NULL DEFAULT 'pending', -- pending | active | expired | cancelled
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ,
  amount_inr INTEGER,
  payment_id TEXT, -- e.g., Razorpay payment id (optional for now)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3) Indexes
CREATE INDEX IF NOT EXISTS idx_user_memberships_user_id ON public.user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_plan_id ON public.user_memberships(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_end_date ON public.user_memberships(end_date);

-- 4) Enable RLS
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_memberships ENABLE ROW LEVEL SECURITY;

-- 5) Policies for membership_plans
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'membership_plans' AND policyname = 'Membership plans are viewable by everyone'
  ) THEN
    CREATE POLICY "Membership plans are viewable by everyone"
    ON public.membership_plans
    FOR SELECT
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'membership_plans' AND policyname = 'Admins can manage membership plans'
  ) THEN
    CREATE POLICY "Admins can manage membership plans"
    ON public.membership_plans
    FOR ALL
    USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));
  END IF;
END $$;

-- 6) Policies for user_memberships
DO $$
BEGIN
  -- Users can insert their own memberships
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_memberships' AND policyname = 'Users can create their own memberships'
  ) THEN
    CREATE POLICY "Users can create their own memberships"
    ON public.user_memberships
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Users can view their own memberships
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_memberships' AND policyname = 'Users can view their own memberships'
  ) THEN
    CREATE POLICY "Users can view their own memberships"
    ON public.user_memberships
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  -- Admins can view all memberships
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_memberships' AND policyname = 'Admins can view all memberships'
  ) THEN
    CREATE POLICY "Admins can view all memberships"
    ON public.user_memberships
    FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));
  END IF;

  -- Admins can update memberships (e.g., status)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_memberships' AND policyname = 'Admins can update memberships'
  ) THEN
    CREATE POLICY "Admins can update memberships"
    ON public.user_memberships
    FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));
  END IF;
END $$;

-- 7) Trigger to auto-update updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_membership_plans_updated_at'
  ) THEN
    CREATE TRIGGER update_membership_plans_updated_at
    BEFORE UPDATE ON public.membership_plans
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_memberships_updated_at'
  ) THEN
    CREATE TRIGGER update_user_memberships_updated_at
    BEFORE UPDATE ON public.user_memberships
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 8) Function + trigger to derive end_date and amount from plan on insert
CREATE OR REPLACE FUNCTION public.set_user_membership_defaults()
RETURNS TRIGGER AS $$
DECLARE
  v_duration INTEGER;
  v_price INTEGER;
BEGIN
  -- Fetch plan duration and price
  SELECT duration_days, price_inr INTO v_duration, v_price
  FROM public.membership_plans
  WHERE id = NEW.plan_id;

  IF v_duration IS NULL THEN
    RAISE EXCEPTION 'Invalid plan_id provided';
  END IF;

  -- Default start_date
  IF NEW.start_date IS NULL THEN
    NEW.start_date := now();
  END IF;

  -- Default end_date if not provided
  IF NEW.end_date IS NULL THEN
    NEW.end_date := NEW.start_date + make_interval(days => v_duration);
  END IF;

  -- Default amount if not provided
  IF NEW.amount_inr IS NULL THEN
    NEW.amount_inr := v_price;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_user_membership_defaults_before_insert'
  ) THEN
    CREATE TRIGGER set_user_membership_defaults_before_insert
    BEFORE INSERT ON public.user_memberships
    FOR EACH ROW EXECUTE FUNCTION public.set_user_membership_defaults();
  END IF;
END $$;

-- 9) Seed default plans (idempotent)
INSERT INTO public.membership_plans (name, duration_days, price_inr, description)
SELECT * FROM (
  VALUES
    ('Monthly', 30, 500, '30 days of Motojojo Premium'),
    ('Quarterly', 90, 899, '90 days of Motojojo Premium'),
    ('Annual', 365, 1899, '365 days of Motojojo Premium')
) AS v(name, duration_days, price_inr, description)
WHERE NOT EXISTS (
  SELECT 1 FROM public.membership_plans p
  WHERE p.name = v.name AND p.duration_days = v.duration_days AND p.price_inr = v.price_inr
);
