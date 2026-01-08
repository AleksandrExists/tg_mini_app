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


DROP VIEW IF EXISTS days CASCADE;
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
            --task.weight,
            --task.add_to_sum,
            --task.type_id,
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