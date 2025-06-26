
-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Create password vaults table with updated delay constraint (1 second to 50 years)
CREATE TABLE public.password_vaults (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  encrypted_password TEXT NOT NULL, -- Store encrypted password
  delay_seconds INTEGER NOT NULL CHECK (delay_seconds >= 1 AND delay_seconds <= 1576800000), -- 1 second to 50 years
  reveal_requested_at TIMESTAMP WITH TIME ZONE, -- When user clicked reveal
  revealed_at TIMESTAMP WITH TIME ZONE, -- When password was actually revealed
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_vaults ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Password vaults policies
CREATE POLICY "Users can view their own vaults" 
  ON public.password_vaults 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own vaults" 
  ON public.password_vaults 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vaults" 
  ON public.password_vaults 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vaults" 
  ON public.password_vaults 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to check if password is ready to be revealed
CREATE OR REPLACE FUNCTION public.is_password_ready(vault_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  vault_record RECORD;
BEGIN
  SELECT reveal_requested_at, delay_seconds, revealed_at
  INTO vault_record
  FROM public.password_vaults 
  WHERE id = vault_id AND user_id = auth.uid();
  
  -- If no reveal request has been made, not ready
  IF vault_record.reveal_requested_at IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- If already revealed, ready
  IF vault_record.revealed_at IS NOT NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check if enough time has passed since reveal request
  IF vault_record.reveal_requested_at + (vault_record.delay_seconds || ' seconds')::INTERVAL <= now() THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;
