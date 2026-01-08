# Система миграций БД

## Структура
- `schema.sql` - Полная схема БД для создания с нуля
- `migrations/` - Индивидуальные миграции для изменений
- `config.prod.js` - Конфиг для production базы
- `config.dev.js` - Конфиг для development базы

## Использование

### Первоначальная настройка
1. Создайте dev проект в Supabase
2. Обновите `config.dev.js` ключами от dev проекта
3. Выполните `schema.sql` в dev базе через Supabase Dashboard

### Добавление миграций
1. Создайте новый файл в `migrations/` с номером (001, 002, etc.)
2. Добавьте SQL код для изменения схемы
3. Примените к dev базе, протестируйте
4. Примените к prod базе (с backup!)

### Примеры миграций
```sql
-- Добавление новой колонки
ALTER TABLE task ADD COLUMN priority INTEGER DEFAULT 1;

-- Создание индекса
CREATE INDEX idx_task_begin_date ON task(begin_date);
```

## Production vs Development
- **Prod база**: реальные данные пользователей
- **Dev база**: для тестирования изменений
- Всегда backup перед применением миграций к prod!

## Рабочий процесс
1. Вносите изменения в dev базу
2. Тестируйте функционал
3. Создайте migration файл
4. Примените к prod с backup