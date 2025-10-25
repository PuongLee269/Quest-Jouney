// Hồ sơ người chơi: tên, level, XP + tiện ích level
import { capForLevel, thresholdForLevel, maxLevel } from '/js/levels.js';

const LS_PROFILE = 'tq_profile_v2';

export function getProfile(){
  try { return JSON.parse(localStorage.getItem(LS_PROFILE)) || { name:'', level:1, xp:0 }; }
  catch { return { name:'', level:1, xp:0 }; }
}
export function saveProfile(p){
  localStorage.setItem(LS_PROFILE, JSON.stringify(p));
}
export function ensurePlayerName(){
  const p = getProfile();
  if (!p.name) {
    const name = prompt('Nhập tên người chơi:')?.trim();
    p.name = name || 'Player';
    saveProfile(p);
  }
  return getProfile();
}
export function setPlayerName(name){
  const p = getProfile();
  p.name = (name||'Player').trim();
  saveProfile(p);
}

// XP & Level
export function addXP(delta){
  const p = getProfile();
  p.xp = Math.max(0, (p.xp||0) + Number(delta||0));
  while (p.level < maxLevel() && thresholdForLevel(p.level) > 0 && p.xp >= thresholdForLevel(p.level)){
    p.level += 1;
  }
  saveProfile(p);
  return p;
}
export function resetPoints(){
  const p = getProfile();
  p.level = 1;
  p.xp = 0;
  saveProfile(p);
  return p;
}
export function getDailyTaskCap(){
  const p = getProfile();
  return capForLevel(p.level || 1);
}
export function getLevelInfo(){
  const p = getProfile();
  return {
    level: p.level || 1,
    xp: p.xp || 0,
    need: thresholdForLevel(p.level || 1)
  };
}
