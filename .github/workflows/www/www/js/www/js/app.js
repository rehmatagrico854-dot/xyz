(function () {
  'use strict';

  let tasks = Storage.getTasks();       // {id, title, remarks, status, createdAt, dateKey}
  let reminders = Storage.getReminders(); // {id, title, remarks, date, time, notified}

  let calCursor = new Date();      // month currently shown on full calendar
  let selectedDate = new Date();   // selected day on full calendar

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function dateKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function todayKey() { return dateKey(new Date()); }

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DOWS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  /* ---------------- CLOCK ---------------- */
  function tickClock() {
    const now = new Date();
    let h = now.getHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12; if (h === 0) h = 12;
    $('#timeNow').textContent = pad(h) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds()) + ' ' + ampm;
    $('#dateNow').textContent = now.getDate() + ' ' + MONTHS[now.getMonth()].slice(0,3) + ' ' + now.getFullYear();
  }

  /* ---------------- NAV ---------------- */
  function showPage(name) {
    $$('.tab-page').forEach(p => p.classList.remove('active'));
    $('#page-' + name).classList.add('active');
    $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.page === name));
    if (name === 'calendar') renderFullCalendar();
    if (name === 'dashboard') renderMiniCalendar();
  }

  $$('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => showPage(btn.dataset.page));
  });

  /* ---------------- TASKS ---------------- */
  function addTask(title, remarks) {
    tasks.push({
      id: Storage.uid(),
      title: title.trim(),
      remarks: (remarks || '').trim(),
      status: 'pending',
      createdAt: Date.now(),
      dateKey: todayKey()
    });
    Storage.saveTasks(tasks);
    renderAll();
  }

  function setStatus(id, status) {
    const t = tasks.find(x => x.id === id);
    if (t) { t.status = status; Storage.saveTasks(tasks); renderAll(); }
  }

  function deleteTask(id) {
    tasks = tasks.filter(x => x.id !== id);
    Storage.saveTasks(tasks);
    renderAll();
  }

  function updateRemarks(id, remarks) {
    const t = tasks.find(x => x.id === id);
    if (t) { t.remarks = remarks; Storage.saveTasks(tasks); renderAll(); }
  }

  function taskItemHTML(t) {
    const doneClass = t.status === 'completed' ? 'done' : '';
    const dateStr = t.dateKey;
    return `
      <div class="task-item ${doneClass}" data-id="${t.id}">
        <div class="row-top">
          <div class="title">${escapeHtml(t.title)}</div>
        </div>
        <div class="meta">${dateStr}${t.status === 'completed' ? ' · Completed' : ' · Pending'}</div>
        ${t.remarks ? `<div class="remarks">${escapeHtml(t.remarks)}</div>` : ''}
        <div class="task-actions">
          ${t.status === 'pending'
            ? `<button class="complete-btn" data-action="complete">Mark Done</button>`
            : `<button class="undo-btn" data-action="undo">Undo</button>`}
          <button class="remarks-btn" data-action="remarks">Remarks</button>
          <button class="delete-btn" data-action="delete">Delete</button>
        </div>
      </div>`;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderTaskLists() {
    const pending = tasks.filter(t => t.status === 'pending').sort((a,b)=>b.createdAt-a.createdAt);
    const completed = tasks.filter(t => t.status === 'completed').sort((a,b)=>b.createdAt-a.createdAt);

    $('#pendingList').innerHTML = pending.map(taskItemHTML).join('');
    $('#pendingEmpty').style.display = pending.length ? 'none' : 'block';

    $('#completedList').innerHTML = completed.map(taskItemHTML).join('');
    $('#completedEmpty').style.display = completed.length ? 'none' : 'block';

    $('#sumPending').textContent = pending.length;
    $('#sumCompleted').textContent = completed.length;
    $('#sumReminders').textContent = reminders.length;
  }

  // Delegate task actions
  ['pendingList','completedList','selectedDayTasks'].forEach(id => {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const container = e.target.closest('.task-list');
      if (!container || container.id !== id) return;
      const itemEl = e.target.closest('.task-item');
      const taskId = itemEl.dataset.id;
      const action = btn.dataset.action;
      if (action === 'complete') setStatus(taskId, 'completed');
      if (action === 'undo') setStatus(taskId, 'pending');
      if (action === 'delete') { if (confirm('Delete this task?')) deleteTask(taskId); }
      if (action === 'remarks') openRemarksModal(taskId);
    });
  });

  /* ---------------- QUICK ADD ---------------- */
  $('#quickAddForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = $('#quickTaskTitle').value;
    const remarks = $('#quickTaskRemarks').value;
    if (!title.trim()) return;
    addTask(title, remarks);
    $('#quickTaskTitle').value = '';
    $('#quickTaskRemarks').value = '';
  });

  /* ---------------- REMARKS MODAL ---------------- */
  let modalTaskId = null;
  function openRemarksModal(taskId) {
    const t = tasks.find(x => x.id === taskId);
    if (!t) return;
    modalTaskId = taskId;
    $('#modalTitle').textContent = 'Remarks — ' + t.title;
    $('#modalRemarks').value = t.remarks || '';
    $('#modalOverlay').classList.add('active');
  }
  $('#modalSave').addEventListener('click', () => {
    if (modalTaskId) updateRemarks(modalTaskId, $('#modalRemarks').value);
    $('#modalOverlay').classList.remove('active');
  });
  $('#modalCancel').addEventListener('click', () => {
    $('#modalOverlay').classList.remove('active');
  });

  /* ---------------- REMINDERS ---------------- */
  function addReminder(title, date, time, remarks) {
    reminders.push({
      id: Storage.uid(),
      title: title.trim(),
      date, time,
      remarks: (remarks || '').trim(),
      notified: false
    });
    Storage.saveReminders(reminders);
    renderReminders();
  }
  function deleteReminder(id) {
    reminders = reminders.filter(r => r.id !== id);
    Storage.saveReminders(reminders);
    renderReminders();
  }

  function reminderItemHTML(r) {
    return `
      <div class="task-item" data-id="${r.id}">
        <div class="row-top">
          <div class="title">${escapeHtml(r.title)}</div>
        </div>
        <div class="meta">${r.date} at ${r.time}</div>
        ${r.remarks ? `<div class="remarks">${escapeHtml(r.remarks)}</div>` : ''}
        <div class="task-actions">
          <button class="delete-btn" data-action="delete-reminder">Delete</button>
        </div>
      </div>`;
  }

  function renderReminders() {
    const sorted = [...reminders].sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time));
    $('#reminderList').innerHTML = sorted.map(reminderItemHTML).join('');
    $('#reminderEmpty').style.display = reminders.length ? 'none' : 'block';
    $('#sumReminders').textContent = reminders.length;
  }

  $('#reminderList').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action="delete-reminder"]');
    if (!btn) return;
    const id = e.target.closest('.task-item').dataset.id;
    if (confirm('Delete this reminder?')) deleteReminder(id);
  });

  $('#reminderForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = $('#reminderTitle').value;
    const date = $('#reminderDate').value;
    const time = $('#reminderTime').value;
    const remarks = $('#reminderRemarks').value;
    if (!title.trim() || !date || !time) return;
    addReminder(title, date, time, remarks);
    e.target.reset();
  });

  function checkReminders() {
    const now = new Date();
    reminders.forEach(r => {
      if (r.notified) return;
      const target = new Date(r.date + 'T' + r.time + ':00');
      if (target <= now) {
        r.notified = true;
        fireNotification(r.title, r.remarks);
      }
    });
    Storage.saveReminders(reminders);
  }

  function fireNotification(title, body) {
    // Cordova local notification plugin, if present
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.notification) {
      window.cordova.plugins.notification.local.schedule({
        title: 'Reminder: ' + title,
        text: body || '',
        foreground: true
      });
    } else if (window.Notification) {
      if (Notification.permission === 'granted') {
        new Notification('Reminder: ' + title, { body: body || '' });
      }
    }
  }

  if (window.Notification && Notification.permission === 'default') {
    try { Notification.requestPermission(); } catch (e) {}
  }

  /* ---------------- CALENDARS ---------------- */
  function tasksOnDate(key) {
    return tasks.filter(t => t.dateKey === key);
  }

  function buildCalendarGrid(year, month, container, opts) {
    opts = opts || {};
    const first = new Date(year, month, 1);
    const startDow = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todK = todayKey();

    let html = '<div class="cal-grid">';
    DOWS.forEach(d => html += `<div class="dow">${d}</div>`);
    for (let i = 0; i < startDow; i++) html += `<div class="day empty"></div>`;

    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month, d);
      const key = dateKey(dt);
      const classes = ['day'];
      if (key === todK) classes.push('today');
      if (opts.selected && key === opts.selected) classes.push('selected');
      if (tasksOnDate(key).length) classes.push('has-task');
      html += `<div class="${classes.join(' ')}" data-key="${key}">${d}</div>`;
    }
    html += '</div>';
    container.innerHTML = html;
  }

  function renderMiniCalendar() {
    const now = new Date();
    buildCalendarGrid(now.getFullYear(), now.getMonth(), $('#miniCalendar'), { selected: todayKey() });
  }

  function renderFullCalendar() {
    $('#calMonthLabel').textContent = MONTHS[calCursor.getMonth()] + ' ' + calCursor.getFullYear();
    buildCalendarGrid(calCursor.getFullYear(), calCursor.getMonth(), $('#fullCalendar'), { selected: dateKey(selectedDate) });
    renderSelectedDayTasks();
  }

  function renderSelectedDayTasks() {
    const key = dateKey(selectedDate);
    $('#selectedDayLabel').textContent = 'Tasks on ' + key;
    const dayTasks = tasksOnDate(key);
    $('#selectedDayTasks').innerHTML = dayTasks.length
      ? dayTasks.map(taskItemHTML).join('')
      : '<p class="empty-msg">No tasks on this date.</p>';
  }

  $('#fullCalendar').addEventListener('click', (e) => {
    const dayEl = e.target.closest('.day[data-key]');
    if (!dayEl) return;
    const [y,m,d] = dayEl.dataset.key.split('-').map(Number);
    selectedDate = new Date(y, m - 1, d);
    renderFullCalendar();
  });

  $('#calPrev').addEventListener('click', () => {
    calCursor.setMonth(calCursor.getMonth() - 1);
    renderFullCalendar();
  });
  $('#calNext').addEventListener('click', () => {
    calCursor.setMonth(calCursor.getMonth() + 1);
    renderFullCalendar();
  });

  /* ---------------- INIT ---------------- */
  function renderAll() {
    renderTaskLists();
    renderReminders();
    if ($('#page-calendar').classList.contains('active')) renderFullCalendar();
    if ($('#page-dashboard').classList.contains('active')) renderMiniCalendar();
  }

  function init() {
    // default reminder date/time inputs to now
    const now = new Date();
    $('#reminderDate').value = dateKey(now);
    $('#reminderTime').value = pad(now.getHours()) + ':' + pad(now.getMinutes());

    tickClock();
    setInterval(tickClock, 1000);
    setInterval(checkReminders, 15000);
    checkReminders();

    renderAll();
    renderMiniCalendar();
  }

  document.addEventListener('deviceready', init, false);
  // Fallback for plain-browser testing (no Cordova present)
  if (!window.cordova) {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
