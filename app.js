import { log } from './Logger.js'
import { DaysPanel } from './DaysPanel.js';
import { HabitList } from './HabitList.js';

class Main {
    constructor() {
        log.in();
        this.selectedDate = new Date();
        
        // Создаем компоненты
        this.daysPanel = new DaysPanel(
            this.selectedDate,
            this.onDateSelect.bind(this)
        );
        this.habitList = new HabitList(this.selectedDate);
        log.out();
    }

    async init() {
        log.in();
        // Рендерим панель дней
        this.daysPanel.render();
        
        // Загружаем и рендерим привычки
        await this.habitList.load();
        this.habitList.render();
        log.out();
    }

    async onDateSelect(date) {
        log.in();
        this.selectedDate = date;
        
        // Обновляем привычки для выбранной даты
        await this.habitList.updateDate(date);
        log.out();
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    log.in();
    const app = new Main();
    app.init();
    // window.app = app; // Для доступа из консоли
    log.out();
});