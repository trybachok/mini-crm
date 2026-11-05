-- Переходы статусов и история.
--
-- Колонка tasks.status недоступна для записи через API (нет гранта на колонку),
-- поэтому единственный способ сменить статус — функция change_task_status.
-- Она проверяет роль, исполнителя, допустимость перехода и обязательный
-- комментарий, после чего в одной транзакции меняет статус и пишет историю.

-- ---------------------------------------------------------------------------
-- При создании задачи — первая запись истории: «— → Новая».
-- security definer: у вызывающего пользователя нет права писать в историю.
-- ---------------------------------------------------------------------------

create or replace function public.record_task_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.task_status_history (task_id, changed_by, from_status, to_status)
  values (new.id, new.author_id, null, new.status);
  return new;
end;
$$;

create trigger on_task_created
  after insert on public.tasks
  for each row execute function public.record_task_created();

-- ---------------------------------------------------------------------------
-- Смена статуса.
--
--   Из            В             Кто
--   new           in_progress   назначенный исполнитель
--   in_progress   on_review     назначенный исполнитель
--   on_review     accepted      постановщик
--   on_review     rework        постановщик, комментарий обязателен
--   rework        in_progress   назначенный исполнитель
--
-- Остальные переходы запрещены.
-- ---------------------------------------------------------------------------

create or replace function public.change_task_status(
  task_id    uuid,
  new_status public.task_status,
  comment    text default null
)
returns public.tasks
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  task            public.tasks;
  -- Та же проверка роли, что и в политиках RLS (см. миграцию rls).
  is_manager      boolean := public.is_manager();
  is_assignee     boolean;
  transition_allowed boolean;
begin
  if current_user_id is null then
    raise exception 'Требуется авторизация' using errcode = 'insufficient_privilege';
  end if;

  -- Блокируем строку: два одновременных перехода не пройдут оба.
  select * into task
  from public.tasks t
  where t.id = change_task_status.task_id
  for update;

  if not found then
    raise exception 'Задача не найдена' using errcode = 'no_data_found';
  end if;

  is_assignee := coalesce(task.assignee_id = current_user_id, false);

  transition_allowed := case
    when task.status = 'new'         and new_status = 'in_progress' then is_assignee
    when task.status = 'in_progress' and new_status = 'on_review'   then is_assignee
    when task.status = 'on_review'   and new_status = 'accepted'    then is_manager
    when task.status = 'on_review'   and new_status = 'rework'      then is_manager
    when task.status = 'rework'      and new_status = 'in_progress' then is_assignee
    else false
  end;

  if not transition_allowed then
    raise exception 'Переход % → % недоступен', task.status, new_status
      using errcode = 'insufficient_privilege';
  end if;

  if new_status = 'rework' and nullif(trim(comment), '') is null then
    raise exception 'Для возврата на доработку нужен комментарий'
      using errcode = 'check_violation';
  end if;

  insert into public.task_status_history (task_id, changed_by, from_status, to_status, comment)
  values (task.id, current_user_id, task.status, new_status, nullif(trim(comment), ''));

  update public.tasks t
  set status = new_status
  where t.id = task.id
  returning * into task;

  return task;
end;
$$;

revoke execute on function public.change_task_status(uuid, public.task_status, text) from public, anon;
grant  execute on function public.change_task_status(uuid, public.task_status, text) to authenticated;
