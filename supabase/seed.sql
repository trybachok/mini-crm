-- Тестовые данные: пользователи, объекты, задачи в разных статусах, история.
--
-- Запуск: supabase db query --remote --yes -f supabase/seed.sql
-- или вставить целиком в SQL Editor. Выполняется от администратора базы,
-- поэтому может писать напрямую в auth.users и в историю (API так не может).
-- Повторный запуск ничего не делает, если пользователи уже созданы.
--
-- Доступы:
--   Постановщик:   manager@example.com   / manager123
--   Исполнитель 1: ivanov@example.com    / executor123
--   Исполнитель 2: petrova@example.com   / executor123

begin;

-- Пользователь с паролем; профиль создаст триггер on_auth_user_created.
create function pg_temp.seed_user(email text, password text, full_name text, role text)
returns uuid language plpgsql as $$
declare
  user_id uuid := gen_random_uuid();
begin
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    email, extensions.crypt(password, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('role', role, 'full_name', full_name),
    now(), now(), '', '', '', ''
  );
  insert into auth.identities (
    id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), user_id, user_id::text, 'email',
    jsonb_build_object('sub', user_id::text, 'email', email, 'email_verified', true, 'phone_verified', false),
    now(), now(), now()
  );
  return user_id;
end $$;

-- Задача с датой создания в прошлом; запись истории о создании подгоняется под эту дату.
create function pg_temp.seed_task(
  title text, description text, object_id uuid, assignee_id uuid, author_id uuid, created_at timestamptz
) returns uuid language plpgsql as $$
#variable_conflict use_variable
declare
  task_id uuid;
begin
  insert into public.tasks (title, description, object_id, assignee_id, author_id, created_at)
  values (title, description, object_id, assignee_id, author_id, created_at)
  returning id into task_id;

  update public.task_status_history h
  set created_at = created_at, changed_by = author_id
  where h.task_id = task_id;

  return task_id;
end $$;

-- Переход статуса с указанным временем (без change_task_status: нужна своя дата).
create function pg_temp.seed_transition(
  task_id uuid, changed_by uuid, to_status public.task_status, at timestamptz, comment text default null
) returns void language plpgsql as $$
#variable_conflict use_variable
declare
  from_status public.task_status;
begin
  select t.status into from_status from public.tasks t where t.id = task_id;

  insert into public.task_status_history (task_id, changed_by, from_status, to_status, comment, created_at)
  values (task_id, changed_by, from_status, to_status, comment, at);

  update public.tasks t set status = to_status where t.id = task_id;
end $$;

do $$
declare
  manager  uuid;
  ivanov   uuid;
  petrova  uuid;
  object_a uuid;
  object_b uuid;
  object_c uuid;
  task     uuid;
  d0       timestamptz := date_trunc('hour', now()) - interval '7 days';
begin
  if exists (select 1 from auth.users where email = 'manager@example.com') then
    raise notice 'Seed уже применён, пропускаем';
    return;
  end if;

  manager := pg_temp.seed_user('manager@example.com', 'manager123',  'Ольга Смирнова', 'manager');
  ivanov  := pg_temp.seed_user('ivanov@example.com',  'executor123', 'Иван Петров',    'executor');
  petrova := pg_temp.seed_user('petrova@example.com', 'executor123', 'Анна Петрова',   'executor');

  insert into public.objects (name, address, created_at) values
    ('ЖК «Северный», корпус 2', 'г. Москва, ул. Полярная, 12', d0) returning id into object_a;
  insert into public.objects (name, address, created_at) values
    ('Склад логистического центра', 'Московская обл., Домодедово, Логистическая, 3', d0 + interval '1 day') returning id into object_b;
  insert into public.objects (name, address, created_at) values
    ('Школа на 550 мест', 'г. Москва, ул. Строителей, 7', d0 + interval '2 days') returning id into object_c;

  -- Объект A -----------------------------------------------------------------

  -- Принята: полный цикл с доработкой.
  task := pg_temp.seed_task('Залить фундамент секции 1', 'Бетон М300, контроль геодезии после заливки.',
                            object_a, ivanov, manager, d0);
  perform pg_temp.seed_transition(task, ivanov,  'in_progress', d0 + interval '2 hours');
  perform pg_temp.seed_transition(task, ivanov,  'on_review',   d0 + interval '1 day');
  perform pg_temp.seed_transition(task, manager, 'rework',      d0 + interval '1 day 3 hours',
                                  'Нет акта скрытых работ по армированию. Приложите и верните на проверку.');
  perform pg_temp.seed_transition(task, ivanov,  'in_progress', d0 + interval '1 day 4 hours');
  perform pg_temp.seed_transition(task, ivanov,  'on_review',   d0 + interval '2 days');
  perform pg_temp.seed_transition(task, manager, 'accepted',    d0 + interval '2 days 1 hour');

  -- На проверке.
  task := pg_temp.seed_task('Смонтировать опалубку 2 этажа', 'Проверить вертикальность щитов перед заливкой.',
                            object_a, ivanov, manager, d0 + interval '3 days');
  perform pg_temp.seed_transition(task, ivanov, 'in_progress', d0 + interval '3 days 1 hour');
  perform pg_temp.seed_transition(task, ivanov, 'on_review',   d0 + interval '5 days');

  -- Новая, исполнитель назначен.
  perform pg_temp.seed_task('Подготовить площадку под кран', 'Расчистить и спланировать площадку 12×12 м.',
                            object_a, petrova, manager, d0 + interval '6 days');

  -- Объект B -----------------------------------------------------------------

  -- В работе.
  task := pg_temp.seed_task('Устроить полы в зоне хранения', 'Топпинг, толщина 180 мм, деформационные швы по проекту.',
                            object_b, petrova, manager, d0 + interval '2 days');
  perform pg_temp.seed_transition(task, petrova, 'in_progress', d0 + interval '2 days 5 hours');

  -- На доработке.
  task := pg_temp.seed_task('Смонтировать ворота Д-3', 'Секционные ворота, проверить работу привода.',
                            object_b, petrova, manager, d0 + interval '3 days');
  perform pg_temp.seed_transition(task, petrova, 'in_progress', d0 + interval '3 days 2 hours');
  perform pg_temp.seed_transition(task, petrova, 'on_review',   d0 + interval '4 days');
  perform pg_temp.seed_transition(task, manager, 'rework',      d0 + interval '4 days 2 hours',
                                  'Ворота задевают направляющую, отрегулируйте и пришлите видео.');

  -- Объект C -----------------------------------------------------------------

  -- Новая без исполнителя: постановщик ещё не назначил.
  perform pg_temp.seed_task('Согласовать график поставки окон', 'Запросить у поставщика сроки по этажам.',
                            object_c, null, manager, d0 + interval '6 days 12 hours');

  -- updated_at ведёт триггер и ставит «сейчас»; подгоняем под даты истории.
  update public.objects set updated_at = created_at where id in (object_a, object_b, object_c);
  update public.tasks t
  set updated_at = (select max(h.created_at) from public.task_status_history h where h.task_id = t.id)
  where t.object_id in (object_a, object_b, object_c);

  raise notice 'Seed применён';
end $$;

commit;
