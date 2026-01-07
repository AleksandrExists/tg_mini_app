import { supabase } from './supabase.js';
import { log } from './Logger.js';

export class HabitList {
    constructor(date) {
        log.debug('start');
        this.date = date;
        this.habits = [];
        log.debug('finish');
    }

    // Метод загрузки привычек
    async load() {
        log.debug('start');
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
        log.debug('finish');
    }

    // Метод рендеринга
    render() {
        log.debug('start');
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
                </div>
            `;
        });
        
        container.innerHTML = html;
        log.debug('finish');
    }

    async updateDate(date) {
        log.debug('start');
        this.date = date;
        await this.load();    // Перезагружаем привычки для новой даты
        this.render();        // Перерисовываем список
        log.debug('finish');
    }
}