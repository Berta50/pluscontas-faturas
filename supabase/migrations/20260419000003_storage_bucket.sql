-- Migração 1.6: Criação do balde de armazenamento privado 'invoices' no Supabase Storage
-- e políticas de segurança para upload e consulta de faturas

-- 1. Criar o bucket privado 'invoices' se ainda não existir
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'invoices',
  'invoices',
  false,
  10485760, -- limite de 10 MB por ficheiro
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];

-- 2. Políticas de segurança em storage.objects para o balde 'invoices'

-- Inserção: utilizadores autenticados podem fazer upload de faturas
create policy "invoices_storage_insert" on storage.objects
  for insert with check (
    bucket_id = 'invoices'
    and auth.role() = 'authenticated'
  );

-- Leitura: admin pode ler tudo; clientes autenticados podem ler
create policy "invoices_storage_select" on storage.objects
  for select using (
    bucket_id = 'invoices'
    and (
      public.is_admin()
      or auth.role() = 'authenticated'
    )
  );

-- Eliminação: apenas administradores ou utilizadores autenticados para as suas faturas
create policy "invoices_storage_delete" on storage.objects
  for delete using (
    bucket_id = 'invoices'
    and (
      public.is_admin()
      or auth.role() = 'authenticated'
    )
  );
