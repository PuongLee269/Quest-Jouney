// Đồng bộ Leaderboard
// Mode A: qua endpoint serverless (khuyến nghị cho user nhận link)
// Mode B (fallback): ghi trực tiếp GitHub bằng token cục bộ (chỉ cho dev/test)

const LS_GH = 'tq_github_sync_v2';

export function getGitHubConfig(){
  try { return JSON.parse(localStorage.getItem(LS_GH)) || {}; }
  catch { return {}; }
}
export function saveGitHubConfig(cfg){
  localStorage.setItem(LS_GH, JSON.stringify(cfg || {}));
}

// ===== Mode A: Serverless endpoint =====
export async function autoSyncViaEndpoint({ name, level, xp }){
  const cfg = getGitHubConfig();
  if (!cfg.endpoint) throw new Error('Chưa cấu hình Endpoint');
  const res = await fetch(cfg.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, level, xp })
  });
  if (!res.ok) throw new Error('Endpoint trả về lỗi: ' + res.status);
  return await res.json().catch(()=> ({}));
}

// ===== Mode B: Ghi trực tiếp GitHub (dev only) =====
function b64encodeUtf8(str){ return btoa(unescape(encodeURIComponent(str))); }
function b64decodeUtf8(str){ return decodeURIComponent(escape(atob(str))); }

async function ghGetFile({owner, repo, path, token}){
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
    headers: token ? {Authorization: `Bearer ${token}`} : {}
  });
  if (res.status === 404) return { exists:false };
  if (!res.ok) throw new Error('GitHub GET: ' + res.status);
  const data = await res.json();
  return { exists:true, sha:data.sha, content: b64decodeUtf8(data.content || '') };
}
async function ghPutFile({owner, repo, path, token, content, sha, message}){
  const body = { message: message || 'update leaderboard', content: b64encodeUtf8(content), sha };
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
    method:'PUT',
    headers:{ 'Content-Type':'application/json', ...(token ? {Authorization:`Bearer ${token}`} : {}) },
    body: JSON.stringify(body)
  });
  if (!res.ok) { const t = await res.text(); throw new Error('GitHub PUT: ' + res.status + ' ' + t); }
  return await res.json();
}
export async function fetchLeaderboard(){
  const cfg = getGitHubConfig();
  if (cfg.endpoint) {
    // optional: endpoint có thể hỗ trợ GET; nếu không có thì dùng GitHub read (dev cfg)
    if (!(cfg.owner && cfg.repo && cfg.path)) return [];
  }
  if (!cfg.owner || !cfg.repo || !cfg.path) throw new Error('Chưa cấu hình GitHub (owner/repo/path).');
  const file = await ghGetFile(cfg);
  if (!file.exists) return [];
  try { return JSON.parse(file.content || '[]'); } catch { return []; }
}
export async function syncMyProfileDirect({name, level, xp}){
  const cfg = getGitHubConfig();
  if (!cfg.owner || !cfg.repo || !cfg.path) throw new Error('Chưa cấu hình GitHub');
  const file = await ghGetFile(cfg);
  let list = []; let sha = undefined;
  if (file.exists){ sha = file.sha; try { list = JSON.parse(file.content || '[]'); } catch { list = []; } }
  const now = new Date().toISOString();
  const i = list.findIndex(x => (x.name||'').toLowerCase() === (name||'').toLowerCase());
  const entry = { name, level:Number(level||1), xp:Number(xp||0), updatedAt: now };
  if (i >= 0) list[i] = entry; else list.push(entry);
  list.sort((a,b)=> (b.level - a.level) || (b.xp - a.xp) || (a.name||'').localeCompare(b.name||''));
  await ghPutFile({...cfg, content: JSON.stringify(list, null, 2), sha, message:`sync ${name}`});
  return list;
}

// ===== Facade cho client gọi =====
export async function autoSyncProfile({ name, level, xp }){
  const cfg = getGitHubConfig();
  if (cfg.endpoint) return autoSyncViaEndpoint({ name, level, xp });
  // fallback dev
  if (cfg.owner && cfg.repo && cfg.path && cfg.token) return syncMyProfileDirect({ name, level, xp });
  throw new Error('Chưa cấu hình Endpoint hoặc (owner/repo/path/token).');
}
