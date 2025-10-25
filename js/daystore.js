// Quản lý ngày ảo và kho lưu trữ
const LS_KEY = 'todoquest_archive_v15';
const LS_DAY = 'todoquest_simday_v15';

export function getSimDay() {
  return Number(localStorage.getItem(LS_DAY)) || 1;
}

export function nextDay() {
  const d = getSimDay() + 1;
  localStorage.setItem(LS_DAY, d);
  return d;
}

export function saveArchive(day, data) {
  const arc = loadArchive();
  arc[day] = data;
  localStorage.setItem(LS_KEY, JSON.stringify(arc));
}

export function loadArchive() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; }
  catch { return {}; }
}
