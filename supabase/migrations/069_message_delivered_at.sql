-- WhatsApp-standard read receipts need a third state between "sent" and
-- "read": delivered (the recipient's client actually received it over
-- realtime, but hasn't opened that conversation yet). Only read_at existed
-- before this, so a sent-but-not-yet-opened DM was indistinguishable from
-- one that silently failed to reach the recipient at all.
alter table public.messages add column if not exists delivered_at timestamptz;
