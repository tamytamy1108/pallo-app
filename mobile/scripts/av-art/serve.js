// 꾸미기 그림 작업대 서버: 이 폴더를 보여 주고, export.html 이 보낸 PNG · JSON 을 앱 자산 폴더에 저장해요.
// 실행: node mobile/scripts/av-art/serve.js  →  http://localhost:8765/lab.html
const http = require('http'), fs = require('fs'), path = require('path');
const root = __dirname, out = path.join(__dirname, '../../assets/characters/av'), port = +process.env.PORT || 8765;
const T = { '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json' };
http.createServer((q, r) => {
  const p = decodeURIComponent(q.url.split('?')[0]);
  if (q.method === 'POST' && p.startsWith('/save/')) {
    const name = path.basename(p.slice(6));
    const chunks = []; q.on('data', (c) => chunks.push(c));
    q.on('end', () => { const buf = Buffer.concat(chunks); const dest = name.endsWith('.json') ? path.join(root, name) : path.join(out, name); fs.writeFileSync(dest, buf); r.end('ok'); });
    return;
  }
  const f = path.join(root, p === '/' ? 'lab.html' : p);
  if (!f.startsWith(root)) { r.writeHead(403); return r.end(); }
  fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end('nf'); } r.writeHead(200, { 'Content-Type': T[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); r.end(b); });
}).listen(port, () => console.log('av-art', port));
