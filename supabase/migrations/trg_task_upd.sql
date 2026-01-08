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
