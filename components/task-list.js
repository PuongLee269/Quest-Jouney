// components/task-list.js — STUB để test import
customElements.define('task-list', class extends HTMLElement {
  constructor(){ super(); this.attachShadow({mode:'open'}); }
  connectedCallback(){
    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block;font-family:system-ui}
        .box{padding:12px;border:1px dashed #9aa; background:#f9faff; border-radius:8px}
      </style>
      <div class="box">✅ Task tab đã nạp STUB thành công. (Đường dẫn import OK)</div>
    `;
  }
});
