-- Function to find an existing 1:1 chat between two users
CREATE OR REPLACE FUNCTION get_existing_1to1_chat(user_a UUID, user_b UUID)
RETURNS TABLE (chat_id UUID) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT cp1.chat_id
    FROM public.chat_participants cp1
    JOIN public.chat_participants cp2 ON cp1.chat_id = cp2.chat_id
    JOIN public.chats c ON cp1.chat_id = c.id
    WHERE cp1.user_id = user_a
      AND cp2.user_id = user_b
      AND c.is_group = false
      AND (
          SELECT count(*) 
          FROM public.chat_participants cp3 
          WHERE cp3.chat_id = cp1.chat_id
      ) = 2;
END;
$$;
