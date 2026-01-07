export class DaysPanel {
    constructor(selectedDate, onDateSelect) {
        this.selectedDate = selectedDate;
        this.onDateSelect = onDateSelect;
    }

    // Метод для получения названия дня
    getDayName(dayIndex) {
        const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        return days[dayIndex];
    }

    // Метод рендеринга
    render() {
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
        document.querySelectorAll('.day-button').forEach(button => {
            button.addEventListener('click', (event) => {
                const dateString = event.currentTarget.dataset.date;
                const selectedDate = new Date(dateString);
                
                // Обновляем активную кнопку
                this.updateActiveButton(event.currentTarget);
                
                // Вызываем колбэк с выбранной датой
                if (this.onDateSelect) {
                    this.onDateSelect(selectedDate);
                }
            });
        });
    }

    updateActiveButton(clickedButton) {
        // Снимаем активный класс со всех кнопок
        document.querySelectorAll('.day-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Добавляем активный класс нажатой кнопке
        clickedButton.classList.add('active');
    }
}