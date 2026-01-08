UPDATE data
SET
    value = q.new_value
FROM (VALUES
    ('2026-01-06'::DATE, 5, 40),
    ('2026-01-07'::DATE, 5, 60),
    ('2026-01-08'::DATE, 5, 80),
    ('2026-01-06'::DATE, 6, 540),
    ('2026-01-07'::DATE, 6, 620),
    ('2026-01-08'::DATE, 6, 450)
) AS q(date, task_id, new_value)
WHERE data.task_id = q.task_id AND data.date = q.date;