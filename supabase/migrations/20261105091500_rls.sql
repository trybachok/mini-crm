-- Row Level Security: кто какие строки видит и меняет.
-- Правила работают на уровне базы, даже при обращении к API напрямую.

-- ---------------------------------------------------------------------------
-- Проверка роли текущего пользователя.
-- security definer — чтобы читать profiles в обход RLS без рекурсии.
-- stable + (select auth.uid()) — планировщик вычислит один раз на запрос.
-- ---------------------------------------------------------------------------

create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'manager'
  );
$$;

revoke execute on function public.is_manager() from public, anon;
grant execute on function public.is_manager() to authenticated;

-- ---------------------------------------------------------------------------
-- Включаем RLS на всех таблицах (идемпотентно).
-- ---------------------------------------------------------------------------

alter table public.profiles            enable row level security;
alter table public.objects             enable row level security;
alter table public.tasks               enable row level security;
alter table public.task_status_history enable row level security;

-- ---------------------------------------------------------------------------
-- profiles: авторизованные читают всех (имена в карточках, список исполнителей).
-- Записи через API нет вовсе — грант только на select.
-- ---------------------------------------------------------------------------

create policy "profiles: authenticated can read"
  on public.profiles for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- objects
-- ---------------------------------------------------------------------------

create policy "objects: manager has full access"
  on public.objects for all
  to authenticated
  using ((select public.is_manager()))
  with check ((select public.is_manager()));

-- Исполнитель видит объект, только если у него есть задача по нему.
-- Подзапрос к tasks сам проходит через RLS tasks — исполнитель найдёт только свои.
create policy "objects: executor sees objects with own tasks"
  on public.objects for select
  to authenticated
  using (
    exists (
      select 1
      from public.tasks t
      where t.object_id = objects.id
        and t.assignee_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------

create policy "tasks: manager has full access"
  on public.tasks for all
  to authenticated
  using ((select public.is_manager()))
  with check ((select public.is_manager()));

-- Исполнитель только читает свои задачи. Записи нет: менять статус он будет
-- через функцию change_task_status (security definer), а не через таблицу.
create policy "tasks: executor reads own tasks"
  on public.tasks for select
  to authenticated
  using (assignee_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- task_status_history: только чтение (insert/update/delete не выданы никому).
-- ---------------------------------------------------------------------------

create policy "history: manager reads all"
  on public.task_status_history for select
  to authenticated
  using ((select public.is_manager()));

create policy "history: executor reads history of own tasks"
  on public.task_status_history for select
  to authenticated
  using (
    exists (
      select 1
      from public.tasks t
      where t.id = task_status_history.task_id
        and t.assignee_id = (select auth.uid())
    )
  );
