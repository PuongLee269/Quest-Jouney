// components/level-map.js (GH Pages friendly: relative imports)
import { LEVELS } from '../js/levels.js';
import { getLevelInfo } from '../js/profile.js';

customElements.define('level-map', class extends HTMLElement {
  constructor(){ super(); this.attachShadow({mode:'open'}); }

  connectedCallback(){ this.render(); }

  render(){
    const { level } = getLevelInfo(); // level hiện tại
    // vẽ 9 node (đang phát triển 3 level đầu)
    const total = Math.max(LEVELS?.length || 9, 9);

    const items = Array.from({length: total}, (_,i)=>{
      const n = i+1;
      const state = n < level ? 'passed' : (n === level ? 'current' : 'locked');
      const label = `Lv ${n}`;
      return { n, state, label };
    });

    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block;font-family:system-ui}
        .map{position:relative;height:360px;background:linear-gradient(180deg,#fafbff,#f6f7ff);border-radius:16px;border:1px solid #e8e8fb;overflow:hidden}
        .path{position:absolute;left:50%;top:20px;bottom:20px;width:4px;background:#e8e8fb;transform:translateX(-50%)}
        .node{position:absolute;left:50%;transform:translate(-50%,-50%);width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;
              background:#fff;border:2px solid #e8e8fb;box-shadow:0 6px 16px rgba(20,16,60,.08);font-weight:700;color:#434a77}
        .node.passed{border-color:#9AE6B4;background:#f6fff8}
        .node.current{border-color:#8b7cff;box-shadow:0 0 0 6px rgba(139,124,255,.12)}
        .node.locked{opacity:.55}
        .badge{position:absolute;top:6px;right:6px;background:#8b7cff;color:#fff;padding:2px 8px;border-radius:999px;font-size:12px}
      </style>
      <div class="map">
        <div class="path"></div>
        ${items.map((it,i)=>{
          const y = 40 + (i*(280/(items.length-1)));   // rải đều theo trục dọc
          const xoff = (i%2===0 ? -90 : 90);           // zigzag trái/phải
          return `
            <div class="node ${it.state}" style="top:${y}px; left:calc(50% + ${xoff}px)">
              ${it.n}
            </div>
          `;
        }).join('')}
        <div class="badge">Level hiện tại: ${level}</div>
      </div>
    `;
  }
});
