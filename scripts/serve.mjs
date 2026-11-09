import {spawnSync} from 'node:child_process';
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';
const root=path.resolve('site');
if (process.argv.includes('--watch')) {
  let pending;
  for (const dir of ['src','content','materials','examples']) {
    fs.watch(dir,{recursive:true},()=>{
      clearTimeout(pending);
      pending=setTimeout(()=>{
        const result=spawnSync(process.execPath,['scripts/build.mjs'],{stdio:'inherit'});
        if (result.status!==0) console.error('Сборка не завершилась. Исправьте ошибки и сохраните файл.');
      },250);
    });
  }
}
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.pdf':'application/pdf','.zip':'application/zip'};
http.createServer((req,res)=>{try{const p=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(p!==root&&!p.startsWith(root+path.sep)){res.writeHead(403).end();return;}const f=fs.statSync(p).isDirectory()?path.join(p,'index.html'):p;res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res);}catch{res.writeHead(404).end('Not found');}}).listen(4206,'127.0.0.1',()=>console.log('http://127.0.0.1:4206'));
