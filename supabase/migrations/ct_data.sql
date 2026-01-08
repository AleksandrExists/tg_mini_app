DROP TABLE IF EXISTS data CASCADE;
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