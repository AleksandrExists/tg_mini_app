import { supabase } from './supabase.js';

class HabitTracker {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.habits = [];
        this.daysData = {};
        
        this.init();
    }

    async init() {
        this.renderDays();
        await this.loadHabits();
        this.renderHabits();
    }

    // === РЕНДЕРИНГ ДНЕЙ ===
    renderDays() {
        const daysContainer = document.getElementById('daysContainer');
        daysContainer.innerHTML = '';
        
        for (let i = -6; i <= 0; i++) {
            const date = new Date();
            date.setDate(this.currentDate.getDate() + i);
            
            const dayButton = document.createElement('button');
            dayButton.className = 'day-button';
            
            const isSelected = date.toDateString() === this.selectedDate.toDateString();
            
            if (isSelected) {
                dayButton.classList.add('active');
            }
            
            const dayName = this.getDayName(date.getDay());
            const dayNumber = date.getDate();
            
            dayButton.innerHTML = `
                <div class="day-name">${dayName}</div>
                <div class="day-number">${dayNumber}</div>
            `;
            
            dayButton.addEventListener('click', () => {
                this.selectDate(date);
            });
            
            daysContainer.appendChild(dayButton);
        }
    }

    getDayName(dayIndex) {
        const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        return days[dayIndex];
    }

    selectDate(date) {
        this.selectedDate = date;
        this.renderDays();
        this.loadHabits().then(() => {
            this.renderHabits();
        });
    }

    async loadHabits() {
        try {
            const formattedDate = this.selectedDate.toISOString().split('T')[0];

            const { data: tasks, error } = await supabase
                .from('task')
                .select('*')
                .lte('begin_date', formattedDate)
                .gte('end_date', formattedDate);

            if (error) throw error;

            this.habits = tasks || [];

        } catch (error) {
            console.error('Ошибка загрузки:', error);
            // this.showNotification('Не удалось загрузить', 'error');
        }
    }

    renderHabits() {
        const habitsContainer = document.getElementById('habitsContainer');
        
        if (this.habits.length === 0) {
            habitsContainer.innerHTML = `
                <div class="empty-state">
                    <p>📝 На этот день ничего нет</p>
                </div>
            `;
            return;
        }

        const formattedDate = this.selectedDate.toISOString().split('T')[0];
        habitsContainer.innerHTML = this.habits.map(habit => {
            const isCompleted = this.daysData[habit.id]?.completed || false;
            
            return `
                <div class="habit-item" data-id="${habit.id}">
                    <div class="habit-checkbox ${isCompleted ? 'checked' : ''}" 
                         onclick="app.toggleHabit(${habit.id}, '${formattedDate}')">
                        ${isCompleted ? '✓' : ''}
                    </div>
                    <div style="flex: 1;">
                        <div class="habit-name">${habit.name}</div>
                        ${habit.description ? `<div class="habit-description">${habit.description}</div>` : ''}
                    </div>
                    <div class="habit-actions">
                        <button class="action-btn" onclick="app.editHabit(${habit.id})">✏️</button>
                        <button class="action-btn" onclick="app.deleteHabit(${habit.id})">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// Инициализация приложения
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new HabitTracker();
    window.app = app; // Делаем доступным глобально
});