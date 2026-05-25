export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isYmd(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + 'T00:00:00');
  return !Number.isNaN(parsed.getTime()) && ymd(parsed) === value;
}

export function dayNumber(dateStr) {
  if (!isYmd(dateStr)) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

export function daysBetween(fromDateStr, toDateStr) {
  const from = dayNumber(fromDateStr);
  const to = dayNumber(toDateStr);
  if (from === null || to === null) return 0;
  return to - from;
}

export function uid() {
  return 't_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
}

export function isValidReminderTime(time24) {
  if (typeof time24 !== 'string' || !/^\d{2}:\d{2}$/.test(time24)) return false;
  const [h, m] = time24.split(':').map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

export function formatTime12(t24) {
  if (!isValidReminderTime(t24)) return '';
  const [h, m] = t24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

export function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
}

export function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// Maps hour (0-23) to the same period-key vocabulary used by TEMPLE_PERIOD_BUCKETS.
// Used at write time to imprint atmospheric coordinates on entries.
export function getPeriodKey(hour = new Date().getHours()) {
  if (hour < 4)  return 'night';
  if (hour < 6)  return 'first-light';
  if (hour < 10) return 'morning';
  if (hour < 15) return 'midday';
  if (hour < 18) return 'afternoon';
  if (hour < 20) return 'golden-hour';
  if (hour < 22) return 'dusk';
  return 'night';
}
