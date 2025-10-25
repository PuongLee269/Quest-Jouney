// Vercel Serverless Function: nhận {name, level, xp} và cập nhật file leaderboard.json trong repo GitHub
import fetch from 'node-fetch';

function b64e(str){ return Buffer.from(str, 'utf8').toString('base64'); }
function b64d(str){ return Buffer.from(str, 'base64').toString('utf8'); }

export default async function handler(req, res){
  try{
    if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
    const { name, level, xp } = req.body || {};
    if (!name) return res.status(400).json({error:'name required'});

    const GH_TOKEN = process.env.GH_TOKEN;           // PAT / fine-grained token
    const GH_OWNER = process.env.GH_OWNER;           // ví dụ: your-username
    const GH_REPO  = process.env.GH_REPO;            // ví dụ: todo-quest-board
    const GH_PATH  = process.env.GH_PATH || 'leaderboard.json';

    const headers = { Authorization: `Bearer ${GH_TOKEN}`, 'Content-Type':'application/json', 'User-Agent':'todo-quest' };
    const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${encodeURIComponent(GH_PATH)}`;

    // read file
    let sha = undefined, list = [];
    const getRes = await fetch(url, { headers });
    if (getRes.status === 200){
      const j = await getRes.json();
      sha = j.sha;
      try { list = JSON.parse(b64d(j.content || '')) || []; } catch { list = []; }
    } else if (getRes.status !== 404){
      const t = await getRes.text();
      return res.status(500).json({error:'GET '+getRes.status, detail:t});
    }

    // upsert entry
    const now = new Date().toISOString();
    const entry = { name, level:Number(level||1), xp:Number(xp||0), updatedAt: now };
    const i = list.findIndex(x => (x.name||'').toLowerCase() === (name||'').toLowerCase());
    if (i>=0) list[i]=entry; else list.push(entry);
    list.sort((a,b)=> (b.level - a.level) || (b.xp - a.xp) || (a.name||'').localeCompare(b.name||''));

    // write file
    const putRes = await fetch(url, {
      method:'PUT',
      headers,
      body: JSON.stringify({ message:`sync ${name}`, content: b64e(JSON.stringify(list,null,2)), sha })
    });
    if (!putRes.ok){
      const t = await putRes.text();
      return res.status(500).json({error:'PUT '+putRes.status, detail:t});
    }
    return res.status(200).json({ ok:true });
  }catch(e){
    return res.status(500).json({error:e.message});
  }
}
