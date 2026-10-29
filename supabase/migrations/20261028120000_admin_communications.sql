create table if not exists public.communication_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  added_at timestamptz not null default now()
);

create table if not exists public.communications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  excerpt text not null default '',
  content text not null default '',
  image_url text,
  image_alt text not null default '',
  is_published boolean not null default true,
  published_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists communications_publication_idx
  on public.communications (is_published, published_at desc);

alter table public.communication_admins enable row level security;
alter table public.communications enable row level security;

revoke all on public.communication_admins from anon, authenticated;
grant select on public.communication_admins to authenticated;
revoke all on public.communications from anon, authenticated;
grant select on public.communications to anon, authenticated;
grant insert, update, delete on public.communications to authenticated;

create or replace function public.is_communications_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.communication_admins as admins
    where admins.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_communications_admin() from public, anon;
grant execute on function public.is_communications_admin() to authenticated;

create policy "Admins can view admin assignments"
  on public.communication_admins for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_communications_admin()));

create policy "Anyone can read published communications"
  on public.communications for select to anon, authenticated
  using (is_published or (select public.is_communications_admin()));

create policy "Admins can create communications"
  on public.communications for insert to authenticated
  with check ((select public.is_communications_admin()));

create policy "Admins can update communications"
  on public.communications for update to authenticated
  using ((select public.is_communications_admin()))
  with check ((select public.is_communications_admin()));

create policy "Admins can delete communications"
  on public.communications for delete to authenticated
  using ((select public.is_communications_admin()));

create or replace function public.set_communications_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger communications_set_updated_at
  before update on public.communications
  for each row execute function public.set_communications_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'communications',
  'communications',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Public can view communication images"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'communications');

create policy "Admins can upload communication images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'communications' and (select public.is_communications_admin()));

create policy "Admins can update communication images"
  on storage.objects for update to authenticated
  using (bucket_id = 'communications' and (select public.is_communications_admin()))
  with check (bucket_id = 'communications' and (select public.is_communications_admin()));

create policy "Admins can delete communication images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'communications' and (select public.is_communications_admin()));

insert into public.communications (
  title,
  excerpt,
  content,
  image_url,
  image_alt,
  is_published,
  published_at
)
select
  'The Kingdom | Comunicado Oficial',
  'Compartimos nuestra historia, el origen de nuestro nombre y el camino que estamos construyendo como comunidad musical. Gracias por acompañarnos.',
  'Comunicado oficial dirigido a nuestra comunidad musical, seguidores y público en general.',
  'public/images/comunicado-oficial-2026.jpg',
  'Comunicado oficial de The Kingdom sobre la historia y el origen del proyecto.',
  true,
  '2026-10-25 12:00:00-06'
where not exists (
  select 1 from public.communications
  where title = 'The Kingdom | Comunicado Oficial'
);
