-- Create function to generate unique room codes
CREATE OR REPLACE FUNCTION ensure_unique_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
    max_attempts INTEGER := 100;
    attempts INTEGER := 0;
BEGIN
    LOOP
        -- Generate a 6-character uppercase code
        new_code := upper(substring(gen_random_bytes(3)::text, 3, 6));
        
        -- Remove any non-alphanumeric characters and ensure it's exactly 6 chars
        new_code := regexp_replace(new_code, '[^A-Z0-9]', '', 'g');
        IF length(new_code) < 6 THEN
            CONTINUE;
        END IF;
        new_code := substring(new_code, 1, 6);
        
        -- Check if code exists in either rooms or top_comment_sessions tables
        SELECT EXISTS(
            SELECT 1 FROM rooms WHERE code = new_code
            UNION
            SELECT 1 FROM top_comment_sessions WHERE code = new_code
        ) INTO code_exists;
        
        IF NOT code_exists THEN
            EXIT;
        END IF;
        
        attempts := attempts + 1;
        IF attempts >= max_attempts THEN
            RAISE EXCEPTION 'Failed to generate unique code after % attempts', max_attempts;
        END IF;
    END LOOP;
    
    RETURN new_code;
END;
$$;
