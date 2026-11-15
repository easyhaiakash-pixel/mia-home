// serve.js: tiny local web server for the viewer (browsers block ES modules from file://).
//   node serve.js        → open http://127.0.0.1:7811/viewer.html
// It serves this folder. Mia's drawing is a copy in vendor/mia.js (make-plates.js refreshes it).
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = __dirname, PORT = +(process.env.PORT || 7811);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.ttf': 'font/ttf', '.json': 'application/json', '.css': 'text/css' };
function start(port = PORT) {
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
      if (!p.startsWith(ROOT)) { rsp.writeHead(403); return rsp.end(); }
      fs.readFile(p, (e, d) => { if (e) { rsp.writeHead(404); return rsp.end('not found'); } rsp.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); rsp.end(d); });
    });
    srv.listen(port, '127.0.0.1', () => res(srv));
  });
}
module.exports = { start, PORT };
if (require.main === module) start().then(() => console.log(`Viewer: http://127.0.0.1:${PORT}/viewer.html`));
