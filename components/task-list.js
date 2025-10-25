// Task list: tự auto-sync leaderboard khi bấm “Qua ngày” nếu đã bật autosync
// trước đây: import { getZones } from '/js/zones.js';
import { getZones } from '../js/zones.js';
import { addXP, getDailyTaskCap, getLevelInfo, resetPoints, getProfile } from '../js/profile.js';
import { getSimDay, getSimWeekday, nextSimDay } from '../js/day.js';
import { getRecurring } from '../js/recurring.js';
import { getGitHubConfig, autoSyncProfile } from '../js/github-sync.js';


const LS_TASK   = 'tq_tasks_v2';
const LS_FLAGS  = 'tq_zone_bonus_flags_v1';
const LS_SPAWN  = 'tq_spawned_day_v1';

// ... (các helper loadFlags / saveFlags giữ nguyên như bản trước)
function loadFlags(){ try{ return JSON.parse(localStorage.getItem(LS_FLAGS)) || {}; }catch{ return {}; } }
function saveFlags(obj){ localStorage.setItem(LS_FLAGS, JSON.stringify(obj)); }
function isBonusGiven(day, zoneId){ const f = loadFlags(); return !!(f[day] && f[day][zoneId]); }
function markBonusGiven(day, zoneId){ const f = loadFlags(); if (!f[day]) f[day] = {}; f[day][zoneId] = true; saveFlags(f); }
function clearFlagsForDay(day){ const f = loadFlags(); delete f[day]; saveFlags(f); }

customElements.define('task-list', class extends HTMLElement {
  constructor(){ super(); this.attachShadow({mode:'open'}); this.tasks = this._load() || []; this._hotkey = null; }
  connectedCallback(){ this._spawnRecurringIfNeeded(); this._render(); this._bindHotkey(); }
  disconnectedCallback(){ if (this._hotkey) window.removeEventListener('keydown', this._hotkey, true); }

  _bindHotkey(){
    this._hotkey = (e)=>{
      if (e.key === 'Tab') {
        const tag = (document.activeElement?.tagName || '').toLowerCase();
        if (['input','textarea','select','button'].includes(tag)) return;
        e.preventDefault();
        this.shadowRoot.querySelector('#taskInput')?.focus();
      }
    };
    window.addEventListener('keydown', this._hotkey, true);
  }

  _save(){ localStorage.setItem(LS_TASK, JSON.stringify(this.tasks)); }
  _load(){ try { return JSON.parse(localStorage.getItem(LS_TASK)) || [] } catch { return [] } }

  _spawnRecurringIfNeeded(){
    const day = getSimDay();
    const mark = Number(localStorage.getItem(LS_SPAWN)) || 0;
    if (mark === day) return;
    const weekday = getSimWeekday();
    const recs = getRecurring() || [];
    const zones = getZones();

    for (const r of recs){
      const match = r.type === 'daily' || (r.type === 'weekly' && Array.isArray(r.days) && r.days.includes(weekday));
      if (!match) continue;
      const levelCap = getDailyTaskCap();
      if (this.tasks.length >= levelCap) break;
      const z = zones.find(z=>z.id==r.zoneId);
      if (!z) continue;
      const zoneCount = this.tasks.filter(t=>t.zoneId==r.zoneId).length;
      if (z.maxTasksPerDay && zoneCount >= z.maxTasksPerDay) continue;
      this.tasks.push({ id: Date.now()+Math.random(), text:r.text, zoneId:r.zoneId, done:false });
    }
    this._save(); localStorage.setItem(LS_SPAWN, String(day));
  }

  _add(text, zoneId){
    const levelCap = getDailyTaskCap();
    if (this.tasks.length >= levelCap){ alert(`Level hiện tại chỉ thêm tối đa ${levelCap} task/ngày.`); return; }
    const zones = getZones();
    const z = zones.find(z=>z.id==zoneId);
    if (!z){ alert('Zone không tồn tại'); return; }
    const zoneCount = this.tasks.filter(t=>t.zoneId==zoneId).length;
    if (z.maxTasksPerDay && zoneCount >= z.maxTasksPerDay){ alert(`Zone "${z.name}" chỉ thêm tối đa ${z.maxTasksPerDay} task/ngày.`); return; }
    const id = Date.now();
    this.tasks.push({ id, text, zoneId: Number(zoneId), done:false });
    this._save(); this._render();
  }

  _maybeGiveBonus(zones, zoneId){
    const z = zones.find(z=>z.id==zoneId); if (!z) return;
    const max = Number(z.maxTasksPerDay||0); if (!max) return;
    const simDay = getSimDay(); if (isBonusGiven(simDay, zoneId)) return;
    const doneCount = this.tasks.filter(t=> t.zoneId==zoneId && t.done).length;
    if (doneCount >= max){ addXP(Number(z.bonusCompleteAll||0)); markBonusGiven(simDay, zoneId); }
  }

  _toggle(id){
    const zones = getZones(); const t = this.tasks.find(t=>t.id===id);
    if (t){
      t.done = !t.done;
      const z = zones.find(z=>z.id==t.zoneId); const pts = z ? Number(z.pointPerTask||0) : 0;
      addXP(t.done ? +pts : -pts);
      if (t.done) this._maybeGiveBonus(zones, t.zoneId);
    }
    this._save(); this._render();
  }
  _del(id){ this.tasks = this.tasks.filter(t=>t.id!==id); this._save(); this._render(); }

  async _endDay(){
    const zones = getZones();
    const simDay = getSimDay();

    // Bonus/Penalty cuối ngày
    for (const z of zones){
      const max = Number(z.maxTasksPerDay||0); if (!max) continue;
      const doneCount = this.tasks.filter(t=> t.zoneId==z.id && t.done).length;
      if (doneCount >= max){
        if (!isBonusGiven(simDay, z.id)){ addXP(Number(z.bonusCompleteAll||0)); markBonusGiven(simDay, z.id); }
      } else {
        addXP(-Number(z.penaltyNotComplete||0));
      }
    }

    // Qua ngày + respawn
    clearFlagsForDay(simDay);
    const { day: nextDay } = nextSimDay();
    this.tasks = [];
    localStorage.removeItem(LS_SPAWN);
    this._spawnRecurringIfNeeded();
    this._save();

    // === AUTO SYNC LEADERBOARD nếu đã bật ===
    try{
      const cfg = getGitHubConfig();
      if (cfg.autosync){
        const p = getProfile();
        await autoSyncProfile({ name: p.name || 'Player', level: p.level || 1, xp: p.xp || 0 });
      }
    }catch(e){ console.warn('Auto-sync lỗi:', e); }

    alert(`Đã qua ngày. Ngày hiện tại: ${nextDay}.`);
    this._render();
  }

  _render(){
    const zones = getZones();
    const { level, xp, need } = getLevelInfo();
    const cap  = getDailyTaskCap();
    const simDay = getSimDay();

    const groups = zones.map(z => ({
      z,
      items: this.tasks.filter(t=>t.zoneId==z.id),
      done:  this.tasks.filter(t=>t.zoneId==z.id && t.done).length
    }));

    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block;font-family:system-ui;}
        .top{display:flex;align-items:center;gap:12px;margin-bottom:6px;flex-wrap:wrap}
        .pill{background:#eef;border:1px solid #dde;border-radius:999px;padding:4px 10px}
        input,select{padding:8px;border-radius:8px;border:1px solid #ccc;}
        button{padding:8px 12px;border:0;border-radius:8px;background:#8b7cff;color:#fff;cursor:pointer}
        .btn-secondary{background:#fff;color:#333;border:1px solid #e8e8fb}
        .btn-danger{background:#ff3b30}
        .bar{height:8px;background:#eee;border-radius:6px;overflow:hidden;margin-bottom:10px}
        .fill{height:100%;background:#8b7cff}
        .zone{border:1px solid #e8e8fb;border-radius:12px;margin:12px 0}
        .zone header{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-bottom:1px solid #f0f0ff;background:#fafaff;border-radius:12px 12px 0 0}
        .zone header .badge{font-size:12px;padding:2px 8px;border-radius:999px;background:#fff;border:1px solid #eee}
        ul{list-style:none;padding:0;margin:0}
        li{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-top:1px solid #f5f5ff}
        .left{display:flex;align-items:center;gap:8px}
        .left label{cursor:pointer}
        input[type="checkbox"]{width:18px;height:18px}
        li.done .text{ text-decoration:line-through; color:#999; }
        .cap{color:#7d82a8}
        .creator{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}
      </style>

      <div class="top">
        <span class="pill">Ngày ảo: <b>${simDay}</b></span>
        <span class="pill">Level: <b>${level}</b></span>
        <span class="pill">XP: <b>${xp}</b>${need>0?` / ${need}`:''}</span>
        <span class="cap">Giới hạn task/ngày (Level): <b>${cap}</b></span>
        <div style="margin-left:auto;display:flex;gap:8px">
          <button id="resetBtn" class="btn-danger" title="Reset Level & XP về 0 để test">Reset điểm</button>
          <button id="endDayBtn" class="btn-secondary">Qua ngày</button>
        </div>
      </div>
      <div class="bar"><div class="fill" style="width:${need>0?Math.min(100, Math.round(xp/need*100)):100}%;"></div></div>

      <div class="creator">
        <input id="taskInput" placeholder="Thêm nhiệm vụ... (Enter/Tab để nhập)">
        <select id="zoneSelect">${zones.map(z=>`<option value="${z.id}">${z.name}</option>`).join('')}</select>
        <button id="addBtn">Thêm</button>
      </div>

      ${groups.map(g=>`
        <section class="zone">
          <header style="border-color:${g.z.color}">
            <div><b>${g.z.name}</b></div>
            <div class="badge">Hoàn thành: ${g.done}/${g.z.maxTasksPerDay || 0}</div>
          </header>
          <ul>
            ${g.items.length ? g.items.map(t=>`
              <li class="${t.done?'done':''}">
                <div class="left">
                  <input type="checkbox" data-id="${t.id}" ${t.done?'checked':''}/>
                  <label class="text">${t.text}</label>
                </div>
                <button data-id="${t.id}" class="del" style="background:#ff6b6b">🗑</button>
              </li>
            `).join('') : `<li style="color:#7d82a8">Chưa có task trong zone này.</li>`}
          </ul>
        </section>
      `).join('')}
    `;

    const inp=this.shadowRoot.querySelector('#taskInput');
    const sel=this.shadowRoot.querySelector('#zoneSelect');
    const addNow = ()=>{ const val=inp.value.trim(); const zid=Number(sel.value); if(val){ this._add(val, zid); inp.value=''; } };
    this.shadowRoot.querySelector('#addBtn').onclick=addNow;
    inp.addEventListener('keydown', e=>{ if(e.key==='Enter'){ addNow(); } });

    this.shadowRoot.querySelectorAll('input[type="checkbox"]').forEach(cb=> cb.onchange = ()=> this._toggle(Number(cb.dataset.id)));
    this.shadowRoot.querySelectorAll('.del').forEach(b=> b.onclick=()=>this._del(Number(b.dataset.id)));
    this.shadowRoot.querySelector('#endDayBtn').onclick=()=> this._endDay();
    this.shadowRoot.querySelector('#resetBtn').onclick=()=>{ if (confirm('Reset Level=1 và XP=0?')) { resetPoints(); this._render(); } };
  }
});

