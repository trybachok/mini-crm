-- Индексы под постраничные списки, ограничения целостности истории,
-- updated_at и понятная ошибка при неверной роли в metadata.

-- ---------------------------------------------------------------------------
-- Индексы.
-- Списки сортируются по (created_at desc, id) и фильтруются по object_id
-- или assignee_id. Составной индекс отдаёт страницу прямо в нужном порядке —
-- без узла Sort в плане. Ведущая колонка прежняя, FK и RLS-подзапросы
-- продолжают пользоваться этими индексами.
-- ---------------------------------------------------------------------------

drop index if exists public.tasks_object_id_idx;
drop index if exists public.tasks_assignee_id_idx;

create index tasks_object_id_created_at_idx
  on public.tasks (object_id, created_at desc, id);
create index tasks_assignee_id_created_at_idx
  on public.tasks (assignee_id, created_at desc, id);

-- Индексы под внешние ключи на profiles: без них изменение или удаление
-- профиля сканирует tasks и историю целиком.
create index tasks_author_id_idx on public.tasks (author_id);
create index task_status_history_changed_by_idx on public.task_status_history (changed_by);

-- ---------------------------------------------------------------------------
-- Инварианты истории на уровне таблицы.
-- Функция change_task_status их уже проверяет и возвращает понятную ошибку;
-- ограничения — последний рубеж для записей мимо функции (администратор, seed).
-- ---------------------------------------------------------------------------

alter table public.task_status_history
  add constraint task_status_history_comment_not_blank
    check (comment is null or length(trim(comment)) > 0),
  add constraint task_status_history_rework_requires_comment
    check (to_status <> 'rework' or comment is not null);

-- ---------------------------------------------------------------------------
-- updated_at: когда запись меняли в последний раз.
-- Через API колонку записать нельзя (нет в грантах), её ведёт триггер.
-- Явно заданное значение (администратор, seed) триггер не трогает.
-- ---------------------------------------------------------------------------

alter table public.objects add column updated_at timestamptz not null default now();
alter table public.tasks   add column updated_at timestamptz not null default now();

-- Для существующих строк «обновлена» = последнее известное событие.
update public.objects set updated_at = created_at;
update public.tasks t
set updated_at = coalesce(
  (select max(h.created_at) from public.task_status_history h where h.task_id = t.id),
  t.created_at
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.updated_at is not distinct from old.updated_at then
    new.updated_at := now();
  end if;
  return new;
end;
$$;

create trigger set_objects_updated_at
  before update on public.objects
  for each row execute function public.set_updated_at();

create trigger set_tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Понятная ошибка, если администратор опечатался в роли при создании пользователя.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  role_text text := new.raw_user_meta_data ->> 'role';
begin
  if role_text is not null and role_text not in ('manager', 'executor') then
    raise exception 'Неизвестная роль «%»: допустимы manager и executor', role_text
      using errcode = 'check_violation';
  end if;

  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(role_text::public.user_role, 'executor')
  );
  return new;
end;
$$;
