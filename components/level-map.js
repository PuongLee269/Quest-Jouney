import { LEVELS } from '/js/levels.js';
import { getLevelInfo } from '/js/profile.js';

customElements.define('level-map', class extends HTMLElement{
  constructor(){ super(); this.attachShadow({mode:'open'}); }
  connectedCallback(){ this.render(); }

  render(){
    const { level, xp, need } = getLevelInfo();
    // tạo 9 node theo đường ziczac đơn giản
    const nodes = Array.from({length:9}, (_,i)=> i+1).map(n=>{
      const row = Math.floor((n-1)/3); // 0..2
      const col = (row%2===0) ? (n-1)%3 : 2-((n-1)%3); // ziczac
      const x = 40 + col*110, y = 60 + row*110;
      const state = n<level ? 'done' : (n===level ? 'current' : (n<=3?'open':'lock')); // mở 3 level đầu
      return { n, x, y, state };
    });

    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block;font-family:system-ui}
        .wrap{position:relative;height:420px;border:1px solid #e8e8fb;border-radius:16px;background:linear-gradient(#f7f8ff,#ffffff)}
        .node{position:absolute;width:60px;height:60px;border-radius:50%;display:grid;place-items:center;
              border:3px solid #ddd;background:#fff;font-weight:800;box-shadow:0 8px 20px rgba(0,0,0,.06)}
        .node.done{border-color:#57d6c5;background:#eafff9}
        .node.current{border-color:#8b7cff;background:#f0ecff;transform:scale(1.02)}
        .node.lock{opacity:.45;filter:grayscale(.2)}
        .info{margin-top:10px;color:#7d82a8}
      </style>
      <div class="wrap" id="map"></div>
      <div class="info">Level hiện tại: <b>${level}</b> · XP: <b>${xp}</b>${need>0?` / ${need}`:''} — (mới hiển thị 3 level đầu, các level sau đang khoá)</div>
    `;
    const map = this.shadowRoot.querySelector('#map');
    nodes.forEach(nd=>{
      const d = document.createElement('div');
      d.className = `node ${nd.state}`;
      d.style.left = nd.x+'px';
      d.style.top = nd.y+'px';
      d.textContent = nd.n;
      map.appendChild(d);
    });
  }
});
