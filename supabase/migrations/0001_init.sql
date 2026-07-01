-- Design Innsaeit Outreach Cockpit — v1 schema
-- Single user. Every table is RLS-gated to any authenticated user (there is exactly one).

-- ---------- Enums ----------
create type category        as enum ('Wellness', 'F&B', 'Beauty');
create type source          as enum ('Warm intro', 'Referral', 'Content engagement', 'Cold');
create type warmth          as enum ('Cold', 'Warm-adjacent', 'Warm');
create type stage           as enum ('To Research', 'Ready to Reach', 'Contacted', 'In Conversation', 'Call Booked', 'Won', 'Passed');
create type activity_type   as enum ('Note', 'Email drafted', 'Email sent', 'Reply received', 'Call booked', 'Follow-up done');
create type followup_status as enum ('Pending', 'Done', 'Snoozed', 'Cancelled');

-- ---------- updated_at trigger ----------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- prospects ----------
create table prospects (
  id           uuid primary key default gen_random_uuid(),
  brand_name   text not null,
  category     category,
  country      text,
  contact_name text,
  contact_role text,
  contact_email text,
  linkedin_url text,
  website      text,
  source       source,
  signal       text,
  warmth       warmth default 'Cold',
  stage        stage  not null default 'To Research',
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger prospects_updated_at before update on prospects
  for each row execute function set_updated_at();
create index prospects_stage_idx on prospects (stage);

-- ---------- activities (timeline) ----------
create table activities (
  id          uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references prospects (id) on delete cascade,
  type        activity_type not null,
  body        text,
  created_at  timestamptz not null default now()
);
create index activities_prospect_idx on activities (prospect_id, created_at desc);

-- ---------- followups (the follow-up engine) ----------
create table followups (
  id            uuid primary key default gen_random_uuid(),
  prospect_id   uuid not null references prospects (id) on delete cascade,
  due_date      date not null,
  status        followup_status not null default 'Pending',
  sequence_step int not null default 1,
  reason        text,
  created_at    timestamptz not null default now(),
  completed_at  timestamptz
);
create index followups_prospect_idx on followups (prospect_id);
create index followups_due_idx on followups (due_date) where status in ('Pending', 'Snoozed');
-- One active pending follow-up per prospect.
create unique index followups_one_pending_per_prospect
  on followups (prospect_id) where status = 'Pending';

-- ---------- settings (single row) ----------
create table settings (
  id               uuid primary key default gen_random_uuid(),
  my_voice         text,
  my_offer         text,
  credibility      text,
  icp              jsonb not null default '{}'::jsonb,
  draft_model      text not null default 'claude-haiku',
  openrouter_model text not null default 'meta-llama/llama-3.3-70b-instruct:free',
  followup_cadence jsonb not null default
    '[{"days_after":3,"note":"Short bump, add one new angle/value"},
      {"days_after":7,"note":"Share a relevant proof point / case angle"},
      {"days_after":14,"note":"Final soft close — leave the door open"}]'::jsonb,
  webhook_url      text,
  updated_at       timestamptz not null default now()
);
create trigger settings_updated_at before update on settings
  for each row execute function set_updated_at();

-- Seed the single settings row (empty icp, default cadence via column defaults).
insert into settings (id) values (gen_random_uuid());

-- ---------- RLS: authenticated-only on every table ----------
alter table prospects  enable row level security;
alter table activities enable row level security;
alter table followups  enable row level security;
alter table settings   enable row level security;

create policy prospects_authed  on prospects  for all to authenticated using (true) with check (true);
create policy activities_authed on activities for all to authenticated using (true) with check (true);
create policy followups_authed  on followups  for all to authenticated using (true) with check (true);
create policy settings_authed   on settings   for all to authenticated using (true) with check (true);
