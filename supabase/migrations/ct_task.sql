DROP TABLE IF EXISTS task CASCADE;
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

