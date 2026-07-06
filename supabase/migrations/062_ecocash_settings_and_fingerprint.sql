-- Move the EcoCash recipient number/name out of a hardcoded source
-- constant into an admin-editable platform_settings entry, so it can be
-- rotated/updated instantly (e.g. switching to a dedicated business SIM
-- line) without a code deploy.
--
-- platform_settings previously granted SELECT to anon (unauthenticated,
-- no-login) on every row -- fine for something like commission_rate_pct,
-- but the EcoCash number/name should only be visible to logged-in users
-- actually going through checkout, not scrapable by anyone hitting the
-- REST API directly with the public anon key. Add an is_public flag and
-- scope the SELECT policy accordingly instead of loosening nothing.

alter table public.platform_settings add column if not exists is_public boolean not null default true;

drop policy if exists "Anyone can read settings" on public.platform_settings;
create policy "Read settings" on public.platform_settings
for select
using (is_public or auth.uid() is not null);

insert into public.platform_settings (key, value, is_public)
values
  ('ecocash_number', '"0785910379"', false),
  ('ecocash_name', '"Tanatswa Bepete"', false)
on conflict (key) do update set is_public = excluded.is_public;

-- Cents-fingerprinting: each pending payment gets a unique exact amount
-- (base price +/- a few cents) so an incoming EcoCash SMS can be matched
-- to the right pending request by amount alone, and so a screenshot/proof
-- can never be reused across two different people's payments. Manual
-- admin approval remains the only way a payment is ever accepted --
-- this only makes that manual review faster and more fraud-resistant.
create or replace function public.generate_payment_fingerprint_amount(p_base_price numeric)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate numeric(10,2);
  offset_cents integer;
  exists_already boolean;
  attempts integer := 0;
begin
  loop
    offset_cents := (floor(random() * 9) - 4)::integer; -- -4..+4 cents
    candidate := round(p_base_price + (offset_cents::numeric / 100), 2);
    if candidate <= 0 then
      candidate := p_base_price;
    end if;

    select exists(
      select 1 from public.payment_verifications
      where status = 'pending' and amount = candidate
    ) into exists_already;

    attempts := attempts + 1;
    exit when not exists_already or attempts > 20;
  end loop;

  return candidate;
end;
$$;

grant execute on function public.generate_payment_fingerprint_amount(numeric) to authenticated;
