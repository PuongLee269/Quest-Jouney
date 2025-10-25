// Quản lý "Ngày ảo" + "Thứ ảo" để test
const LS_DAY = 'tq_simday_v2';
const LS_WD  = 'tq_simweekday_v1'; // 0..6 (0=Chủ nhật như JS)

function initIfNeed(){
  if (!localStorage.getItem(LS_DAY))  localStorage.setItem(LS_DAY, '1');
  if (!localStorage.getItem(LS_WD))   localStorage.setItem(LS_WD, String(new Date().getDay()));
}
initIfNeed();

export function getSimDay(){
  return Number(localStorage.getItem(LS_DAY)) || 1;
}
export function getSimWeekday(){
  return Number(localStorage.getItem(LS_WD)) ?? new Date().getDay();
}
export function nextSimDay(){
  const d = getSimDay() + 1;
  const wd = (getSimWeekday() + 1) % 7;
  localStorage.setItem(LS_DAY, String(d));
  localStorage.setItem(LS_WD, String(wd));
  return { day: d, weekday: wd };
}
