import { log } from './Logger.js'
import { DaysPanel } from './DaysPanel.js';
import { HabitList } from './HabitList.js';

class Main {
    constructor() {
        log.debug('start');
        this.selectedDate = new Date();
        
        // Создаем компоненты
        this.daysPanel = new DaysPanel(
            this.selectedDate,
            this.onDateSelect.bind(this)
        );
        this.habitList = new HabitList(this.selectedDate);
        log.debug('finish');
    }

    async init() {
        log.debug('start');
        // Рендерим панель дней
        this.daysPanel.render();
        
        // Загружаем и рендерим привычки
        await this.habitList.load();
        this.habitList.render();
        log.debug('finish');
    }

    async onDateSelect(date) {
        log.debug('start');
        this.selectedDate = date;
        
        // Обновляем привычки для выбранной даты
        await this.habitList.updateDate(date);
        log.debug('finish');
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    log.debug('start');
    const app = new Main();
    app.init();
    // window.app = app; // Для доступа из консоли
    log.debug('finish');
});