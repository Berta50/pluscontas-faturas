-- Migração 1.1: Tabelas iniciais da App de Faturas Plus Contas
-- Tabelas: profiles, companies, company_members, staff_assignments, invoices, invoice_files

-- 1. Tabela profiles (pessoas)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'client' check (role in ('admin', 'staff', 'client')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Tabela companies (empresas)
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  vat_number text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Tabela company_members (ligação clientes <-> empresas)
create table if not exists public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint company_members_company_profile_unique unique (company_id, profile_id)
);

-- 4. Tabela staff_assignments (atribuição equipa <-> empresas, Fase 12)
create table if not exists public.staff_assignments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint staff_assignments_company_profile_unique unique (company_id, profile_id)
);

-- 5. Tabela invoices (faturas)
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  submitted_by uuid references public.profiles(id) on delete set null,
  client_notes text not null,
  review_status text not null default 'new' check (
    review_status in ('new', 'in_review', 'returned', 'answered', 'approved', 'exported')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. Tabela invoice_files (fotos e PDFs das faturas)
create table if not exists public.invoice_files (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  file_path text not null,
  file_type text not null,
  page_order integer not null default 1,
  created_at timestamptz not null default now()
);

-- Índices para chaves estrangeiras e pesquisas frequentes
create index if not exists idx_company_members_company on public.company_members(company_id);
create index if not exists idx_company_members_profile on public.company_members(profile_id);
create index if not exists idx_staff_assignments_company on public.staff_assignments(company_id);
create index if not exists idx_staff_assignments_profile on public.staff_assignments(profile_id);
create index if not exists idx_invoices_company on public.invoices(company_id);
create index if not exists idx_invoices_submitted_by on public.invoices(submitted_by);
create index if not exists idx_invoices_review_status on public.invoices(review_status);
create index if not exists idx_invoice_files_invoice on public.invoice_files(invoice_id);

-- Função e trigger para manter updated_at atualizado
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create or replace trigger set_companies_updated_at
  before update on public.companies
  for each row execute procedure public.set_updated_at();

create or replace trigger set_invoices_updated_at
  before update on public.invoices
  for each row execute procedure public.set_updated_at();

-- Trigger automático para criar registo em public.profiles quando um utilizador é criado em auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'client')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
