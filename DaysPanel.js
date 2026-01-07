import { log } from './Logger.js'

export class DaysPanel {
    static DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    constructor(selectedDate, onDateSelect) {
        log.debug('start');
        this.selectedDate = selectedDate;
        this.onDateSelect = onDateSelect;
    }

    // Метод для получения названия дня
    getDayName(dayIndex) {
        return DaysPanel.DAY_NAMES[dayIndex];
    }

    // Метод рендеринга
    render() {
        log.debug('start');
        const container = document.getElementById('daysContainer');

        // Получаем начало текущего дня (00:00:00)
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayTimestamp = todayStart.getTime();
        const dayInMs = 24 * 60 * 60 * 1000;

        // Создаем HTML для 7 дней
        let html = '';
        for (let i = -6; i <= 0; i++) {
            const date = new Date(todayTimestamp + (i * dayInMs));
            
            const dayName = this.getDayName(date.getDay());
            const dayNumber = date.getDate();
            const isToday = i === 0;
            const dateString = date.toISOString().split('T')[0];
            
            html += `
                <button class="day-button ${isToday ? 'active' : ''}" 
                        data-date="${dateString}">
                    <div class="day-name">${dayName}</div>
                    <div class="day-number">${dayNumber}</div>
                </button>
            `;
        }
        
        container.innerHTML = html;
        this.addEventListeners();
        log.debug('finish');
    }

    addEventListeners() {
        log.debug('start');
        // Вешаем один обработчик на контейнер
        const container = document.getElementById('daysContainer');
        
        container.addEventListener('click', (event) => {
            // Проверяем, что кликнули именно по кнопке дня
            const button = event.target.closest('.day-button');
            if (!button) return; // Если кликнули не по кнопке - выходим
            
            const dateString = button.dataset.date;
            const selectedDate = new Date(dateString);
            
            this.updateActiveButton(button);
            this.onDateSelect(selectedDate);
        });
    }

    updateActiveButton(clickedButton) {
        log.debug('start');
        // Снимаем активный класс со всех кнопок
        document.querySelectorAll('.day-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Добавляем активный класс нажатой кнопке
        clickedButton.classList.add('active');
    }
}