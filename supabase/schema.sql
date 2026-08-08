create sequence if not exists public.receipt_number_seq;

create table if not exists public.receipts (
  id text primary key default (
    'REC-' || to_char(current_date, 'YYYY') || '-' ||
    lpad(nextval('public.receipt_number_seq')::text, 4, '0')
  ),
  issued_at timestamptz not null default timezone('utc', now()),
  name text not null,
  organization text not null default '',
  membership_nature text not null default 'General',
  email_and_cell text not null default '',
  amount numeric(12, 2) not null check (amount > 0),
  amount_in_words text not null default '',
  payment_method text not null default 'Cash',
  cheque_number_and_date text not null default '',
  bank_name text not null default '',
  remarks text not null default ''
);

alter table public.receipts enable row level security;

drop policy if exists "Public receipt access" on public.receipts;

create policy "Public receipt access"
  on public.receipts
  for all
  to anon, authenticated
  using (true)
  with check (true);

create index if not exists receipts_issued_at_idx on public.receipts (issued_at desc);