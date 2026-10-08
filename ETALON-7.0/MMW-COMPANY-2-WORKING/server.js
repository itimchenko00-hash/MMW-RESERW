const http=require("node:http"),fs=require("node:fs"),path=require("node:path"),{URL}=require("node:url");
const root=__dirname,publicRoot=path.join(root,"public"),port=Number(process.env.PORT)||10000;
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".svg":"image/svg+xml",".jpg":"image/jpeg",".jpeg":"image/jpeg",".png":"image/png",".webp":"image/webp",".json":"application/json; charset=utf-8",".ico":"image/x-icon",".txt":"text/plain; charset=utf-8",".xml":"application/xml; charset=utf-8"};
const safe=(base,rel)=>{const b=path.resolve(base),p=path.resolve(base,rel);return p===b||p.startsWith(b+path.sep)?p:null};
const server=http.createServer((req,res)=>{
 try{
  const u=new URL(req.url,"http://localhost"),p=u.pathname;
  if(p==="/healthz"){res.writeHead(200,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"});return res.end(JSON.stringify({ok:true,service:"mmw-company-2",root:"MMW-COMPANY/2 — WORKING/public"}))}
  let rel=decodeURIComponent(p);if(rel==="/")rel="/index.html";
  const f=safe(publicRoot,rel.slice(1));
  if(f&&fs.existsSync(f)&&fs.statSync(f).isFile()){
   const ext=path.extname(f).toLowerCase();
   res.writeHead(200,{"Content-Type":mime[ext]||"application/octet-stream","Cache-Control":"no-cache"});
   return fs.createReadStream(f).pipe(res);
  }
  res.writeHead(404,{"Content-Type":"text/plain; charset=utf-8"});return res.end("Not found");
 }catch(e){console.error(e);res.writeHead(500,{"Content-Type":"text/plain; charset=utf-8"});return res.end("Server error")}
});
server.listen(port,"0.0.0.0",()=>console.log("MMW-COMPANY/2 "+port));
