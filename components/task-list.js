import { getZones } from '../js/zones.js';
import { addXP, getLevelInfo } from '../js/profile.js';
import { getSimDay, getSimWeekday, nextSimDay, bonusGiven, markBonus, clearFlagsFor, getSpawnMark, setSpawnMark } from '../js/day.js';
import { getRecurring } from '../js/recurring.js';

const TASKS = 'tq_tasks';
function loadTasks(){ try{ return JSON.parse(localStorage.getItem(TASKS)) ?? [] }catch{ return [] } }
function saveTasks(v){ localStorage.setItem(TASKS, JSON.stringify(v)) }

function spawnRecurringIfNeeded(){
  const mark = getSpawnMark();
  if(mark===getSimDay()) return;
  const weekday = getSimWeekday();
  const recs = getRecurring();
  const tasks = loadTasks();
  const zones = getZones();
  const {cap} = getLevelInfo();
  for(const r of recs){
    const match = r.type==='daily' || (r.type==='weekly' && Array.isArray(r.days)&&r.days.includes(weekday));
    if(!match) continue;
    if(tasks.length>=cap) break;
    const z = zones.find(z=>z.id==r.zoneId); if(!z) continue;
    const zoneCount = tasks.filter(t=>t.zoneId==r.zoneId).length;
    if(z.maxPerDay && zoneCount>=z.maxPerDay) continue;
    tasks.push({id:Date.now()+Math.random(), text:r.text, zoneId:r.zoneId, done:false});
  }
  saveTasks(tasks);
  setSpawnMark(getSimDay());
}

customElements.define('task-list', class extends HTMLElement{
  constructor(){ super(); this.attachShadow({mode:'open'}); }
  connectedCallback(){ this.render(); }

  render(){
    spawnRecurringIfNeeded();
    const zones=getZones();
    const tasks=loadTasks();
    const {level,xp,need,cap}=getLevelInfo();
    const day=getSimDay();

    const groups = zones.map(z=>({
      z,
      list: tasks.filter(t=>t.zoneId==z.id),
      done: tasks.filter(t=>t.zoneId==z.id && t.done).length
    }));

    this.shadowRoot.innerHTML = `
      <style>
        .pill{background:#eef;border:1px solid #dde;border-radius:999px;padding:4px 10px;margin-right:6px}
        .muted{color:#7d82a8}
        .bar{height:8px;background:#eee;border-radius:6px;overflow:hidden;margin:8px 0 12px}
        .fill{height:100%;background:#8b7cff}
        .creator{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}
        input,select,button{font:inherit}
        button{padding:8px 12px;border:1px solid #e8e8fb;border-radius:10px;background:#fff;cursor:pointer}
        .primary{background:#8b7cff;color:#fff;border-color:#8b7cff}
        .danger{background:#ff3b30;color:#fff;border:none}
        .zone{border:1px solid #f0f0ff;border-radius:12px;margin:12px 0}
        .zone header{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-bottom:1px solid #f4f4ff;background:#fafaff;border-radius:12px 12px 0 0}
        ul{list-style:none;margin:0;padding:0}
        li.task{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-top:1px solid #f7f7ff}
        .left{display:flex;align-items:center;gap:8px}
        .done .txt{text-decoration:line-through;color:#9aa}
        .badge{font-size:12px;padding:2px 8px;border-radius:999px;background:#fff;border:1px solid #eee}
      </style>
      <div class="top">
        <span class="pill">Ngày ảo: <b>${day}</b></span>
        <span class="pill">Level: <b>${level}</b></span>
        <span class="pill">XP: <b>${xp}</b>${need?` / ${need}`:''}</span>
        <span class="muted">Giới hạn/ngày: <b>${cap}</b></span>
        <span style="float:right"></span>
      </div>
      <div class="bar"><div class="fill" style="width:${need?Math.min(100,Math.round(xp/need*100)):100}%"></div></div>

      <div class="creator">
        <input id="taskText" placeholder="Thêm nhiệm vụ… (Enter)" style="flex:1;min-width:220px;padding:8px;border-radius:10px;border:1px solid #ccd">
        <select id="taskZone" style="min-width:160px;padding:8px;border-radius:10px;border:1px solid #ccd">
          ${zones.map(z=>`<option value="${z.id}">${z.name}</option>`).join('')}
        </select>
        <button class="primary" id="btnAdd">Thêm</button>
        <span style="margin-left:auto;display:flex;gap:8px">
          <button id="btnEnd">Qua ngày</button>
          <button class="danger" id="btnReset">Reset điểm</button>
        </span>
      </div>

      ${groups.map(g=>`
        <section class="zone">
          <header style="border-color:${g.z.color}">
            <div><b>${g.z.name}</b></div>
            <div class="badge">Hoàn thành: ${g.done}/${g.z.maxPerDay||0}</div>
          </header>
          <ul>
          ${g.list.length? g.list.map(t=>`
            <li class="task ${t.done?'done':''}">
              <div class="left">
                <input type="checkbox" data-id="${t.id}" ${t.done?'checked':''}>
                <span class="txt">${t.text}</span>
              </div>
              <button class="danger del" data-id="${t.id}">🗑</button>
            </li>
          `).join(''): `<li class="task"><span class="muted">Chưa có task.</span></li>`}
          </ul>
        </section>
      `).join('')}
    `;

    const $ = sel => this.shadowRoot.querySelector(sel);
    const $$ = sel => [...this.shadowRoot.querySelectorAll(sel)];

    const inp = $('#taskText'); const sel = $('#taskZone');
    const addNow = () => {
      const text=(inp.value||'').trim(); if(!text) return;
      if(loadTasks().length>=cap){ alert('Đã đạt giới hạn task/ngày theo Level'); return; }
      const z = zones.find(z=>z.id==sel.value);
      const count = loadTasks().filter(t=>t.zoneId==z.id).length;
      if(z.maxPerDay && count>=z.maxPerDay){ alert(`Zone "${z.name}" đã đủ ${z.maxPerDay} task hôm nay`); return; }
      saveTasks([...loadTasks(), {id:Date.now(), text, zoneId:Number(sel.value), done:false}]);
      inp.value=''; this.render();
    };
    $('#btnAdd').onclick = addNow;
    inp.onkeydown = e=>{ if(e.key==='Enter') addNow(); };

    // checkbox
    $$('input[type="checkbox"]').forEach(cb=>{
      cb.onchange = () => {
        const id=Number(cb.dataset.id);
        const tasks=loadTasks();
        const t=tasks.find(x=>x.id===id); if(!t) return;
        const z=zones.find(z=>z.id==t.zoneId);
        t.done = cb.checked;
        addXP(cb.checked? Number(z.point||0) : -Number(z.point||0));
        saveTasks(tasks);
        if(t.done && z.maxPerDay){
          const doneCount = tasks.filter(x=>x.zoneId==z.id && x.done).length;
          if(doneCount>=z.maxPerDay && !bonusGiven(z.id)){
            addXP(Number(z.bonus||0)); markBonus(z.id);
          }
        }
        this.render();
      };
    });

    // delete
    $$('.del').forEach(b=> b.onclick=()=>{
      const id=Number(b.dataset.id);
      saveTasks(loadTasks().filter(t=>t.id!==id));
      this.render();
    });

    // qua ngày
    $('#btnEnd').onclick = ()=>{
      const zones=getZones(); const tasks=loadTasks(); const today=getSimDay();
      for(const z of zones){
        if(!z.maxPerDay) continue;
        const done = tasks.filter(t=>t.zoneId==z.id && t.done).length;
        if(done<z.maxPerDay) addXP(-Number(z.penalty||0));
        if(done>=z.maxPerDay && !bonusGiven(z.id)){ addXP(Number(z.bonus||0)); markBonus(z.id); }
      }
      clearFlagsFor(today);
      nextSimDay();
      saveTasks([]);
      setSpawnMark(0);
      alert('Đã qua ngày.');
      this.render();
    };

    $('#btnReset').onclick = ()=>{
      if(confirm('Reset Level=1 & XP=0?')){ import('../js/profile.js').then(m=>{ m.resetPoints(); this.render(); }); }
    };
  }
});
