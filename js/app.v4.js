// js/app.v4.js — GH Pages (relative) + logger
import { ensurePlayerName } from './profile.js';

const app   = document.getElementById('app');
const tabs  = [...document.querySelectorAll('[data-tab]')];
const errBox = document.getElementById('err');

// bump số này MỖI LẦN sửa để tránh cache
const VERSION = 'gh-pages-diagnose-005';

function showErr(e){
  errBox.style.display = 'block';
  errBox.innerText = 'Lỗi nạp: ' + (e?.message || e);
  console.error('[APP LOADER ERROR]', e);
}

async function boot(){
  try{
    ensurePlayerName();

    const loaders = {
      tasks: async ()=> {
        console.log('loading task-list.js ...');
        await import(`../components/task-list.js?v=${VERSION}`);
        return '<task-list></task-list>';
      },
      map: async ()=> {
        await import(`../components/level-map.js?v=${VERSION}`);
        return '<level-map></level-map>';
      },
      leaderboard: async ()=> {
        await import(`../components/leaderboard-view.js?v=${VERSION}`);
        return '<leaderboard-view></leaderboard-view>';
      },
      settings: async ()=> {
        await import(`../components/settings-view.js?v=${VERSION}`);
        return '<settings-view></settings-view>';
      },
    };

    async function render(tab){
      tabs.forEach(b=> b.classList.toggle('active', b.dataset.tab===tab));
      app.innerHTML = 'Đang nạp...';
      try {
        const html = await loaders[tab]();
        app.innerHTML = html;
      } catch (e) {
        showErr(e);
      }
    }

    tabs.forEach(b=> b.addEventListener('click', ()=> render(b.dataset.tab)));
    render('tasks');
  }catch(e){ showErr(e); }
}
boot();
