// Store cho Tasks lặp (daily / weekly)
const LS_RECUR = 'tq_recurring_v1';

function loadRaw(){
  try{ return JSON.parse(localStorage.getItem(LS_RECUR)) || []; }
  catch{ return []; }
}
function saveRaw(arr){ localStorage.setItem(LS_RECUR, JSON.stringify(arr)); }

export function getRecurring(){ return loadRaw(); }
export function addRecurring(item){
  const list = loadRaw();
  const id = Date.now();
  list.push({
    id,
    text: item.text?.trim() || 'Task',
    zoneId: Number(item.zoneId),
    type: item.type,        // 'daily' | 'weekly'
    days: Array.isArray(item.days) ? item.days.map(n=>Number(n)).sort() : [] // 0..6
  });
  saveRaw(list); return id;
}
export function removeRecurring(id){
  saveRaw(loadRaw().filter(x=> x.id != id));
}
