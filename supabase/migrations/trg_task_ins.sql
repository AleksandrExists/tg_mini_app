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
