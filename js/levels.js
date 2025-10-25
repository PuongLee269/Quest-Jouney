// Cấu hình level (chỉnh tùy ý)
export const LEVELS = [
  { id: 1, name: "Level 1", dailyTaskCap: 5, xpToNext: 100 },
  { id: 2, name: "Level 2", dailyTaskCap: 7, xpToNext: 250 },
  { id: 3, name: "Level 3", dailyTaskCap: 9, xpToNext: 0 }, // 0 = max, không lên nữa
  // có thể thêm đến 9 level sau này
];

// Helper
export function capForLevel(level){
  const cfg = LEVELS.find(l=>l.id===level) || LEVELS[0];
  return cfg.dailyTaskCap;
}
export function thresholdForLevel(level){
  const cfg = LEVELS.find(l=>l.id===level) || LEVELS[0];
  return cfg.xpToNext;
}
export function maxLevel(){ return Math.max(...LEVELS.map(l=>l.id)); }
