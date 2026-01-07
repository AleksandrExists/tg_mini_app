export class DaysPanel {
    constructor(selectedDate) {
        this.selectedDate = selectedDate;
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
            
            html += `
                <button class="day-button ${isToday ? 'active' : ''}">
                    <div class="day-name">${dayName}</div>
                    <div class="day-number">${dayNumber}</div>
                </button>
            `;
        }
        
        container.innerHTML = html;
    }
}