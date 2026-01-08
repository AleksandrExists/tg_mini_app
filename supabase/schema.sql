-- Удаление существующих объектов
DROP VIEW IF EXISTS days CASCADE;
DROP TABLE IF EXISTS data CASCADE;
DROP TABLE IF EXISTS task CASCADE;
DROP TABLE IF EXISTS _dict_type CASCADE;

-- Справочник типов задач
CREATE TABLE _dict_type (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
);

-- Таблица задач/привычек
CREATE TABLE task (
    id SERIAL PRIMARY KEY,
    name VARCHAR(64) NOT NULL UNIQUE,
    weight DECIMAL(5, 2),
    add_to_sum BOOLEAN NOT NULL DEFAULT TRUE,
    type_id INTEGER NOT NULL,
    start_value DECIMAL(10, 2) NOT NULL DEFAULT 0,
    target_value DECIMAL(10, 2) NOT NULL,
    target_change DECIMAL(10, 2) GENERATED ALWAYS AS (target_value - start_value) STORED,
    begin_date DATE NOT NULL DEFAULT(CURRENT_DATE - 2),
    end_date DATE NOT NULL DEFAULT(CURRENT_DATE + 2),
    duration INTEGER GENERATED ALWAYS AS ((end_date - begin_date) + 1) STORED

    -- Проверки
    CONSTRAINT correct_date_check
        CHECK (end_date >= begin_date),
    CONSTRAINT valid_weight_check
        CHECK (weight IS NULL OR (weight >= 0 AND weight <= 100)),

    -- Внешний ключ
    CONSTRAINT fk_task_type
        FOREIGN KEY (type_id)
        REFERENCES _dict_type(id)
        ON DELETE RESTRICT
);

-- Таблица данных по дням
CREATE TABLE data (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    task_id INTEGER NOT NULL,
    value DECIMAL(10, 2),

    CONSTRAINT unique_date_task_id UNIQUE(date, task_id),
    CONSTRAINT fk_task
        FOREIGN KEY(task_id)
        REFERENCES task(id)
        ON DELETE CASCADE
);

-- Триггеры для автоматического обновления
CREATE OR REPLACE FUNCTION last_non_null_state(
	state anyelement,
	value anyelement)
    RETURNS anyelement
    LANGUAGE 'plpgsql'
AS $BODY$
BEGIN
    RETURN COALESCE(value, state);
END;
$BODY$;


CREATE OR REPLACE AGGREGATE last_non_null_value(anyelement) (
    SFUNC = last_non_null_state,
    STYPE = anyelement
);

-- Триггеры для автоматического создания записей в data при INSERT/UPDATE task
CREATE OR REPLACE FUNCTION task_insert_trigger_func()
    RETURNS trigger
    LANGUAGE 'plpgsql'
AS $BODY$
BEGIN
    -- Вставляем записи для каждого дня используя generate_series
    INSERT INTO data (date, task_id)
    SELECT
        NEW.begin_date + ((n - 1) * INTERVAL '1 day'),
        NEW.id
    FROM generate_series(1, NEW.duration) AS n
    ON CONFLICT (date, task_id) DO NOTHING;

    RETURN NEW;
END;
$BODY$;

CREATE OR REPLACE TRIGGER insert_task
    AFTER INSERT ON task
    FOR EACH ROW
    EXECUTE FUNCTION task_insert_trigger_func();

CREATE OR REPLACE FUNCTION task_update_trigger_func()
    RETURNS trigger
    LANGUAGE 'plpgsql'
AS $BODY$
BEGIN
    -- Удаляем дни вне нового диапазона
    DELETE FROM data WHERE task_id = OLD.id AND (date < NEW.begin_date OR date > NEW.end_date);

    -- Вставляем новые дни в диапазоне
    INSERT INTO data (date, task_id)
    SELECT
        NEW.begin_date + ((n - 1) * INTERVAL '1 day'),
        NEW.id
    FROM generate_series(1, NEW.duration) AS n
    WHERE NOT EXISTS (SELECT 1 FROM data WHERE date = NEW.begin_date + ((n - 1) * INTERVAL '1 day') AND task_id = NEW.id);

    RETURN NEW;
END;
$BODY$;

CREATE OR REPLACE TRIGGER update_task
    AFTER UPDATE ON task
    FOR EACH ROW
    EXECUTE FUNCTION task_update_trigger_func();

-- View для отображения данных с расчетами
CREATE VIEW days AS (
    WITH q1 AS(
        SELECT
            data.id,
            data.date,
            data.task_id,
            task.name,
            task.begin_date,
            task.end_date,
            (task.end_date - data.date + 1) AS remaining_duration,
            task.weight,
            task.add_to_sum,
            task.type_id,
            task.start_value,
            task.target_value,
            task.target_change,
            (task.target_change / task.duration::DECIMAL) * ((data.date - task.begin_date + 1)::DECIMAL) AS plan_change,
            task.start_value + (task.target_change / task.duration::DECIMAL) * ((data.date - task.begin_date + 1)::DECIMAL) AS plan_value,
            data.value,
            CASE
                WHEN add_to_sum THEN
                    COALESCE(SUM(data.value) OVER w_task, 0)
                ELSE
                    COALESCE(last_non_null_value(data.value) OVER w_task - task.start_value, 0)
            END AS fact_change
        FROM
            data JOIN
            task ON data.task_id = task.id
        WINDOW w_task AS (PARTITION BY task_id ORDER BY date)
        )
    SELECT *,
        fact_change / NULLIF(date - begin_date + 1, 0) AS avg_change,
        target_change - fact_change AS remaining_change,
        --Ожидаемое значение на дату дедлайна
        (fact_change / NULLIF(date - begin_date + 1, 0)) * (remaining_duration - (value IS NOT NULL)::INTEGER) + fact_change + start_value AS expected_value,
        --Изменение в день для достижения цели (если сегодня данные уже внесены, то делим на остаток с завтрашнего дня)
        (target_change - fact_change) / NULLIF(remaining_duration - (value IS NOT NULL)::INTEGER, 0) AS daily_target_change,
        ROUND(fact_change / NULLIF(target_change, 0) * 100, 2) AS completion,
        ROUND(fact_change / NULLIF(plan_change, 0) * 100, 2) AS pace
    FROM q1
);