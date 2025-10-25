// Store cho Zones + LocalStorage
const LS_ZONES = 'tq_zones_v2';

// dữ liệu mẫu lần đầu (thêm maxTasksPerDay)
const SEED = [
  { id: 1, name: "Công việc",  color:"#8b7cff", pointPerTask:10, bonusCompleteAll:5, penaltyNotComplete:2, maxTasksPerDay:3, bg:'' },
  { id: 2, name: "Học tập",    color:"#59bdbd", pointPerTask:8,  bonusCompleteAll:5, penaltyNotComplete:2, maxTasksPerDay:3, bg:'' },
  { id: 3, name: "Sức khỏe",   color:"#ff8b7c", pointPerTask:12, bonusCompleteAll:6, penaltyNotComplete:3, maxTasksPerDay:2, bg:'' }
];

function loadRaw(){
  try{
    const x = JSON.parse(localStorage.getItem(LS_ZONES));
    if (Array.isArray(x) && x.length) return x;
    localStorage.setItem(LS_ZONES, JSON.stringify(SEED));
    return SEED;
  }catch{
    localStorage.setItem(LS_ZONES, JSON.stringify(SEED));
    return SEED;
  }
}
function saveRaw(arr){ localStorage.setItem(LS_ZONES, JSON.stringify(arr)); }

export function getZones(){ return loadRaw(); }
export function setZones(arr){ saveRaw(arr); }

// CRUD
export function addZone(z){
  const zones = loadRaw();
  const id = Date.now();
  zones.push({
    id,
    name: z.name?.trim() || 'Zone',
    color: z.color || '#cccccc',
    pointPerTask: Number(z.pointPerTask||0),
    bonusCompleteAll: Number(z.bonusCompleteAll||0),
    penaltyNotComplete: Number(z.penaltyNotComplete||0),
    maxTasksPerDay: Number(z.maxTasksPerDay||1),
    bg: z.bg || ''
  });
  saveRaw(zones);
  return id;
}
export function updateZone(id, patch){
  const zones = loadRaw();
  const i = zones.findIndex(z=> z.id == id);
  if (i >= 0){
    zones[i] = { ...zones[i], ...patch, 
      pointPerTask: Number(patch.pointPerTask ?? zones[i].pointPerTask),
      bonusCompleteAll: Number(patch.bonusCompleteAll ?? zones[i].bonusCompleteAll),
      penaltyNotComplete: Number(patch.penaltyNotComplete ?? zones[i].penaltyNotComplete),
      maxTasksPerDay: Number(patch.maxTasksPerDay ?? zones[i].maxTasksPerDay)
    };
    saveRaw(zones);
  }
}
export function removeZone(id){
  const zones = loadRaw().filter(z=> z.id != id);
  saveRaw(zones);
}
