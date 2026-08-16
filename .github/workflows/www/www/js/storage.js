// Simple localStorage-backed data layer for Work Sheet app
const Storage = (function () {
  const TASKS_KEY = 'worksheet_tasks_v1';
  const REMINDERS_KEY = 'worksheet_reminders_v1';

  function _read(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Storage read error', e);
      return [];
    }
  }
  function _write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage write error', e);
    }
  }

  return {
    getTasks() { return _read(TASKS_KEY); },
    saveTasks(tasks) { _write(TASKS_KEY, tasks); },

    getReminders() { return _read(REMINDERS_KEY); },
    saveReminders(reminders) { _write(REMINDERS_KEY, reminders); },

    uid() {
      return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    }
  };
})();
