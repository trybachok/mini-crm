-- Схема мини-CRM: профили, объекты, задачи, история статусов.
-- Права доступа (RLS) и переходы статусов — в следующих миграциях.

-- ---------------------------------------------------------------------------
-- Типы
-- ---------------------------------------------------------------------------

create type public.user_role as enum ('manager', 'executor');

create type public.task_status as enum (
  'new',          -- Новая
  'in_progress',  -- В работе
  'on_review',    -- На проверке
  'accepted',     -- Принята
  'rework'        -- На доработке
);

-- ---------------------------------------------------------------------------
-- Таблицы
-- ---------------------------------------------------------------------------

-- Профиль пользователя. Роль назначает администратор через metadata
-- при создании пользователя; через API роль изменить нельзя.
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null default '',
  role       public.user_role not null default 'executor',
  created_at timestamptz not null default now()
);

-- Объект (стройка).
create table public.objects (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (length(trim(name)) > 0),
  address    text not null default '',
  created_at timestamptz not null default now()
);

-- Задача по объекту. status и author_id заполняются только по умолчанию:
-- через API эти колонки недоступны для записи (см. гранты ниже).
create table public.tasks (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (length(trim(title)) > 0),
  description text not null default '',
  object_id   uuid not null references public.objects (id) on delete cascade,
  assignee_id uuid references public.profiles (id) on delete set null,
  status      public.task_status not null default 'new',
  author_id   uuid not null default auth.uid() references public.profiles (id),
  created_at  timestamptz not null default now()
);

-- История смены статусов. Пишется только функциями базы, через API — только чтение.
create table public.task_status_history (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.tasks (id) on delete cascade,
  changed_by  uuid not null references public.profiles (id),
  from_status public.task_status,
  to_status   public.task_status not null,
  comment     text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Индексы
-- ---------------------------------------------------------------------------

create index tasks_object_id_idx on public.tasks (object_id);
create index tasks_assignee_id_idx on public.tasks (assignee_id);
create index task_status_history_task_id_created_at_idx
  on public.task_status_history (task_id, created_at);

-- ---------------------------------------------------------------------------
-- Профиль создаётся автоматически при появлении пользователя в auth.users.
-- Роль и имя берутся из user metadata ({"role": "manager", "full_name": "..."}).
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'executor')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Гранты. Supabase по умолчанию выдаёт anon и authenticated все права
-- на таблицы в public — забираем и выдаём только нужное.
-- ---------------------------------------------------------------------------

-- Неавторизованным — ничего.
revoke all on all tables in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;

-- profiles: только чтение (имена, список исполнителей).
revoke all on public.profiles from authenticated;
grant select on public.profiles to authenticated;

-- objects: полный набор, кто именно что может — решает RLS.
revoke all on public.objects from authenticated;
grant select, insert, update, delete on public.objects to authenticated;

-- tasks: status и author_id через API записать нельзя — только дефолты.
-- Смена статуса — исключительно через функцию change_task_status.
revoke all on public.tasks from authenticated;
grant select, delete on public.tasks to authenticated;
grant insert (title, description, object_id, assignee_id) on public.tasks to authenticated;
grant update (title, description, assignee_id) on public.tasks to authenticated;

-- task_status_history: только чтение. Запись — из функций базы (security definer).
revoke all on public.task_status_history from authenticated;
grant select on public.task_status_history to authenticated;
