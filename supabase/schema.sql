create sequence if not exists public.receipt_number_seq;

create table if not exists public.approved_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  full_name text not null default '',
  approved boolean not null default false,
  is_admin boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.approved_users
  add column if not exists is_admin boolean not null default false;

alter table public.approved_users enable row level security;

drop policy if exists "Users can read their approval" on public.approved_users;
drop policy if exists "Administrators can read accounts" on public.approved_users;
drop policy if exists "Users can create their pending account" on public.approved_users;
drop policy if exists "Administrators can update accounts" on public.approved_users;

create policy "Users can read their approval"
  on public.approved_users
  for select
  to authenticated
  using (user_id = auth.uid());

create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.approved_users
    where user_id = auth.uid() and approved = true and is_admin = true
  );
$$;

create policy "Administrators can read accounts"
  on public.approved_users
  for select
  to authenticated
  using (public.is_current_user_admin());

create policy "Users can create their pending account"
  on public.approved_users
  for insert
  to authenticated
  with check (user_id = auth.uid() and approved = false and is_admin = false);

revoke update on table public.approved_users from authenticated;
grant update (approved, full_name) on table public.approved_users to authenticated;

create policy "Administrators can update accounts"
  on public.approved_users
  for update
  to authenticated
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

create or replace function public.create_pending_approved_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.approved_users (user_id, email, full_name, approved, is_admin)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    false,
    false
  )
  on conflict (user_id) do update set
    email = excluded.email,
    full_name = case when public.approved_users.full_name = '' then excluded.full_name else public.approved_users.full_name end;
  return new;
end;
$$;

drop trigger if exists create_pending_approved_user on auth.users;
create trigger create_pending_approved_user
  after insert on auth.users
  for each row execute function public.create_pending_approved_user();

create table if not exists public.receipts (
  id text primary key default (
    'REC-' || to_char(current_date, 'YYYY') || '-' ||
    lpad(nextval('public.receipt_number_seq')::text, 4, '0')
  ),
  auth_user_id uuid references auth.users(id),
  issued_at timestamptz not null default timezone('utc', now()),
  name text not null,
  organization text not null default '',
  membership_nature text not null default 'General',
  email text not null default '',
  phone text not null default '',
  email_and_cell text not null default '',
  amount numeric(12, 2) not null check (amount > 0),
  number_of_persons integer not null default 1 check (number_of_persons > 0),
  amount_in_words text not null default '',
  payment_method text not null default 'Cash',
  cheque_number_and_date text not null default '',
  bank_name text not null default '',
  remarks text not null default '',
  received_by text not null default ''
);

alter table public.receipts enable row level security;

drop policy if exists "Authenticated receipt access" on public.receipts;
drop policy if exists "Approved users can read receipts" on public.receipts;
drop policy if exists "Approved users can create receipts" on public.receipts;
drop policy if exists "Administrators can update receipts" on public.receipts;
drop policy if exists "Administrators can delete receipts" on public.receipts;

create policy "Approved users can read receipts"
  on public.receipts
  for select
  to authenticated
  using (exists (
    select 1 from public.approved_users
    where user_id = auth.uid() and approved = true
  ))
;

create policy "Approved users can create receipts"
  on public.receipts
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.approved_users
      where user_id = auth.uid() and approved = true
    )
    and (auth_user_id = auth.uid() or auth_user_id is null)
  );

create policy "Administrators can update receipts"
  on public.receipts
  for update
  to authenticated
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

create policy "Administrators can delete receipts"
  on public.receipts
  for delete
  to authenticated
  using (public.is_current_user_admin());

create index if not exists receipts_issued_at_idx on public.receipts (issued_at desc);

create or replace function public.verify_receipt(receipt_id text)
returns table (
  id text,
  issued_at timestamptz,
  name text,
  organization text,
  membership_nature text,
  amount numeric,
  number_of_persons integer,
  amount_in_words text,
  payment_method text,
  received_by text
)
language sql
security definer
set search_path = public
as $$
  select
    r.id,
    r.issued_at,
    r.name,
    r.organization,
    r.membership_nature,
    r.amount,
    r.number_of_persons,
    r.amount_in_words,
    r.payment_method,
    r.received_by
  from public.receipts r
  where lower(r.id) = lower(receipt_id)
  limit 1;
$$;

revoke all on function public.verify_receipt(text) from public;
grant execute on function public.verify_receipt(text) to anon, authenticated;

alter table public.receipts
  add column if not exists number_of_persons integer not null default 1;

alter table public.receipts
  drop constraint if exists receipts_number_of_persons_positive;

alter table public.receipts
  add constraint receipts_number_of_persons_positive
  check (number_of_persons > 0);

alter table public.receipts
  add column if not exists auth_user_id uuid references auth.users(id);

alter table public.receipts
  add column if not exists received_by text not null default '';

alter table public.receipts
  add column if not exists email text not null default '';

alter table public.receipts
  add column if not exists phone text not null default '';

update public.receipts
set
  email = coalesce(nullif(trim(split_part(email_and_cell, ' / ', 1)), ''), email),
  phone = coalesce(nullif(trim(split_part(email_and_cell, ' / ', 2)), ''), phone)
where email = '' and email_and_cell like '% / %';