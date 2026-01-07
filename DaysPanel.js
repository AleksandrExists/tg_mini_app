import { log } from './Logger.js'

export class DaysPanel {
    constructor(selectedDate, onDateSelect) {
        log.debug('start');
        this.selectedDate = selectedDate;
        this.onDateSelect = onDateSelect;
    }

    // Метод для получения названия дня
    getDayName(dayIndex) {
        log.debug('start');
        const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        return days[dayIndex];
    }

    // Метод рендеринга
    render() {
        log.debug('start');
        const container = document.getElementById('daysContainer');
        
        // Создаем 7 дней (от -6 до текущего)
        let html = '';
        for (let i = -6; i <= 0; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            
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