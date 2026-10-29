-- Follow-ups: declined findings carry a follow-up state so the shop can remind, snooze or close them.
alter table public.findings
  add column if not exists fu_status text not null default 'open' check (fu_status in ('open', 'reminded', 'snoozed', 'done')),
  add column if not exists fu_at timestamptz,
  add column if not exists fu_until timestamptz;
