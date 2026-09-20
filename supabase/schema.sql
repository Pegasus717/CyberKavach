create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  share_code text not null unique,
  language text not null default 'en',
  country text not null default 'IN',
  created_at timestamptz not null default now()
);

create table public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  requester_shares boolean not null default true,
  addressee_shares boolean not null default true,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> addressee_id)
);
create unique index connections_pair_uniq on public.connections (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

create table public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  masked_text text not null,
  risk_score int not null check (risk_score between 0 and 100),
  level text not null check (level in ('safe','careful','likely_scam','dangerous')),
  scam_type text not null,
  verdict jsonb not null,
  source text not null default 'ai',
  created_at timestamptz not null default now()
);
create index scans_user_created on public.scans (user_id, created_at desc);

create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  scan_id uuid references public.scans(id) on delete set null,
  incident jsonb not null,
  plan jsonb not null default '{}'::jsonb,
  fields jsonb not null default '{}'::jsonb,
  documents jsonb not null default '[]'::jsonb,
  progress jsonb not null default '{}'::jsonb,
  status text not null default 'planning',
  language text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.gen_share_code() returns text language plpgsql as $$
declare chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; code text; i int;
begin
  loop
    code := '';
    for i in 1..8 loop
      code := code || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    end loop;
    exit when not exists (select 1 from public.profiles where share_code = code);
  end loop;
  return code;
end $$;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, share_code)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)), public.gen_share_code());
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.is_related(a uuid, b uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.connections c
    where c.status in ('pending','accepted')
      and ((c.requester_id = a and c.addressee_id = b) or (c.requester_id = b and c.addressee_id = a)));
$$;

create or replace function public.can_view_scans(viewer uuid, owner uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.connections c
    where c.status = 'accepted'
      and ((c.requester_id = owner and c.addressee_id = viewer and c.requester_shares)
        or (c.addressee_id = owner and c.requester_id = viewer and c.addressee_shares)));
$$;

alter table public.profiles enable row level security;
alter table public.connections enable row level security;
alter table public.scans enable row level security;
alter table public.complaints enable row level security;

grant usage on schema public to authenticated, service_role;
grant select on public.profiles, public.connections, public.scans, public.complaints to authenticated;
grant all on all tables in schema public to service_role;
revoke update on public.profiles from authenticated;
grant update (display_name, language, country) on public.profiles to authenticated;

create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_related(auth.uid(), id));
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy connections_select on public.connections for select to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());
create policy scans_select on public.scans for select to authenticated
  using (user_id = auth.uid() or (level in ('likely_scam','dangerous') and public.can_view_scans(auth.uid(), user_id)));
create policy complaints_select on public.complaints for select to authenticated
  using (user_id = auth.uid());

alter publication supabase_realtime add table public.scans;
alter publication supabase_realtime add table public.connections;
