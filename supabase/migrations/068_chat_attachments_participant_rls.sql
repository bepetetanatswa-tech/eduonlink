-- Chat attachments (Supabase Storage bucket "chat-attachments") had two live
-- policies that granted read access to the ENTIRE bucket to any authenticated
-- user (and one to the public role) with no per-conversation restriction —
-- any logged-in account could read any other user's private DM/class chat
-- photos, voice notes, or documents just by knowing/guessing the object path.
-- The one ownership-scoped policy that did exist (delete) was itself broken:
-- it compared auth.uid() against storage.foldername(name)[1], which is
-- always the literal string 'dm' or 'class', never a user id — so it could
-- never have matched anything.
--
-- This replaces all of that with a single helper that resolves the caller's
-- profiles.id (not auth.uid() — object paths are keyed by profile id, same
-- as everywhere else in this app) and checks it's actually a participant of
-- the conversation encoded in the path: `dm/<idA>:<idB>/...` or
-- `class/<classId>/...`.

drop policy if exists "Anyone can read chat attachments" on storage.objects;
drop policy if exists "chat_attachments_auth_read" on storage.objects;
drop policy if exists "chat_attachments_upload" on storage.objects;
drop policy if exists "Authenticated can upload chat attachments" on storage.objects;
drop policy if exists "Users can delete own chat attachments" on storage.objects;

create or replace function public.is_chat_attachment_participant(object_name text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  segs text[] := storage.foldername(object_name);
  my_profile_id uuid;
begin
  if segs is null or array_length(segs, 1) < 2 then
    return false;
  end if;

  select id into my_profile_id from profiles where user_id = auth.uid();
  if my_profile_id is null then
    return false;
  end if;

  if segs[1] = 'dm' then
    return my_profile_id::text = any(string_to_array(segs[2], ':'));
  elsif segs[1] = 'class' then
    if segs[2] !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
      return false;
    end if;
    return exists (
      select 1 from classes where id = segs[2]::uuid and teacher_id = my_profile_id
    ) or exists (
      select 1 from class_enrollments where class_id = segs[2]::uuid and student_id = my_profile_id and status = 'active'
    );
  end if;

  return false;
end;
$$;

grant execute on function public.is_chat_attachment_participant(text) to authenticated;

create policy "chat_attachments_participant_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'chat-attachments' and public.is_chat_attachment_participant(name));

create policy "chat_attachments_participant_upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'chat-attachments' and public.is_chat_attachment_participant(name));
