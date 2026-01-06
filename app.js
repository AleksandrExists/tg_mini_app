import { supabase } from './supabase.js';

class HabitTracker {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.habits = [];
        this.daysData = {};
        this.currentView = 'habits'; // 'habits' или 'reports'
        this.reportPeriod = 'week'; // 'week', 'month', 'year'
        
        this.init();
    }

    async init() {
        // Инициализация Telegram Web App
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.ready();
            Telegram.WebApp.expand();
            Telegram.WebApp.setHeaderColor('#007aff');
            Telegram.WebApp.setBackgroundColor('#f5f5f5');
        }

        this.setupEventListeners();
        this.renderDays();
        await this.loadHabits();
        this.renderHabits();
    }

    setupEventListeners() {
        // Кнопка добавления
        document.getElementById('addHabitBtn').addEventListener('click', () => {
            this.showAddHabitModal();
        });

        // Кнопка отчетов
        document.getElementById('reportsBtn').addEventListener('click', () => {
            this.switchToReports();
        });

        // Кнопка назад
        document.getElementById('backBtn').addEventListener('click', () => {
            this.switchToHabits();
        });

        // Модальное окно
        document.getElementById('closeModal').addEventListener('click', () => {
            this.hideAddHabitModal();
        });

        // Форма добавления
        document.getElementById('addHabitForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addNewHabit();
        });

        // Кнопки периода отчетов
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const period = e.target.dataset.period;
                this.changeReportPeriod(period);
            });
        });
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
            
            const isToday = i === 0;
            const isSelected = date.toDateString() === this.selectedDate.toDateString();
            
            if (isToday || isSelected) {
                if (isToday) this.selectedDate = date;
                if (isSelected || isToday) dayButton.classList.add('active');
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

    getMonthName(monthIndex) {
        const months = [
            'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
            'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'
        ];
        return months[monthIndex];
    }

    // === РАБОТА С ДАТАМИ ===
    selectDate(date) {
        this.selectedDate = date;
        this.renderDays();
        
        if (this.currentView === 'habits') {
            this.loadHabits().then(() => {
                this.renderHabits();
            });
        }
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
            
            const { data: completions, error: completionsError } = await supabase
                .from('data')
                .select('*')
                .eq('date', formattedDate);

            if (completionsError) throw completionsError;

            this.daysData = {};
            completions?.forEach(record => {
                this.daysData[record.task_id] = record;
            });

        } catch (error) {
            console.error('Ошибка загрузки:', error);
            this.showNotification('Не удалось загрузить', 'error');
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

    async toggleHabit(habitId, date) {
        try {
            const existingRecord = this.daysData[habitId];
            
            if (existingRecord) {
                const { error } = await supabase
                    .from('data')
                    .update({
                        completed: !existingRecord.completed,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existingRecord.id);

                if (error) throw error;
                this.daysData[habitId].completed = !existingRecord.completed;
            } else {
                const { error } = await supabase
                    .from('data')
                    .insert([{
                        task_id: habitId,
                        date: date,
                        completed: true,
                        created_at: new Date().toISOString()
                    }]);

                if (error) throw error;
                this.daysData[habitId] = { task_id: habitId, date, completed: true };
            }

            this.renderHabits();

        } catch (error) {
            console.error('Ошибка обновления статуса:', error);
            this.showNotification('Не удалось обновить статус', 'error');
        }
    }

    async editHabit(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return;

        const newName = prompt('Введите новое название:', habit.name);
        if (!newName) return;

        try {
            const { error } = await supabase
                .from('task')
                .update({ name: newName })
                .eq('id', habitId);

            if (error) throw error;

            await this.loadHabits();
            this.renderHabits();
            this.showNotification('Обновлено!', 'success');

        } catch (error) {
            console.error('Ошибка обновления:', error);
            this.showNotification('Не удалось обновить', 'error');
        }
    }

    async deleteHabit(habitId) {
        if (!confirm('Удалить?')) return;

        try {
            const { error } = await supabase
                .from('task')
                .delete()
                .eq('id', habitId);

            if (error) throw error;

            await this.loadHabits();
            this.renderHabits();
            this.showNotification('Удалено!', 'success');

        } catch (error) {
            console.error('Ошибка удаления:', error);
            this.showNotification('Не удалось удалить', 'error');
        }
    }

    showAddHabitModal() {
        const today = new Date().toISOString().split('T')[0];
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        const nextYearStr = nextYear.toISOString().split('T')[0];
        
        document.getElementById('habitBeginDate').value = today;
        document.getElementById('habitEndDate').value = nextYearStr;
        document.getElementById('addHabitModal').classList.add('active');
    }

    hideAddHabitModal() {
        document.getElementById('addHabitModal').classList.remove('active');
        document.getElementById('addHabitForm').reset();
    }

    async addNewHabit() {
        const name = document.getElementById('habitName').value.trim();
        const description = document.getElementById('habitDescription').value.trim();
        const beginDate = document.getElementById('habitBeginDate').value;
        const endDate = document.getElementById('habitEndDate').value;

        if (!name) {
            this.showNotification('Введите название', 'error');
            return;
        }

        try {
            const { data, error } = await supabase
                .from('task')
                .insert([{
                    name,
                    description,
                    begin_date: beginDate,
                    end_date: endDate,
                    created_at: new Date().toISOString()
                }])
                .select();

            if (error) throw error;

            this.hideAddHabitModal();
            await this.loadHabits();
            this.renderHabits();
            this.showNotification('Добавлено!', 'success');

        } catch (error) {
            console.error('Ошибка добавления:', error);
            this.showNotification('Не удалось добавить', 'error');
        }
    }

    // === ОТЧЕТЫ ===
    async switchToReports() {
        this.currentView = 'reports';
        document.getElementById('habitsSection').classList.add('hidden');
        document.getElementById('reportsSection').classList.remove('hidden');
        document.getElementById('backBtn').classList.add('visible');
        document.getElementById('daysContainer').classList.add('hidden');
        document.getElementById('reportsBtn').classList.add('hidden');
        
        await this.loadReports();
    }

    switchToHabits() {
        this.currentView = 'habits';
        document.getElementById('habitsSection').classList.remove('hidden');
        document.getElementById('reportsSection').classList.add('hidden');
        document.getElementById('backBtn').classList.remove('visible');
        document.getElementById('daysContainer').classList.remove('hidden');
        document.getElementById('reportsBtn').classList.remove('hidden');
        
        this.renderHabits();
    }

    changeReportPeriod(period) {
        this.reportPeriod = period;
        this.loadReports();
        
        // Обновляем активную кнопку периода
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-period="${period}"]`).classList.add('active');
    }

    async loadReports() {
        try {
            const reportsContainer = document.getElementById('reportsContainer');
            reportsContainer.innerHTML = '<div class="loading">Загрузка отчетов...</div>';
            
            // Определяем даты для периода
            let startDate, endDate = new Date();
            
            switch(this.reportPeriod) {
                case 'week':
                    startDate = new Date();
                    startDate.setDate(endDate.getDate() - 6);
                    break;
                case 'month':
                    startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
                    break;
                case 'year':
                    startDate = new Date(endDate.getFullYear(), 0, 1);
                    break;
            }
            
            const { data: tasks, error: tasksError } = await supabase
                .from('task')
                .select('*')
                .lte('begin_date', endDate.toISOString().split('T')[0])
                .gte('end_date', startDate.toISOString().split('T')[0]);

            if (tasksError) throw tasksError;

            // Загружаем данные о выполнении за период
            const { data: completions, error: completionsError } = await supabase
                .from('data')
                .select('*')
                .gte('date', startDate.toISOString().split('T')[0])
                .lte('date', endDate.toISOString().split('T')[0]);

            if (completionsError) throw completionsError;

            // Генерируем отчет
            this.generateReport(tasks || [], completions || [], startDate, endDate);

        } catch (error) {
            console.error('Ошибка загрузки отчетов:', error);
            reportsContainer.innerHTML = '<div class="empty-state">Не удалось загрузить отчеты</div>';
        }
    }

    generateReport(tasks, completions, startDate, endDate) {
        const reportsContainer = document.getElementById('reportsContainer');
        
        if (tasks.length === 0) {
            reportsContainer.innerHTML = `
                <div class="empty-state">
                    <p>📊 Нет данных для отчета</p>
                </div>
            `;
            return;
        }

        // Рассчитываем статистику
        const totalHabits = tasks.length;
        const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        const maxPossibleCompletions = totalHabits * totalDays;
        
        let totalCompletions = 0;
        const habitStats = {};
        
        // Инициализируем статистику
        tasks.forEach(habit => {
            habitStats[habit.id] = {
                name: habit.name,
                total: 0,
                possible: 0
            };
        });
        
        // Считаем выполнения по дням
        const dailyStats = {};
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            dailyStats[dateStr] = 0;
        }
        
        // Обрабатываем выполнения
        completions.forEach(record => {
            if (record.completed && habitStats[record.task_id]) {
                totalCompletions++;
                habitStats[record.task_id].total++;
                
                const date = new Date(record.date);
                const dateStr = date.toISOString().split('T')[0];
                if (dailyStats[dateStr] !== undefined) {
                    dailyStats[dateStr]++;
                }
            }
        });
        
        // Считаем возможные выполнения
        tasks.forEach(habit => {
            let possible = 0;
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                if (dateStr >= habit.begin_date && dateStr <= habit.end_date) {
                    possible++;
                }
            }
            habitStats[habit.id].possible = possible;
        });
        
        // Рассчитываем проценты
        const completionRate = maxPossibleCompletions > 0 
            ? Math.round((totalCompletions / maxPossibleCompletions) * 100) 
            : 0;
        
        const avgDaily = totalDays > 0 
            ? Math.round(totalCompletions / totalDays) 
            : 0;
        
        // Сортируем по проценту выполнения
        const sortedHabits = Object.values(habitStats)
            .filter(h => h.possible > 0)
            .map(h => ({
                ...h,
                percentage: Math.round((h.total / h.possible) * 100)
            }))
            .sort((a, b) => b.percentage - a.percentage);
        
        // Генерируем HTML отчета
        let reportHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${totalHabits}</div>
                    <div class="stat-label">Всего</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${totalCompletions}</div>
                    <div class="stat-label">Выполнений</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${completionRate}%</div>
                    <div class="stat-label">Успешность</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${avgDaily}</div>
                    <div class="stat-label">В день</div>
                </div>
            </div>
            
            <div class="chart-container" id="chartContainer">
                <div class="chart-title">Активность по дням</div>
            </div>
            
            <div class="report-habits">
                <h3 style="margin-bottom: 16px; color: #333;">Статистика</h3>
        `;
        
        sortedHabits.forEach(habit => {
            reportHTML += `
                <div class="report-habit-item">
                    <div class="report-habit-name">${habit.name}</div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div class="report-habit-stats">${habit.total}/${habit.possible}</div>
                        <div class="report-habit-percentage">${habit.percentage}%</div>
                    </div>
                </div>
            `;
        });
        
        reportHTML += `</div>`;
        
        reportsContainer.innerHTML = reportHTML;
        
        // Рисуем график
        this.drawChart(dailyStats, totalHabits);
    }

    drawChart(dailyStats, totalHabits) {
        const chartContainer = document.getElementById('chartContainer');
        const chartData = Object.entries(dailyStats);
        
        if (chartData.length === 0) return;
        
        const chartWidth = chartContainer.offsetWidth - 32;
        const chartHeight = 150;
        const barWidth = chartWidth / chartData.length * 0.7;
        const gap = chartWidth / chartData.length * 0.3;
        
        chartData.forEach(([dateStr, count], index) => {
            const date = new Date(dateStr);
            const barHeight = totalHabits > 0 ? (count / totalHabits) * chartHeight : 0;
            const x = index * (barWidth + gap);
            
            const bar = document.createElement('div');
            bar.className = 'chart-bar';
            bar.style.left = `${x}px`;
            bar.style.width = `${barWidth}px`;
            bar.style.height = `${barHeight}px`;
            
            const label = document.createElement('div');
            label.className = 'chart-day-label';
            label.style.left = `${x}px`;
            label.style.width = `${barWidth}px`;
            label.textContent = `${date.getDate()} ${this.getMonthName(date.getMonth())}`;
            
            chartContainer.appendChild(bar);
            chartContainer.appendChild(label);
        });
    }

    // === УТИЛИТЫ ===
    showNotification(message, type = 'info') {
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.showAlert(message);
        } else {
            alert(message);
        }
    }
}

// Инициализация приложения
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new HabitTracker();
    window.app = app; // Делаем доступным глобально
});