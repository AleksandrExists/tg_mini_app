import { supabase } from './supabase.js';
import { log } from './Logger.js';

export class HabitList {
    constructor(date) {
        log.in();
        this.date = date;
        this.habits = [];
        this.debouncedSave = this.debounce(this.saveHabit.bind(this), 500);
        log.out();
    }

    // Метод загрузки привычек
    async load() {
        log.in();
        try {
            const formattedDate = this.date.toISOString().split('T')[0];
            
            // Загружаем привычки для выбранной даты
            const { data, error } = await supabase
                .from('days')
                .select('*')
                .eq('date', formattedDate);

            if (error) throw error;
            
            this.habits = data || [];
            log.info('Загружено:', this.habits.length);
            
        } catch (error) {
            log.error('Ошибка загрузки')
            this.habits = [];
        }
        log.out();
    }

    // Метод рендеринга
    render() {
        log.in();
        const container = document.getElementById('habitsContainer');

        if (this.habits.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>📝 На этот день ничего нет</p>
                </div>
            `;
            return;
        }

        // Рендерим список привычек
        let html = '';
        this.habits.forEach(habit => {
            html += `
                <div class="habit-item">
                    <div class="habit-name">${habit.name}</div>
                    <input type="number"
                           class="habit-value"
                           data-id="${habit.id}"
                           value="${habit.value}">
                </div>
            `;
        });

        container.innerHTML = html;

        // Добавляем обработчики событий после рендеринга
        this.setupEventListeners();
        log.out();
    }

    async updateDate(date) {
        log.in();
        this.date = date;
        await this.load();    // Перезагружаем привычки для новой даты
        this.render();        // Перерисовываем список
        log.out();
    }

    // Метод сохранения значения привычки
    async saveHabit(id, value) {
        log.in();
        try {
            const { error } = await supabase
                .from('data')
                .update({ value: parseInt(value) || 0 })
                .eq('id', id);

            if (error) throw error;
            log.info('Сохранено:', id, value);
        } catch (error) {
            log.error('Ошибка сохранения:', error);
        }
        log.out();
    }

    // Настройка обработчиков событий
    setupEventListeners() {
        log.in();
        const inputs = document.querySelectorAll('.habit-value');
        inputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const id = e.target.dataset.id;
                const value = e.target.value;
                this.debouncedSave(id, value);
            });
        });
        log.out();
    }

    // Debounce helper
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}
