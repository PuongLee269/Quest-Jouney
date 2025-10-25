// Settings: Profile + Zones + Recurring + GitHub Sync (Endpoint)
import { getProfile, setPlayerName, resetPoints } from '/js/profile.js';
import { getZones, addZone, updateZone, removeZone } from '/js/zones.js';
import { getRecurring, addRecurring, removeRecurring } from '/js/recurring.js';
import { getGitHubConfig, saveGitHubConfig, fetchLeaderboard, autoSyncProfile, syncMyProfileDirect } from '/js/github-sync.js';

customElements.define('settings-view', class extends HTMLElement {
  constructor(){ super(); this.attachShadow({mode:'open'}); }
  connectedCallback(){ this._render(); this._bind(); this._paint(); }

  _render(){
    this.shadowRoot.innerHTML = `
      <style>
        :root{--border:#e8e8fb;--accent:#8b7cff}
        :host{display:block;font-family:system-ui}
        .row{display:grid;grid-template-columns:180px 1fr;gap:10px;align-items:center;margin:8px 0}
        .card{padding:12px;border:1px solid var(--border);border-radius:12px;background:#fff;margin-top:12px}
        input,select{padding:8px;border-radius:8px;border:1px solid #ccc;width:100%}
        button{padding:8px 12px;border:0;border-radius:8px;background:var(--accent);color:#fff;cursor:pointer}
        .btn-danger{background:#ff3b30}
        table{width:100%;border-collapse:collapse;margin-top:10px}
        th,td{border:1px solid #eee;padding:8px;text-align:left}
        .del{background:#ff6b6b}
        .actions{display:flex;gap:8px;flex-wrap:wrap}
        .wk{display:flex;gap:6px;flex-wrap:wrap}
        .wk label{display:inline-flex;gap:6px;align-items:center;border:1px solid #e8e8fb;padding:4px 8px;border-radius:8px;background:#fafbff}
        .small{font-size:12px;color:#7d82a8}
      </style>

      <div class="card" style="margin-top:0">
        <h3>Hồ sơ người chơi</h3>
        <div class="row">
          <div>Tên người chơi</div>
          <div class="actions">
            <input id="playerName" placeholder="Nhập tên…"/>
            <button id="saveName">Lưu</button>
            <button id="resetPoints" class="btn-danger">Reset điểm</button>
          </div>
        </div>
      </div>

      <div class="card">
        <h3>Zones & Điểm</h3>
        <div class="row"><div>Tên Zone</div><input id="zName" placeholder="Ví dụ: Công việc"></div>
        <div class="row"><div>Màu</div><input id="zColor" value="#8b7cff"></div>
        <div class="row"><div>Điểm mỗi Task</div><input id="zPoint" type="number" value="10"></div>
        <div class="row"><div>Bonus khi đạt số Task tối đa</div><input id="zBonus" type="number" value="5"></div>
        <div class="row"><div>Penalty nếu KHÔNG đạt</div><input id="zPenalty" type="number" value="2"></div>
        <div class="row"><div>Số Task tối đa/ngày (Zone)</div><input id="zMax" type="number" value="3"></div>
        <div class="row"><div></div><button id="addZone">+ Thêm Zone</button></div>

        <table>
          <thead><tr><th>Tên</th><th>Màu</th><th>Điểm/Task</th><th>Bonus</th><th>Penalty</th><th>Max/Ngày</th><th></th></tr></thead>
          <tbody id="zoneTable"></tbody>
        </table>
      </div>

      <div class="card">
        <h3>Tasks lặp (Daily / Weekly)</h3>
        <div class="row"><div>Mô tả</div><input id="rText" placeholder="Ví dụ: Tập thể dục 15’"></div>
        <div class="row"><div>Zone</div><select id="rZone"></select></div>
        <div class="row"><div>Kiểu lặp</div><div><select id="rType"><option value="daily">Mỗi ngày</option><option value="weekly">Theo thứ</option></select></div></div>
        <div class="row" id="wkRow" style="display:none">
          <div>Chọn thứ</div>
          <div class="wk">${['CN','T2','T3','T4','T5','T6','T7'].map((lbl,i)=>`<label><input type="checkbox" value="${i}"> ${lbl}</label>`).join('')}</div>
        </div>
        <div class="row"><div></div><button id="addRec">+ Thêm Task lặp</button></div>
        <table>
          <thead><tr><th>Mô tả</th><th>Zone</th><th>Kiểu</th><th>Thứ</th><th></th></tr></thead>
          <tbody id="recTable"></tbody>
        </table>
      </div>

      <div class="card">
        <h3>Đồng bộ Leaderboard</h3>
        <div class="row"><div>Endpoint (khuyến nghị)</div><input id="ghEndpoint" placeholder="https://your-function.example.com/api/leaderboard"></div>
        <div class="row"><div class="small">— Hoặc dùng GitHub trực tiếp (dev)</div><div class="small">Cần quyền ghi repo</div></div>
        <div class="row"><div>Owner</div><input id="ghOwner" placeholder="github-username"></div>
        <div class="row"><div>Repo</div><input id="ghRepo" placeholder="repo-name"></div>
        <div class="row"><div>File path</div><input id="ghPath" placeholder="leaderboard.json"></div>
        <div class="row"><div>Token (dev)</div><input id="ghToken" placeholder="PAT for dev only"></div>
        <div class="row">
          <div>Tự động đồng bộ</div>
          <div><label><input type="checkbox" id="ghAuto"> Auto-sync khi “Qua ngày”</label></div>
        </div>
        <div class="row">
          <div></div>
          <div class="actions">
            <button id="saveGh">Lưu cấu hình</button>
            <button id="syncNow">Đồng bộ ngay</button>
          </div>
        </div>
      </div>
    `;
  }

  _bind(){
    // Profile
    this.shadowRoot.querySelector('#saveName').onclick = () => {
      const name = this.shadowRoot.querySelector('#playerName').value.trim();
      setPlayerName(name); alert('Đã lưu tên.');
    };
    this.shadowRoot.querySelector('#resetPoints').onclick = () => {
      if (confirm('Reset Level=1 và XP=0?')) { resetPoints(); alert('Đã reset điểm.'); }
    };

    // Zones
    this.shadowRoot.querySelector('#addZone').onclick = () => {
      const get = id => this.shadowRoot.querySelector(id).value;
      const name=get('#zName').trim(); const color=get('#zColor').trim()||'#ccc';
      const point=Number(get('#zPoint')||0), bonus=Number(get('#zBonus')||0), pen=Number(get('#zPenalty')||0), max=Number(get('#zMax')||1);
      if(!name) return alert('Nhập tên Zone');
      addZone({ name, color, pointPerTask:point, bonusCompleteAll:bonus, penaltyNotComplete:pen, maxTasksPerDay:max });
      this.shadowRoot.querySelector('#zName').value=''; this._paint();
    };
    this.shadowRoot.addEventListener('input', (e)=>{
      const tr = e.target.closest('tr[data-id]'); if(!tr) return;
      const id = Number(tr.dataset.id); const field = e.target.name; let val = e.target.value;
      if (['pointPerTask','bonusCompleteAll','penaltyNotComplete','maxTasksPerDay'].includes(field)) val = Number(val||0);
      updateZone(id, { [field]: val });
    });
    this.shadowRoot.addEventListener('click', (e)=>{
      if (e.target.classList.contains('del')){
        const id = Number(e.target.dataset.id);
        if (confirm('Xoá Zone này?')){ removeZone(id); this._paint(); }
      }
    });

    // Recurring
    const typeSel = this.shadowRoot.querySelector('#rType');
    const wkRow   = this.shadowRoot.querySelector('#wkRow');
    typeSel.onchange = ()=> wkRow.style.display = (typeSel.value==='weekly'?'grid':'none');
    this.shadowRoot.querySelector('#addRec').onclick = ()=>{
      const text = this.shadowRoot.querySelector('#rText').value.trim();
      const zoneId = Number(this.shadowRoot.querySelector('#rZone').value);
      const type = typeSel.value;
      const days = [...this.shadowRoot.querySelectorAll('#wkRow input[type="checkbox"]:checked')].map(c=>Number(c.value));
      if (!text) return alert('Nhập mô tả task');
      if (type==='weekly' && days.length===0) return alert('Chọn ít nhất 1 thứ');
      addRecurring({ text, zoneId, type, days });
      this.shadowRoot.querySelector('#rText').value='';
      this._paint();
    };
    this.shadowRoot.addEventListener('click', (e)=>{
      if (e.target.classList.contains('rec-del')){
        const id = Number(e.target.dataset.id); removeRecurring(id); this._paint();
      }
    });

    // GitHub sync config
    this.shadowRoot.querySelector('#saveGh').onclick = ()=>{
      const cfg = {
        endpoint: this.shadowRoot.querySelector('#ghEndpoint').value.trim(),
        owner: this.shadowRoot.querySelector('#ghOwner').value.trim(),
        repo:  this.shadowRoot.querySelector('#ghRepo').value.trim(),
        path:  (this.shadowRoot.querySelector('#ghPath').value.trim() || 'leaderboard.json'),
        token: this.shadowRoot.querySelector('#ghToken').value.trim(),
        autosync: this.shadowRoot.querySelector('#ghAuto').checked
      };
      saveGitHubConfig(cfg);
      alert('Đã lưu cấu hình đồng bộ.');
    };
    this.shadowRoot.querySelector('#syncNow').onclick = async ()=>{
      try{
        const p = getProfile(); const cfg = getGitHubConfig();
        if (cfg.endpoint) await autoSyncProfile({ name:p.name||'Player', level:p.level||1, xp:p.xp||0 });
        else await syncMyProfileDirect({ name:p.name||'Player', level:p.level||1, xp:p.xp||0 });
        alert('Đã đồng bộ.');
      }catch(err){ alert('Sync lỗi: ' + err.message); }
    };
  }

  _paint(){
    // Profile
    const p = getProfile();
    this.shadowRoot.querySelector('#playerName').value = p.name || '';

    // Zones
    const zones = getZones();
    this.shadowRoot.querySelector('#rZone').innerHTML =
      zones.map(z=>`<option value="${z.id}">${z.name}</option>`).join('');

    const tb = this.shadowRoot.querySelector('#zoneTable');
    tb.innerHTML = zones.map(z=>`
      <tr data-id="${z.id}">
        <td><input name="name" value="${z.name}"></td>
        <td><input name="color" value="${z.color}"></td>
        <td><input name="pointPerTask" type="number" value="${z.pointPerTask}"></td>
        <td><input name="bonusCompleteAll" type="number" value="${z.bonusCompleteAll}"></td>
        <td><input name="penaltyNotComplete" type="number" value="${z.penaltyNotComplete}"></td>
        <td><input name="maxTasksPerDay" type="number" value="${z.maxTasksPerDay||1}"></td>
        <td><button class="del" data-id="${z.id}">Xoá</button></td>
      </tr>
    `).join('');

    // Recurring table
    const recs = getRecurring(); const wk = ['CN','T2','T3','T4','T5','T6','T7'];
    this.shadowRoot.querySelector('#recTable').innerHTML = recs.map(r=>{
      const z = zones.find(z=>z.id==r.zoneId)?.name || '(xoá)';
      return `<tr>
        <td>${r.text}</td><td>${z}</td><td>${r.type==='daily'?'Daily':'Weekly'}</td>
        <td>${r.type==='weekly'? r.days.map(d=>wk[d]).join(', ') : '-'}</td>
        <td><button class="del rec-del" data-id="${r.id}">Xoá</button></td>
      </tr>`;
    }).join('');

    // GitHub config
    const cfg = getGitHubConfig();
    this.shadowRoot.querySelector('#ghEndpoint').value = cfg.endpoint || '';
    this.shadowRoot.querySelector('#ghOwner').value  = cfg.owner || '';
    this.shadowRoot.querySelector('#ghRepo').value   = cfg.repo  || '';
    this.shadowRoot.querySelector('#ghPath').value   = cfg.path  || 'leaderboard.json';
    this.shadowRoot.querySelector('#ghToken').value  = cfg.token || '';
    this.shadowRoot.querySelector('#ghAuto').checked = !!cfg.autosync;
  }
});
