-- Migração 1.2: Ativar RLS (Row Level Security) e regras de acesso
-- Regra de ouro: O cliente só vê e mexe nas suas empresas. O admin vê tudo.

-- 1. Funções auxiliares (security definer para evitar recursão nas políticas)

-- Verifica se o utilizador autenticado é administrador
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer stable;

-- Devolve a lista de IDs das empresas a que o utilizador autenticado pertence
create or replace function public.get_user_company_ids()
returns setof uuid as $$
begin
  return query
    select company_id from public.company_members
    where profile_id = auth.uid();
end;
$$ language plpgsql security definer stable;

-- 2. Ativar RLS em todas as tabelas
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.staff_assignments enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_files enable row level security;

-- 3. Políticas para a tabela PROFILES
-- Leitura: admin vê todos; utilizador vê o seu próprio perfil ou de membros das suas empresas
create policy "profiles_select" on public.profiles
  for select using (
    public.is_admin()
    or id = auth.uid()
    or exists (
      select 1 from public.company_members cm1
      join public.company_members cm2 on cm1.company_id = cm2.company_id
      where cm1.profile_id = auth.uid() and cm2.profile_id = public.profiles.id
    )
  );

-- Atualização: admin pode atualizar qualquer um; utilizador atualiza apenas o seu próprio perfil
create policy "profiles_update" on public.profiles
  for update using (
    public.is_admin() or id = auth.uid()
  );

-- Inserção/Remoção: apenas admin
create policy "profiles_insert" on public.profiles
  for insert with check (public.is_admin() or id = auth.uid());

create policy "profiles_delete" on public.profiles
  for delete using (public.is_admin());

-- 4. Políticas para a tabela COMPANIES
-- Leitura: admin vê todas; clientes veem apenas as empresas a que pertencem
create policy "companies_select" on public.companies
  for select using (
    public.is_admin() or id in (select public.get_user_company_ids())
  );

-- Criação, alteração e eliminação de empresas: apenas admin
create policy "companies_insert" on public.companies
  for insert with check (public.is_admin());

create policy "companies_update" on public.companies
  for update using (public.is_admin());

create policy "companies_delete" on public.companies
  for delete using (public.is_admin());

-- 5. Políticas para a tabela COMPANY_MEMBERS
-- Leitura: admin vê todas; membros veem as associações das suas empresas
create policy "company_members_select" on public.company_members
  for select using (
    public.is_admin() or company_id in (select public.get_user_company_ids())
  );

-- Gestão de membros: apenas admin
create policy "company_members_insert" on public.company_members
  for insert with check (public.is_admin());

create policy "company_members_update" on public.company_members
  for update using (public.is_admin());

create policy "company_members_delete" on public.company_members
  for delete using (public.is_admin());

-- 6. Políticas para a tabela STAFF_ASSIGNMENTS (Fase 12)
create policy "staff_assignments_select" on public.staff_assignments
  for select using (
    public.is_admin() or profile_id = auth.uid()
  );

create policy "staff_assignments_all" on public.staff_assignments
  for all using (public.is_admin());

-- 7. Políticas para a tabela INVOICES
-- Leitura: admin vê todas; cliente vê as faturas das suas empresas
create policy "invoices_select" on public.invoices
  for select using (
    public.is_admin() or company_id in (select public.get_user_company_ids())
  );

-- Criação: cliente só pode criar faturas para as suas empresas
create policy "invoices_insert" on public.invoices
  for insert with check (
    public.is_admin() or (
      company_id in (select public.get_user_company_ids())
      and (submitted_by is null or submitted_by = auth.uid())
    )
  );

-- Atualização: admin pode tudo; cliente só mexe nas suas empresas
create policy "invoices_update" on public.invoices
  for update using (
    public.is_admin() or company_id in (select public.get_user_company_ids())
  );

-- Eliminação: admin pode tudo; cliente só pode apagar faturas no estado 'new' (Enviada)
create policy "invoices_delete" on public.invoices
  for delete using (
    public.is_admin() or (
      company_id in (select public.get_user_company_ids())
      and review_status = 'new'
    )
  );

-- 8. Políticas para a tabela INVOICE_FILES
-- Leitura: admin vê tudo; cliente vê ficheiros de faturas das suas empresas
create policy "invoice_files_select" on public.invoice_files
  for select using (
    public.is_admin() or exists (
      select 1 from public.invoices i
      where i.id = public.invoice_files.invoice_id
      and i.company_id in (select public.get_user_company_ids())
    )
  );

-- Inserção: ficheiros de faturas acessíveis
create policy "invoice_files_insert" on public.invoice_files
  for insert with check (
    public.is_admin() or exists (
      select 1 from public.invoices i
      where i.id = public.invoice_files.invoice_id
      and i.company_id in (select public.get_user_company_ids())
    )
  );

-- Eliminação: ficheiros de faturas no estado 'new'
create policy "invoice_files_delete" on public.invoice_files
  for delete using (
    public.is_admin() or exists (
      select 1 from public.invoices i
      where i.id = public.invoice_files.invoice_id
      and i.company_id in (select public.get_user_company_ids())
      and i.review_status = 'new'
    )
  );
