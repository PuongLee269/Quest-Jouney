// Leaderboard: lấy dữ liệu từ GitHub và hiển thị (name, level, xp)
import { fetchLeaderboard } from '/js/github-sync.js';

customElements.define('leaderboard-view', class extends HTMLElement{
  constructor(){ super(); this.attachShadow({mode:'open'}); }
  connectedCallback(){ this.render(); }

  async render(){
    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block;font-family:system-ui}
        .top{display:flex;gap:8px;align-items:center;margin-bottom:8px}
        button{padding:8px 12px;border:0;border-radius:8px;background:#8b7cff;color:#fff;cursor:pointer}
        table{width:100%;border-collapse:collapse}
        th,td{padding:10px;border-bottom:1px solid #f0f0ff;text-align:left}
        th{color:#7d82a8;font-weight:600}
        .rank{width:70px}
      </style>
      <div class="top">
        <button id="refresh">Tải lại</button>
      </div>
      <div id="box">Đang tải Leaderboard…</div>
    `;

    const box = this.shadowRoot.querySelector('#box');
    const load = async ()=>{
      try{
        const data = await fetchLeaderboard(); // [{name,level,xp,updatedAt}]
        if (!data.length){ box.textContent = 'Chưa có dữ liệu trên GitHub (hãy vào Settings → Đồng bộ ngay).'; return; }
        const rows = data.map((u,i)=>`
          <tr>
            <td class="rank">#${i+1}</td>
            <td>${u.name||'-'}</td>
            <td>${u.level??'-'}</td>
            <td>${u.xp??'-'}</td>
            <td>${u.updatedAt? new Date(u.updatedAt).toLocaleString() : '-'}</td>
          </tr>
        `).join('');
        box.innerHTML = `
          <table>
            <thead><tr><th class="rank">Hạng</th><th>Người chơi</th><th>Level</th><th>XP</th><th>Cập nhật</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        `;
      }catch(err){
        box.textContent = 'Lỗi tải Leaderboard: ' + err.message;
      }
    };
    this.shadowRoot.querySelector('#refresh').onclick = load;
    load();
  }
});
