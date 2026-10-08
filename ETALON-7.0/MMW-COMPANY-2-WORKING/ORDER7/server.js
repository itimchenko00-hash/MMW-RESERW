const http=require("http"),fs=require("fs"),path=require("path"),crypto=require("crypto"),PDFDocument=require("pdfkit"),{Pool}=require("pg");

const ROOT=path.join(__dirname,"public");
const DATA=path.join(__dirname,"data");
const ORDERS_FILE=path.join(DATA,"orders.json");
const PORT=Number(process.env.PORT||10000);
const DATABASE_URL=String(process.env.DATABASE_URL||"").trim();
const pool=DATABASE_URL?new Pool({connectionString:DATABASE_URL,ssl:{rejectUnauthorized:false},max:5,idleTimeoutMillis:10000,connectionTimeoutMillis:8000}):null;
let storageMode="unavailable",fileWrite=Promise.resolve(),fileSeq=1;
const accessAttempts=new Map();

if(!fs.existsSync(DATA))fs.mkdirSync(DATA,{recursive:true});
if(!fs.existsSync(ORDERS_FILE))fs.writeFileSync(ORDERS_FILE,"[]","utf8");

const CATALOG={
 audit:{cat:"01 · Аналитика",name:"Аудит возможности",price:9000,unit:"проект",desc:"Структурированная первичная оценка идеи, актива, участка или бизнеса.",basis:"Ориентир для небольшого аналитического проекта; состав и объём подтверждаются после изучения исходных данных."},
 site:{cat:"01 · Аналитика",name:"Анализ площадки",price:15000,unit:"площадка",desc:"Desk-анализ территории: доступ, окружение, ограничения, инфраструктура и первичная пригодность.",basis:"Полевые изыскания, геодезия, официальные заключения и платные базы не входят."},
 market:{cat:"01 · Аналитика",name:"Исследование рынка",price:27000,unit:"проект",desc:"Спрос, аудитория, конкуренты, предложение и рыночная позиция проекта.",basis:"География и глубина исследования могут изменить окончательную стоимость."},
 feasibility:{cat:"01 · Аналитика",name:"Feasibility Study",price:45000,unit:"проект",desc:"Проверка жизнеспособности: рынок, продукт, экономика, риски и сценарии.",basis:"Комплексный аналитический этап; масштаб проекта влияет на объём работ."},
 concept:{cat:"02 · Разработка",name:"Концепция проекта",price:55000,unit:"проект",desc:"Продукт, аудитория, сценарии использования, позиционирование и структура реализации.",basis:"Многодисциплинарная проектная разработка."},
 economics:{cat:"02 · Разработка",name:"Экономическая модель",price:35000,unit:"модель",desc:"CAPEX/OPEX, выручка, сценарии, KPI, точка безубыточности, окупаемость и чувствительность.",basis:"Финансовая модель строится на предоставленных исходных данных."},
 businessplan:{cat:"02 · Разработка",name:"Бизнес-план / инвестиционная модель",price:65000,unit:"проект",desc:"Рынок, продукт, финансовая модель, инвестиционная логика и риски.",basis:"Ориентир среднего проектного объёма; сложные задачи рассчитываются отдельно."},
 investment:{cat:"02 · Разработка",name:"Инвестиционная упаковка",price:45000,unit:"проект",desc:"Структурирование проекта для инвестора: тезисы, экономика, сценарии, капитал и риски.",basis:"Юридические документы и внешние расходы не входят."},
 roadmap:{cat:"03 · Управление",name:"Проектный roadmap",price:18000,unit:"проект",desc:"Этапы, зависимости, контрольные точки, роли, ресурсы и следующий управленческий шаг.",basis:"Самостоятельный управленческий этап без постоянного сопровождения."},
 pm:{cat:"03 · Управление",name:"Project Management",price:45000,unit:"месяц",desc:"Координация задач, участников, сроков, решений и проектного контура.",basis:"Месячный ориентир; фактическая нагрузка подтверждается отдельно."},
 devmgmt:{cat:"03 · Управление",name:"Development Management",price:65000,unit:"месяц",desc:"Управление развитием проекта: продукт, подрядчики, экономика, сроки и коммерческие решения.",basis:"Постоянная функция с индивидуальным объёмом нагрузки."},
 commercial:{cat:"03 · Управление",name:"Коммерческая архитектура",price:30000,unit:"этап",desc:"Продукт, предложение, каналы продаж, цена и коммерческая логика.",basis:"Рекламные бюджеты и внешние маркетинговые расходы не входят."},
 custom:{cat:"04 · Custom",name:"Custom Project Development",price:null,unit:"индивидуально",desc:"Разработка проекта под уникальную задачу клиента.",basis:"Фиксировать цену без анализа исходных данных недостоверно; стоимость формируется после брифинга."}
};
const PROJECTS=[
["ALADIN RESIDENCE",195000,"Анализ площадки + рынок + концепция + экономика + инвестиционная упаковка + roadmap"],
["NEXUS WORK",180000,"Рынок + концепция business hub + экономика + инвестиционная упаковка + roadmap"],
["CARPATHIA ECO LODGE",207000,"Рынок + концепция hospitality + экономика + инвестиционная упаковка + roadmap + расширенный продуктовый контур"],
["AGROHUB",195000,"Рынок + ресурсный контур + концепция + экономика + инвестиционная упаковка + roadmap"],
["NEXUS LOGISTICS",207000,"Рынок + логистический контур + концепция + экономика + инвестиционная упаковка + roadmap + расширенный операционный контур"],
["ENERGY PARK",222000,"Ресурс/нагрузка + концепция + экономика + инвестиционная упаковка + roadmap + расширенная системная проработка"]
];
for(const [name,price,basis] of PROJECTS)CATALOG["project:"+name]={cat:"01B · Project products",name:name+" — разработка",price,unit:"пакет",desc:"Разработка проектного продукта MMW-COMPANY по соответствующему направлению.",basis};

function cleanPhone(v){let p=String(v||"").trim().replace(/\D/g,"");if(p.startsWith("00"))p=p.slice(2);return p.slice(0,15)}
function validEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||"").trim())}
function codeHash(code,salt){return crypto.scryptSync(String(code),salt,32).toString("hex")}
function newCode(){return String(crypto.randomInt(10000,100000))}
function requestId(v){return String(v||"").trim().slice(0,80)}
function json(res,status,data){const b=JSON.stringify(data);res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Content-Length":Buffer.byteLength(b),"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"});res.end(b);return true}
function parseBody(req){return new Promise((resolve,reject)=>{let s="";req.on("data",c=>{s+=c;if(s.length>300000)reject(new Error("payload too large"))});req.on("end",()=>{try{resolve(JSON.parse(s||"{}"))}catch{reject(new Error("invalid json"))}});req.on("error",reject)})}
function publicCatalog(){return Object.entries(CATALOG).map(([id,x])=>({id,...x,price:x.price===null?null:Number(x.price)}))}
function itemFromRequest(v){const id=String(v?.id||"");const x=CATALOG[id];if(!x)return null;const qty=Math.max(1,Math.min(99,Number.parseInt(v?.qty,10)||1));const custom=x.price===null;return {id,name:x.name,category:x.cat,description:x.desc,basis:x.basis,unit:x.unit,unitPrice:custom?null:Number(x.price),quantity:qty,lineTotal:custom?null:Number(x.price)*qty,custom}}
function maskPhone(p){return p.length>5?"+"+p.slice(0,3)+"••••"+p.slice(-2):"••••••"}
function fixedTotal(items){return items.reduce((s,x)=>s+(x.custom?0:Number(x.lineTotal||0)),0)}
function hasIndividual(items){return items.some(x=>x.custom)}
function detailed(o){const fixed=fixedTotal(o.items);return {orderNumber:o.orderNumber,status:o.status,createdAt:o.createdAt,updatedAt:o.updatedAt||o.createdAt,customer:{name:o.name,phoneMasked:o.phoneMasked,email:o.email},project:o.project||"",items:o.items,pricing:{currency:"UAH",fixedTotal:fixed,total:o.total,hasIndividual:hasIndividual(o.items),individualItems:o.items.filter(x=>x.custom).map(x=>x.name)},comment:o.comment,access:{phoneRequired:true,codeDigits:5},notice:"Стоимость фиксирует ориентир на момент регистрации. Окончательный состав, сроки, договор и внешние расходы согласовываются отдельно."}}
async function readFileOrders(){try{return JSON.parse(await fs.promises.readFile(ORDERS_FILE,"utf8")||"[]")}catch{return[]}}
async function writeFileOrders(items){fileWrite=fileWrite.then(async()=>{const tmp=ORDERS_FILE+".tmp";await fs.promises.writeFile(tmp,JSON.stringify(items,null,2),"utf8");await fs.promises.rename(tmp,ORDERS_FILE)});return fileWrite}
async function initStorage(){
 if(!pool){storageMode="file";const a=await readFileOrders();fileSeq=a.reduce((m,o)=>Math.max(m,Number(String(o.orderNumber||"").split("-").pop())||0),0)+1;return}
 const c=await pool.connect();
 try{
  await c.query("BEGIN");
  await c.query("CREATE SEQUENCE IF NOT EXISTS mmw_order_seq START 1");
  await c.query("CREATE TABLE IF NOT EXISTS mmw_orders(order_number TEXT PRIMARY KEY,phone TEXT NOT NULL,request_id TEXT,access_salt TEXT NOT NULL,access_hash TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL,payload JSONB NOT NULL)");
  await c.query("ALTER TABLE mmw_orders ADD COLUMN IF NOT EXISTS request_id TEXT");
  await c.query("CREATE UNIQUE INDEX IF NOT EXISTS mmw_orders_request_id_idx ON mmw_orders(request_id) WHERE request_id IS NOT NULL");
  const count=await c.query("SELECT count(*)::int n FROM mmw_orders");
  if(Number(count.rows[0].n)===0){
   const local=await readFileOrders();
   for(const o of local)await c.query("INSERT INTO mmw_orders(order_number,phone,request_id,access_salt,access_hash,created_at,payload) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(order_number) DO NOTHING",[o.orderNumber,o.phone,o.requestId||null,o.accessSalt,o.accessHash,o.createdAt,o]);
  }
  const max=await c.query("SELECT COALESCE(MAX(CAST(split_part(order_number,'-',3) AS BIGINT)),0) n FROM mmw_orders");
  const n=Number(max.rows[0].n);if(n>0)await c.query("SELECT setval('mmw_order_seq',$1,true)",[n]);else await c.query("SELECT setval('mmw_order_seq',1,false)");
  await c.query("COMMIT");storageMode="postgres";
 }catch(e){await c.query("ROLLBACK");throw e}finally{c.release()}
}
async function existingByRequest(id){
 if(!id)return null;
 if(pool){const r=await pool.query("SELECT payload FROM mmw_orders WHERE request_id=$1 LIMIT 1",[id]);return r.rows[0]?.payload||null}
 return (await readFileOrders()).find(x=>x.requestId===id)||null
}
async function refreshAccess(o){const code=newCode(),salt=crypto.randomBytes(16).toString("hex");o.accessSalt=salt;o.accessHash=codeHash(code,salt);o.updatedAt=new Date().toISOString();if(pool){await pool.query("UPDATE mmw_orders SET access_salt=$1,access_hash=$2,created_at=created_at,payload=$3 WHERE order_number=$4",[salt,o.accessHash,o,o.orderNumber])}else{const all=await readFileOrders();const i=all.findIndex(x=>x.orderNumber===o.orderNumber);if(i>=0){all[i]=o;await writeFileOrders(all)}}return code}\nasync function createOrder(o){
 if(pool){
  const c=await pool.connect();try{await c.query("BEGIN");const seq=await c.query("SELECT nextval('mmw_order_seq') n");o.orderNumber="MMW-"+new Date().getFullYear()+"-"+String(seq.rows[0].n).padStart(6,"0");await c.query("INSERT INTO mmw_orders(order_number,phone,request_id,access_salt,access_hash,created_at,payload) VALUES($1,$2,$3,$4,$5,$6,$7)",[o.orderNumber,o.phone,o.requestId,o.accessSalt,o.accessHash,o.createdAt,o]);await c.query("COMMIT");return o}catch(e){await c.query("ROLLBACK");throw e}finally{c.release()}}
 const all=await readFileOrders();o.orderNumber="MMW-"+new Date().getFullYear()+"-"+String(fileSeq++).padStart(6,"0");all.push(o);await writeFileOrders(all);return o
}
async function findOrder(phone,code){
 const p=cleanPhone(phone),c=String(code||"").replace(/\D/g,"");if(p.length<7||!/^[0-9]{5}$/.test(c))return null;
 if(pool){const r=await pool.query("SELECT payload,access_salt,access_hash FROM mmw_orders WHERE phone=$1 ORDER BY created_at DESC LIMIT 20",[p]);for(const x of r.rows)if(x.access_hash===codeHash(c,x.access_salt))return x.payload;return null}
 return (await readFileOrders()).find(x=>x.phone===p&&x.accessHash===codeHash(c,x.accessSalt))||null
}
function statementPdf(res,o){
 const doc=new PDFDocument({size:"A4",margin:44,info:{Title:"MMW-COMPANY · "+o.orderNumber,Author:"MMW-COMPANY"}});
 res.writeHead(200,{"Content-Type":"application/pdf","Content-Disposition":"attachment; filename=\"MMW-COMPANY-"+o.orderNumber+".pdf\"","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"});doc.pipe(res);
 const regular=fs.existsSync(path.join(__dirname,"node_modules/dejavu-fonts-ttf/ttf/DejaVuSans.ttf"))?path.join(__dirname,"node_modules/dejavu-fonts-ttf/ttf/DejaVuSans.ttf"):"Helvetica";
 const bold=fs.existsSync(path.join(__dirname,"node_modules/dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf"))?path.join(__dirname,"node_modules/dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf"):"Helvetica-Bold";
 const money=n=>n==null?"Индивидуально":Number(n).toLocaleString("uk-UA")+" грн";
 doc.font(bold).fontSize(21).fillColor("#061a17").text("MMW-COMPANY");doc.font(regular).fontSize(8).fillColor("#0b705b").text("ПОДРОБНАЯ ВЫПИСКА КОММЕРЧЕСКОГО ЗАКАЗА");doc.moveDown(.8);
 doc.font(bold).fontSize(15).fillColor("#061a17").text("ЗАКАЗ "+o.orderNumber);doc.font(regular).fontSize(8).fillColor("#65736e").text(new Date(o.createdAt).toLocaleString("uk-UA"));doc.moveDown(1);
 const field=(a,b)=>{doc.font(bold).fontSize(9).fillColor("#0b705b").text(a);doc.font(regular).fontSize(9).fillColor("#061a17").text(b);doc.moveDown(.35)};
 field("СТАТУС",o.status==="NEW"?"Новая":o.status);field("КЛИЕНТ",o.name);field("ТЕЛЕФОН",o.phoneMasked);field("EMAIL",o.email);if(o.project)field("ПРОЕКТ / НАПРАВЛЕНИЕ",o.project);
 doc.moveDown(.4);doc.font(bold).fontSize(11).fillColor("#061a17").text("СОСТАВ ЗАКАЗА");doc.moveDown(.5);
 o.items.forEach((x,i)=>{doc.font(bold).fontSize(9).fillColor("#061a17").text((i+1)+". "+x.name);doc.font(regular).fontSize(8).fillColor("#65736e").text(x.category+" · "+x.quantity+" "+x.unit+" · "+money(x.unitPrice)+" / ед. · "+money(x.lineTotal));doc.font(regular).fontSize(8).fillColor("#061a17").text(x.description);doc.font(regular).fontSize(7.8).fillColor("#65736e").text("Основание цены: "+x.basis);doc.moveDown(.55)});
 const ft=fixedTotal(o.items);doc.moveTo(44,doc.y).lineTo(551,doc.y).strokeColor("#d8dedb").stroke();doc.moveDown(.6);doc.font(bold).fontSize(12).fillColor("#061a17").text("ИТОГО: "+(hasIndividual(o.items)?(ft?money(ft)+" + индивидуальные позиции":"Индивидуальная стоимость"):money(o.total)));doc.moveDown(.8);
 field("КОММЕНТАРИЙ КЛИЕНТА",o.comment||"—");field("ДОСТУП К ЖУРНАЛУ","Используйте номер телефона, указанный при оформлении, и персональный код из 5 цифр.");
 doc.font(regular).fontSize(7.8).fillColor("#65736e").text("Выписка подтверждает регистрацию запроса и отображает ориентир стоимости на момент оформления. Она не является договором, счётом на оплату или окончательной сметой. Внешние расходы и работы, не включённые в заказ, согласовываются отдельно.");doc.moveDown(.5);doc.font(bold).fontSize(8).fillColor("#0b705b").text("MMW-COMPANY · itimchenko00@gmail.com");doc.end()
}
async function api(req,res,u){
 if(req.method==="GET"&&u==="/api/health")return json(res,200,{ok:true,service:"MMW-COMPANY",contour:"commercial-v3",storage:storageMode,persistence:storageMode==="postgres"?"database":"ephemeral-on-render-free",catalogItems:Object.keys(CATALOG).length,orderLifecycle:"PROJECT → CATALOG → ORDER CENTER → REGISTERED → CUSTOMER JOURNAL → PDF"});
 if(req.method==="GET"&&u==="/api/catalog")return json(res,200,{ok:true,currency:"UAH",updated:"06.10.2026",items:publicCatalog()});
 if(req.method==="POST"&&u==="/api/orders"){
  try{
   const b=await parseBody(req),name=String(b.name||"").trim(),phone=cleanPhone(b.phone),email=String(b.email||"").trim(),comment=String(b.comment||"").trim(),project=String(b.project||"").trim().slice(0,160),rid=requestId(b.requestId);
   if(name.length<2||phone.length<7||!validEmail(email)||comment.length<5||!Array.isArray(b.items)||!b.items.length)return json(res,400,{ok:false,error:"Заполните имя, международный телефон, email, задачу и добавьте позиции в заказ."});
   if(rid){const old=await existingByRequest(rid);if(old){const samePhone=cleanPhone(old.phone)===phone;if(!samePhone)return json(res,409,{ok:false,error:"Идентификатор запроса уже используется."});const freshCode=await refreshAccess(old);return json(res,200,{ok:true,duplicate:true,orderNumber:old.orderNumber,accessCode:freshCode,status:old.status,total:old.total,order:detailed(old),access:{phoneRequired:true,codeDigits:5},message:"Запрос уже был зарегистрирован; выдан новый код доступа."})}}
   const items=b.items.slice(0,50).map(itemFromRequest).filter(Boolean);if(!items.length)return json(res,400,{ok:false,error:"Позиции заказа не распознаны сервером. Обновите страницу и повторите выбор."});
   const subtotal=fixedTotal(items),salt=crypto.randomBytes(16).toString("hex"),code=newCode(),createdAt=new Date().toISOString();
   const o={orderNumber:null,name,phone,phoneMasked:maskPhone(phone),email,project,comment,requestId:rid||null,items,subtotal,total:subtotal,status:"NEW",createdAt,updatedAt:createdAt,accessSalt:salt,accessHash:codeHash(code,salt)};
   const saved=await createOrder(o);
   console.log("MMW ORDER REGISTERED",JSON.stringify({orderNumber:saved.orderNumber,requestId:rid,storage:storageMode,total:subtotal}));
   return json(res,201,{ok:true,orderNumber:saved.orderNumber,accessCode:code,status:saved.status,total:saved.total,order:detailed(saved),issuedAt:saved.createdAt,access:{phoneRequired:true,codeDigits:5}});
  }catch(e){console.error("MMW ORDER ERROR",e);return json(res,500,{ok:false,error:"Заказ не зарегистрирован. Сервер не подтвердил запись. Повторите отправку."})}
 }
 if(req.method==="POST"&&u==="/api/orders/access"){
  try{const b=await parseBody(req),phone=cleanPhone(b.phone),code=String(b.code||"").replace(/\D/g,""),key=(req.socket.remoteAddress||"unknown")+"|"+phone,now=Date.now();let a=accessAttempts.get(key)||{count:0,until:0};if(a.until>now&&a.count>=5)return json(res,429,{ok:false,error:"Слишком много попыток. Повторите через 10 минут."});if(a.until<=now)a={count:0,until:now+600000};a.count++;accessAttempts.set(key,a);const o=await findOrder(phone,code);if(!o)return json(res,401,{ok:false,error:"Заявка не найдена или код неверен."});accessAttempts.delete(key);return json(res,200,{ok:true,order:detailed(o)})}catch(e){return json(res,400,{ok:false,error:"Ошибка проверки доступа."})}
 }
 if(req.method==="POST"&&u==="/api/orders/pdf"){
  try{const b=await parseBody(req),o=await findOrder(b.phone,b.code);if(!o)return json(res,401,{ok:false,error:"Заявка не найдена или код неверен."});if(b.orderNumber&&String(b.orderNumber)!==o.orderNumber)return json(res,403,{ok:false,error:"Доступ к этой выписке не подтверждён."});return statementPdf(res,o)}catch(e){if(!res.headersSent)return json(res,500,{ok:false,error:"Не удалось сформировать PDF-выписку."});res.end()}
 }
 return false
}
const server=http.createServer(async(req,res)=>{const u=(req.url||"/").split("?")[0];if(u.startsWith("/api/")){const done=await api(req,res,u);if(done!==false)return}let clean;try{clean=decodeURIComponent(u)}catch{return json(res,400,{ok:false,error:"Bad request"})}if(clean==="/"||!clean.includes("."))clean="/catalog.html";const f=path.join(ROOT,clean.replace(/^\//,""));if(!f.startsWith(ROOT)){res.writeHead(403);return res.end("Forbidden")}fs.readFile(f,(e,d)=>{if(e){res.writeHead(404,{"Content-Type":"text/plain; charset=utf-8"});return res.end("Not found")}const ext=path.extname(f),types={".html":"text/html; charset=utf-8",".css":"text/css",".js":"text/javascript",".svg":"image/svg+xml",".json":"application/json"};res.writeHead(200,{"Content-Type":types[ext]||"application/octet-stream","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"});res.end(d)})});
async function start(){try{await initStorage();server.listen(PORT,"0.0.0.0",()=>console.log("MMW-COMPANY commercial-v2 on "+PORT+" storage="+storageMode))}catch(e){console.error("MMW STORAGE INIT ERROR",e);process.exit(1)}}
start();
