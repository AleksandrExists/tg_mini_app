import { log } from './Logger.js'
import { DaysPanel } from './DaysPanel.js';
import { HabitList } from './HabitList.js';

class Main {
    constructor() {
        log.in();
        this.selectedDate = new Date();
        
        // Создаем компоненты
        this.daysPanel = new DaysPanel(this.selectedDate);
        this.habitList = new HabitList(this.selectedDate);
        log.out();
    }

    async init() {
        log.in();
        // Рендерим панель дней
        this.daysPanel.render();
        
        // Настраиваем обработчики событий
        this.setupEventListeners();
        
        // Загружаем и рендерим привычки
        await this.habitList.load();
        this.habitList.render();
        log.out();
    }

    // Настройка всех обработчиков событий
    setupEventListeners() {
        log.in();
        const daysContainer = document.getElementById('daysContainer');
        
        // Один обработчик на всю панель дней
        daysContainer.addEventListener('click', this.handleDayClick.bind(this));
        log.out();
    }

    // Обработчик кликов по дням
    handleDayClick(event) {
        log.in();
        const button = event.target.closest('.day-button');
        if (!button) return; // Клик не по кнопке дня
        
        const dateString = button.dataset.date;
        const selectedDate = new Date(dateString);
        
        // Обновляем UI
        this.daysPanel.updateActiveButton(button);
        
        // Выполняем бизнес-логику
        this.onDateSelect(selectedDate);
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