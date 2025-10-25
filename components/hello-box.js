// Web Component siêu tối giản: bộ đếm + danh sách mini
customElements.define('hello-box', class extends HTMLElement {
  constructor(){ super(); this.attachShadow({mode:'open'}); this.count = 0; }

  connectedCallback(){
    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block}
        .card{border:1px solid #e8e8fb;border-radius:12px;padding:12px}
        .row{display:flex;gap:8px}
        input{flex:1;border:1px solid #e8e8fb;border-radius:8px;padding:8px}
        button{border:0;border-radius:8px;padding:8px 12px;background:#8b7cff;color:#fff;cursor:pointer}
        ul{margin:12px 0 0;padding-left:20px}
        .pill{display:inline-block;margin-left:8px;padding:2px 8px;border-radius:999px;background:#f1efff;color:#6459d6;font-weight:600}
      </style>
      <div class="card">
        <div><b>Xin chào!</b> Đây là <code>&lt;hello-box&gt;</code> từ file <i>/components/hello-box.js</i>.</div>
        <div style="margin-top:8px">Đã bấm: <span id="cnt" class="pill">0</span></div>

        <div class="row" style="margin-top:10px">
          <input id="txt" placeholder="Thêm ghi chú...">
          <button id="add">Thêm</button>
          <button id="inc" title="Tăng bộ đếm">+1</button>
        </div>
        <ul id="list"></ul>
      </div>
    `;

    this.$ = (sel)=> this.shadowRoot.querySelector(sel);
    this.$('#add').addEventListener('click', ()=> this.addItem());
    this.$('#inc').addEventListener('click', ()=> this.bump());
    this.$('#txt').addEventListener('keydown', (e)=> { if(e.key==='Enter') this.addItem(); });
  }

  bump(){ this.count++; this.$('#cnt').textContent = String(this.count); }

  addItem(){
    const inp = this.$('#txt');
    const val = inp.value.trim();
    if(!val) return;
    const li = document.createElement('li');
    li.textContent = val;
    this.$('#list').appendChild(li);
    inp.value='';
    inp.focus();
  }
});
