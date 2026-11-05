-- Проверка правил доступа на стороне базы.
--
-- Запуск: supabase db query --remote --yes -f supabase/tests/rls_checks.sql
-- или вставить целиком в SQL Editor и выполнить.
--
-- Скрипт создаёт временных пользователей и данные, выполняет проверки
-- от имени каждой роли и откатывает транзакцию — в базе ничего не остаётся.
-- Если какая-то проверка не прошла, выполнение падает с текстом ошибки.

begin;

-- Переключение «текущего пользователя» так, как это делает Supabase API.
create function pg_temp.act_as(user_id uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', user_id, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

create function pg_temp.act_as_admin() returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', '', true);
end $$;

-- Временный пользователь в auth.users; профиль создаст триггер.
create function pg_temp.create_user(email text, role text) returns uuid language plpgsql as $$
declare
  new_id uuid := gen_random_uuid();
begin
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    new_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    email, '', now(),
    '{"provider":"email","providers":["email"]}',
    json_build_object('role', role, 'full_name', email)::jsonb,
    now(), now()
  );
  return new_id;
end $$;

do $$
declare
  manager_id   uuid := pg_temp.create_user('rls-check-manager@example.com',   'manager');
  executor1_id uuid := pg_temp.create_user('rls-check-executor1@example.com', 'executor');
  executor2_id uuid := pg_temp.create_user('rls-check-executor2@example.com', 'executor');
  object1_id   uuid;
  object2_id   uuid;
  object3_id   uuid;
  task1_id     uuid;
  task2_id     uuid;
  affected     int;
begin
  -- -------------------------------------------------------------------------
  -- Данные (от администратора): 3 объекта, задача executor1 на объекте 1,
  -- задача executor2 на объекте 2, объект 3 без задач.
  -- -------------------------------------------------------------------------
  insert into public.objects (name) values ('Объект 1') returning id into object1_id;
  insert into public.objects (name) values ('Объект 2') returning id into object2_id;
  insert into public.objects (name) values ('Объект 3') returning id into object3_id;

  insert into public.tasks (title, object_id, assignee_id, author_id)
    values ('Задача 1', object1_id, executor1_id, manager_id) returning id into task1_id;
  insert into public.tasks (title, object_id, assignee_id, author_id)
    values ('Задача 2', object2_id, executor2_id, manager_id) returning id into task2_id;

  -- -------------------------------------------------------------------------
  -- Исполнитель 1
  -- -------------------------------------------------------------------------
  perform pg_temp.act_as(executor1_id);

  assert (select count(*) from public.tasks) = 1,
    'исполнитель должен видеть только свою задачу';
  assert (select count(*) from public.tasks where id = task2_id) = 0,
    'исполнитель не должен видеть чужую задачу';
  assert (select count(*) from public.objects) = 1,
    'исполнитель должен видеть только объекты со своими задачами';
  assert (select count(*) from public.profiles) >= 3,
    'исполнитель должен читать профили';

  begin
    insert into public.objects (name) values ('Чужой объект');
    raise exception 'исполнитель не должен создавать объекты';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.tasks (title, object_id) values ('Чужая задача', object1_id);
    raise exception 'исполнитель не должен создавать задачи';
  exception when insufficient_privilege then null;
  end;

  update public.tasks set title = 'Переименовано' where id = task1_id;
  get diagnostics affected = row_count;
  assert affected = 0, 'исполнитель не должен редактировать задачи, даже свои';

  delete from public.tasks where id = task1_id;
  get diagnostics affected = row_count;
  assert affected = 0, 'исполнитель не должен удалять задачи';

  begin
    update public.tasks set status = 'accepted' where id = task1_id;
    raise exception 'статус нельзя менять прямым update';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.task_status_history (task_id, changed_by, to_status)
      values (task1_id, executor1_id, 'accepted');
    raise exception 'историю нельзя дописывать через API';
  exception when insufficient_privilege then null;
  end;

  begin
    delete from public.task_status_history where task_id = task1_id;
    raise exception 'историю нельзя удалять через API';
  exception when insufficient_privilege then null;
  end;

  -- -------------------------------------------------------------------------
  -- Исполнитель 2 (симметрично, чтобы исключить случайное совпадение)
  -- -------------------------------------------------------------------------
  perform pg_temp.act_as_admin();
  perform pg_temp.act_as(executor2_id);

  assert (select count(*) from public.tasks where id = task2_id) = 1,
    'исполнитель 2 должен видеть свою задачу';
  assert (select count(*) from public.tasks where id = task1_id) = 0,
    'исполнитель 2 не должен видеть задачу исполнителя 1';
  assert (select count(*) from public.objects where id = object1_id) = 0,
    'исполнитель 2 не должен видеть объект без своих задач';

  -- -------------------------------------------------------------------------
  -- Постановщик
  -- -------------------------------------------------------------------------
  perform pg_temp.act_as_admin();
  perform pg_temp.act_as(manager_id);

  -- Считаем только тестовые строки: в базе могут быть и другие данные.
  assert (select count(*) from public.tasks where id in (task1_id, task2_id)) = 2,
    'постановщик видит все задачи';
  assert (select count(*) from public.objects where id in (object1_id, object2_id, object3_id)) = 3,
    'постановщик видит все объекты';

  insert into public.objects (name, address) values ('Новый объект', 'Адрес');
  insert into public.tasks (title, object_id, assignee_id)
    values ('Новая задача', object3_id, executor1_id);

  assert (select author_id from public.tasks where title = 'Новая задача') = manager_id,
    'автор задачи подставляется из сессии';
  assert (select status from public.tasks where title = 'Новая задача') = 'new',
    'новая задача создаётся в статусе new';

  update public.tasks set title = 'Переименовано' where id = task1_id;
  get diagnostics affected = row_count;
  assert affected = 1, 'постановщик редактирует задачи';

  begin
    update public.tasks set status = 'accepted' where id = task1_id;
    raise exception 'даже постановщик не меняет статус прямым update';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.task_status_history (task_id, changed_by, to_status)
      values (task1_id, manager_id, 'accepted');
    raise exception 'даже постановщик не пишет историю через API';
  exception when insufficient_privilege then null;
  end;

  -- -------------------------------------------------------------------------
  -- Переходы статусов (change_task_status)
  -- -------------------------------------------------------------------------
  perform pg_temp.act_as_admin();

  assert (select count(*) from public.task_status_history where task_id = task1_id) = 1,
    'при создании задачи пишется первая запись истории';
  assert (select to_status from public.task_status_history where task_id = task1_id) = 'new',
    'первая запись истории — переход в new';

  -- Исполнитель 1: new → in_progress можно.
  perform pg_temp.act_as(executor1_id);
  perform public.change_task_status(task1_id, 'in_progress');
  assert (select status from public.tasks where id = task1_id) = 'in_progress',
    'исполнитель берёт задачу в работу';

  -- Исполнитель 1: in_progress → accepted нельзя (запрещённый переход).
  begin
    perform public.change_task_status(task1_id, 'accepted');
    raise exception 'исполнитель не должен принимать задачу';
  exception when insufficient_privilege then null;
  end;

  -- Исполнитель 2: не назначен на задачу 1 — ничего с ней делать не может.
  perform pg_temp.act_as_admin();
  perform pg_temp.act_as(executor2_id);
  begin
    perform public.change_task_status(task1_id, 'on_review');
    raise exception 'чужой исполнитель не должен менять статус';
  exception when insufficient_privilege then null;
  end;

  -- Исполнитель 1: in_progress → on_review.
  perform pg_temp.act_as_admin();
  perform pg_temp.act_as(executor1_id);
  perform public.change_task_status(task1_id, 'on_review');

  -- Постановщик: on_review → rework без комментария нельзя.
  perform pg_temp.act_as_admin();
  perform pg_temp.act_as(manager_id);
  begin
    perform public.change_task_status(task1_id, 'rework');
    raise exception 'возврат на доработку без комментария должен быть отклонён';
  exception when check_violation then null;
  end;
  begin
    perform public.change_task_status(task1_id, 'rework', '   ');
    raise exception 'пустой комментарий из пробелов должен быть отклонён';
  exception when check_violation then null;
  end;

  -- Постановщик: on_review → rework с комментарием.
  perform public.change_task_status(task1_id, 'rework', 'Переделать смету');
  assert (select comment from public.task_status_history
          where task_id = task1_id and to_status = 'rework') = 'Переделать смету',
    'комментарий сохраняется в истории';
  assert (select changed_by from public.task_status_history
          where task_id = task1_id and to_status = 'rework') = manager_id,
    'в истории записан автор перехода';

  -- Постановщик: rework → in_progress нельзя (только исполнитель).
  begin
    perform public.change_task_status(task1_id, 'in_progress');
    raise exception 'постановщик не должен брать задачу в работу';
  exception when insufficient_privilege then null;
  end;

  -- Исполнитель 1: rework → in_progress → on_review.
  perform pg_temp.act_as_admin();
  perform pg_temp.act_as(executor1_id);
  perform public.change_task_status(task1_id, 'in_progress');
  perform public.change_task_status(task1_id, 'on_review');

  -- Постановщик: on_review → accepted. После этого переходов нет.
  perform pg_temp.act_as_admin();
  perform pg_temp.act_as(manager_id);
  perform public.change_task_status(task1_id, 'accepted');
  begin
    perform public.change_task_status(task1_id, 'rework', 'Передумал');
    raise exception 'из accepted переходов быть не должно';
  exception when insufficient_privilege then null;
  end;

  -- Постановщик не может начать чужую задачу вместо исполнителя.
  begin
    perform public.change_task_status(task2_id, 'in_progress');
    raise exception 'постановщик не должен брать задачу в работу за исполнителя';
  exception when insufficient_privilege then null;
  end;

  -- Несуществующая задача.
  begin
    perform public.change_task_status(gen_random_uuid(), 'in_progress');
    raise exception 'несуществующая задача должна давать ошибку';
  exception when no_data_found then null;
  end;

  -- История задачи 1: создание + 6 переходов, порядок статусов верный.
  perform pg_temp.act_as_admin();
  assert (select count(*) from public.task_status_history where task_id = task1_id) = 7,
    'в истории ровно 7 записей';
  -- Внутри одной транзакции now() одинаков, поэтому порядок по времени здесь
  -- не проверить — сравниваем состав переходов. Через API каждый вызов —
  -- отдельная транзакция, и created_at упорядочен корректно.
  assert (select array_agg(from_status::text || '>' || to_status::text order by 1)
          from public.task_status_history
          where task_id = task1_id and from_status is not null)
         = (select array_agg(x order by 1) from unnest(array[
              'new>in_progress', 'in_progress>on_review', 'on_review>rework',
              'rework>in_progress', 'in_progress>on_review', 'on_review>accepted'
            ]) as x),
    'история содержит все переходы';
  assert (select count(*) from public.task_status_history
          where task_id = task1_id and from_status is null and to_status = 'new') = 1,
    'история содержит запись о создании';

  -- Исполнитель 2 не видит историю задачи 1, исполнитель 1 видит всю свою.
  perform pg_temp.act_as(executor2_id);
  assert (select count(*) from public.task_status_history where task_id = task1_id) = 0,
    'исполнитель не видит историю чужой задачи';
  perform pg_temp.act_as_admin();
  perform pg_temp.act_as(executor1_id);
  assert (select count(*) from public.task_status_history where task_id = task1_id) = 7,
    'исполнитель видит историю своей задачи';

  perform pg_temp.act_as_admin();
  raise notice 'RLS CHECKS PASSED';
end $$;

rollback;
