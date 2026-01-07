import { DaysPanel } from './DaysPanel.js';
import { HabitList } from './HabitList.js';

class HabitTracker {
    constructor() {
        this.selectedDate = new Date();
        
        // Создаем компоненты
        this.daysPanel = new DaysPanel(
            this.selectedDate,
            this.onDateSelect.bind(this)
        );
        this.habitList = new HabitList(this.selectedDate);
    }

    async init() {
        // Рендерим панель дней
        this.daysPanel.render();
        
        // Загружаем и рендерим привычки
        await this.habitList.load();
        this.habitList.render();
    }

    async onDateSelect(date) {
        this.selectedDate = date;
        
        // Обновляем привычки для выбранной даты
        await this.habitList.updateDate(date);
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    const app = new HabitTracker();
    app.init();
    window.app = app; // Для доступа из консоли
});