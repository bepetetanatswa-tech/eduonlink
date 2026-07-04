-- VOA/Educonnect (now EduOnLink) — Migration 043: pin search_path on the
-- two join-code helper functions added in migration 041.
--
-- Found via Supabase's security advisor after applying 041/042:
-- generate_join_code() and set_class_join_code() had a mutable
-- search_path, same class of issue as the pre-existing set_updated_at()
-- (not introduced by this session, left alone as out of scope). No
-- behavior change - just pins search_path the same way every other
-- SECURITY DEFINER function in this schema already does.

CREATE OR REPLACE FUNCTION public.generate_join_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; -- no 0/O/1/I — easy to read aloud/type
  bad_substrings TEXT[] := ARRAY['FUC','SHT','ASS','SEX','FUK','CUM','COC','DIC','TIT','PIS','RAP','GAY','NIG','FAG'];
  code TEXT;
  exists_already BOOLEAN;
  is_clean BOOLEAN;
  bad TEXT;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..6 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;

    is_clean := TRUE;
    FOREACH bad IN ARRAY bad_substrings LOOP
      IF code LIKE '%' || bad || '%' THEN
        is_clean := FALSE;
        EXIT;
      END IF;
    END LOOP;
    CONTINUE WHEN NOT is_clean;

    SELECT EXISTS(SELECT 1 FROM public.classes WHERE join_code = code) INTO exists_already;
    EXIT WHEN NOT exists_already;
  END LOOP;
  RETURN code;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_class_join_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.join_code IS NULL THEN
    NEW.join_code := public.generate_join_code();
  END IF;
  RETURN NEW;
END;
$$;
