create extension if not exists "pgcrypto";

do $$ begin
  create type issue_category as enum (
    'Housing',
    'Campus',
    'Public Safety',
    'Local Services',
    'Transportation',
    'Consumer Issues',
    'Accessibility',
    'Other'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type privacy_mode as enum ('anonymous', 'pseudonymous', 'named');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type report_status as enum ('submitted', 'under_review', 'matched', 'flagged', 'removed');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type severity_level as enum ('low', 'medium', 'high', 'critical');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type member_role as enum ('resident', 'moderator');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type membership_status as enum ('approved', 'pending');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key,
  email text not null unique,
  display_name text not null,
  pseudonym text not null,
  role member_role not null default 'resident',
  region text not null default 'Rivergate',
  home_label text not null default 'Rivergate',
  email_alerts boolean not null default true,
  privacy_default privacy_mode not null default 'anonymous',
  created_at timestamptz not null default now()
);

create table if not exists public.issue_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid references public.profiles(id) on delete set null,
  category issue_category not null,
  title text not null,
  description text not null,
  location_text text not null,
  latitude double precision not null,
  longitude double precision not null,
  approximate_location_label text not null,
  occurrence_date date not null,
  created_at timestamptz not null default now(),
  evidence_file_name text,
  evidence_path text,
  privacy_mode privacy_mode not null default 'anonymous',
  allow_matching boolean not null default true,
  allow_joining_action_room boolean not null default true,
  status report_status not null default 'submitted',
  moderation_flags jsonb not null default '[]'::jsonb,
  institution_tag text,
  severity_level severity_level not null default 'medium',
  normalized_keywords text[] not null default '{}',
  duplicate_of_report_id uuid references public.issue_reports(id) on delete set null
);

create index if not exists issue_reports_category_idx on public.issue_reports(category);
create index if not exists issue_reports_created_at_idx on public.issue_reports(created_at desc);
create index if not exists issue_reports_location_idx on public.issue_reports(latitude, longitude);

create table if not exists public.action_rooms (
  id uuid primary key default gen_random_uuid(),
  cluster_key text not null unique,
  title text not null,
  category issue_category not null,
  approximate_location_label text not null,
  summary text not null,
  guidelines jsonb not null default '[]'::jsonb,
  suggested_actions jsonb not null default '[]'::jsonb,
  checklist jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.action_room_reports (
  room_id uuid not null references public.action_rooms(id) on delete cascade,
  report_id uuid not null references public.issue_reports(id) on delete cascade,
  primary key (room_id, report_id)
);

create table if not exists public.action_room_members (
  room_id uuid not null references public.action_rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  report_id uuid references public.issue_reports(id) on delete set null,
  status membership_status not null default 'pending',
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists public.action_room_posts (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.action_rooms(id) on delete cascade,
  author_user_id uuid not null references public.profiles(id) on delete cascade,
  author_display_name text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.action_room_votes (
  room_id uuid not null references public.action_rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  option_id text not null,
  created_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists public.report_flags (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.issue_reports(id) on delete cascade,
  flagged_by_user_id uuid references public.profiles(id) on delete set null,
  reason text not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.moderation_events (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.issue_reports(id) on delete cascade,
  moderator_user_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  note text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.issue_reports enable row level security;
alter table public.action_rooms enable row level security;
alter table public.action_room_reports enable row level security;
alter table public.action_room_members enable row level security;
alter table public.action_room_posts enable row level security;
alter table public.action_room_votes enable row level security;
alter table public.report_flags enable row level security;
alter table public.moderation_events enable row level security;

drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "reports owner or moderator read" on public.issue_reports;
create policy "reports owner or moderator read"
  on public.issue_reports for select
  using (
    reporter_user_id = auth.uid()
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'moderator'
    )
  );

drop policy if exists "reports insert by authenticated users" on public.issue_reports;
create policy "reports insert by authenticated users"
  on public.issue_reports for insert
  with check (auth.uid() = reporter_user_id or reporter_user_id is null);

drop policy if exists "rooms approved members or moderators read" on public.action_rooms;
create policy "rooms approved members or moderators read"
  on public.action_rooms for select
  using (
    exists (
      select 1 from public.action_room_members
      where action_room_members.room_id = action_rooms.id
        and action_room_members.user_id = auth.uid()
        and action_room_members.status = 'approved'
    )
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'moderator'
    )
  );

drop policy if exists "room members read own membership" on public.action_room_members;
create policy "room members read own membership"
  on public.action_room_members for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'moderator'
    )
  );

drop policy if exists "room members insert own membership" on public.action_room_members;
create policy "room members insert own membership"
  on public.action_room_members for insert
  with check (user_id = auth.uid());

drop policy if exists "room posts approved members only" on public.action_room_posts;
create policy "room posts approved members only"
  on public.action_room_posts for all
  using (
    exists (
      select 1 from public.action_room_members
      where action_room_members.room_id = action_room_posts.room_id
        and action_room_members.user_id = auth.uid()
        and action_room_members.status = 'approved'
    )
  )
  with check (
    exists (
      select 1 from public.action_room_members
      where action_room_members.room_id = action_room_posts.room_id
        and action_room_members.user_id = auth.uid()
        and action_room_members.status = 'approved'
    )
  );

drop policy if exists "room votes approved members only" on public.action_room_votes;
create policy "room votes approved members only"
  on public.action_room_votes for all
  using (
    exists (
      select 1 from public.action_room_members
      where action_room_members.room_id = action_room_votes.room_id
        and action_room_members.user_id = auth.uid()
        and action_room_members.status = 'approved'
    )
  )
  with check (
    exists (
      select 1 from public.action_room_members
      where action_room_members.room_id = action_room_votes.room_id
        and action_room_members.user_id = auth.uid()
        and action_room_members.status = 'approved'
    )
  );

drop policy if exists "report flags insert by authenticated users" on public.report_flags;
create policy "report flags insert by authenticated users"
  on public.report_flags for insert
  with check (flagged_by_user_id = auth.uid() or flagged_by_user_id is null);

drop policy if exists "moderation events moderators only" on public.moderation_events;
create policy "moderation events moderators only"
  on public.moderation_events for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'moderator'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'moderator'
    )
  );

insert into storage.buckets (id, name, public)
select 'issue-evidence', 'issue-evidence', false
where not exists (
  select 1 from storage.buckets where id = 'issue-evidence'
);

