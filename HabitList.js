import { supabase } from './supabase.js';

export class HabitList {
    constructor(date) {
        this.date = date;
        this.habits = [];
    }

    // Метод загрузки привычек
    async load() {
        try {
            const formattedDate = this.date.toISOString().split('T')[0];
            
            // Загружаем привычки для выбранной даты
            const { data, error } = await supabase
                .from('task')
                .select('*')
                .lte('begin_date', formattedDate)
                .gte('end_date', formattedDate);

            if (error) throw error;
            
            this.habits = data || [];
            console.log('Загружено привычек:', this.habits.length);
            
        } catch (error) {
            console.error('Ошибка загрузки привычек:', error);
            this.habits = [];
        }
    }

    // Метод рендеринга
    render() {
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
    }
}