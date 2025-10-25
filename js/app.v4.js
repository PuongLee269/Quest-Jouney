// App loader cho GitHub Pages (relative imports)
import { ensurePlayerName } from './profile.js';

const app   = document.getElementById('app');
const tabs  = [...document.querySelectorAll('[data-tab]')];
const errBox = document.getElementById('err');

// Đổi chuỗi này khi muốn ép trình duyệt tải lại modules
const VERSION = 'gh-pages-003';

function showErr(e){
  errBox.style.display = 'block';
  errBox.textContent = 'Lỗi nạp: ' + (e?.message || e);
  console.error(e);
}

async function boot(){
  try{
    ensurePlayerName();

    const loaders = {
      tasks: async ()=> { await import(`../components/task-list.js?v=${VERSION}`); return '<task-list></task-list>'; },
      map: async ()=> {await import(`../components/level-map.js?v=${VERSION}`); return '<level-map></level-map>'; },
      leaderboard: async ()=> {await import(`../components/leaderboard-view.js?v=${VERSION}`); return '<leaderboard-view></leaderboard-view>'; },
      settings: async ()=> { await import(`../components/settings-view.js?v=${VERSION}`); return '<settings-view></settings-view>'; },
    };

    async function render(tab){
      tabs.forEach(b=> b.classList.toggle('active', b.dataset.tab===tab));
      app.innerHTML = 'Đang nạp...';
      app.innerHTML = await loaders[tab]();
    }

    tabs.forEach(b=> b.addEventListener('click', ()=> render(b.dataset.tab)));
    render('tasks');
  }catch(e){ showErr(e); }
}
boot();


