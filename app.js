import { DaysPanel } from './DaysPanel.js';
import { HabitList } from './HabitList.js';

class HabitTracker {
    constructor() {
        this.selectedDate = new Date();
        
        // Создаем компоненты
        this.daysPanel = new DaysPanel(this.selectedDate);
        this.habitList = new HabitList(this.selectedDate);
    }

    async init() {
        // Рендерим панель дней
        this.daysPanel.render();
        
        // Загружаем и рендерим привычки
        await this.habitList.load();
        this.habitList.render();
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    const app = new HabitTracker();
    app.init();
    window.app = app; // Для доступа из консоли
});