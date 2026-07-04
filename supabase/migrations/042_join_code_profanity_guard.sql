-- VOA/Educonnect (now EduOnLink) — Migration 042: block accidental profanity
-- in generated class join codes.
--
-- Found while smoke-testing migration 041: a random 6-char code came back
-- as "5FUCN6" — close enough to profanity to be a real problem on a
-- platform where codes get read aloud and shared with children. Rejects
-- and regenerates any code containing a common bad substring.

CREATE OR REPLACE FUNCTION public.generate_join_code()
RETURNS TEXT
LANGUAGE plpgsql
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
