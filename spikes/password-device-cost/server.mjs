// Local-only disposable benchmark server. Never exposes a network listener by default.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
const port=Number(process.env.PORT||5187);
const wasm=process.env.DENY_WASM==='1'?'':" 'wasm-unsafe-eval'";
const csp=`default-src 'none'; script-src 'self'${wasm}; worker-src 'self'; connect-src 'self'; style-src 'self'; img-src 'self' data:; base-uri 'none'; object-src 'none'; frame-ancestors 'none'`;
createServer(async(req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname.includes('..')||!/^\/[a-zA-Z0-9_./-]*$/.test(pathname)){res.writeHead(400);res.end();return;}
  const file=pathname==='/'?'index.html':pathname.slice(1);
  try {
    const body=await readFile(new URL('./dist/'+file,import.meta.url));
    const type=file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':file.endsWith('.txt')?'text/plain':'application/octet-stream';
    res.writeHead(200,{'Content-Type':type,'Content-Security-Policy':csp,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(body);
  }catch{res.writeHead(404);res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Password experiment: http://127.0.0.1:${port}`));
