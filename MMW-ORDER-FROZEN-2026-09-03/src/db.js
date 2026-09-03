import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import {catalog} from './catalog.js';
const {Pool}=pg;
const usePg=Boolean(process.env.DATABASE_URL);
const file=path.resolve('.data/orders.json');
let pool;
async function init(){
  if(usePg){
    pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_URL.includes('localhost')?false:{rejectUnauthorized:false}});
    await pool.query(`CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, access_code TEXT UNIQUE NOT NULL, access_token TEXT UNIQUE NOT NULL, created_at TIMESTAMPTZ NOT NULL, status TEXT NOT NULL, customer_name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT NOT NULL, company TEXT DEFAULT '', project_type TEXT DEFAULT '', address TEXT DEFAULT '', comment TEXT DEFAULT '', items_json JSONB NOT NULL, total INTEGER NOT NULL)`);
  }else{fs.mkdirSync(path.dirname(file),{recursive:true});if(!fs.existsSync(file))fs.writeFileSync(file,'[]')}
}
export const ready=init();
function local(){return JSON.parse(fs.readFileSync(file,'utf8'))}
function save(x){fs.writeFileSync(file,JSON.stringify(x,null,2))}
const catalogItems=[...catalog.packages,...catalog.products,...catalog.services];
const catalogById=new Map(catalogItems.map(x=>[String(x.id),x]));
function normalize(items=[]){return items.filter(x=>x&&catalogById.has(String(x.id))).map(x=>{const item=catalogById.get(String(x.id));return {id:item.id,name:item.name,price:item.price,qty:Math.max(1,Math.min(99,Number(x.qty)||1))}})}
function makeCode(){return String(crypto.randomInt(10000,100000))}
export async function createOrder(p){
 await ready;const items=normalize(p.items);if(!items.length)throw new Error('Корзина пуста');
 const total=items.reduce((s,x)=>s+x.price*x.qty,0),createdAt=new Date().toISOString(),accessToken=crypto.randomBytes(24).toString('hex');let accessCode,id;
 for(let i=0;i<20;i++){accessCode=makeCode();id=`MMW-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${accessCode}`;const exists=usePg?(await pool.query('SELECT 1 FROM orders WHERE id=$1 OR access_code=$2',[id,accessCode])).rowCount:local().some(x=>x.id===id||x.accessCode===accessCode);if(!exists)break}
 if(!accessCode||!id)throw new Error('Не удалось сформировать идентификаторы заявки');
 const order={id,accessCode,accessToken,createdAt,status:'Новая',customerName:p.customerName,phone:p.phone,email:p.email,company:p.company||'',projectType:p.projectType||'',address:p.address||'',comment:p.comment||'',items,total};
 if(usePg)await pool.query('INSERT INTO orders (id,access_code,access_token,created_at,status,customer_name,phone,email,company,project_type,address,comment,items_json,total) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)',[id,accessCode,accessToken,createdAt,'Новая',order.customerName,order.phone,order.email,order.company,order.projectType,order.address,order.comment,JSON.stringify(items),total]);else{const rows=local();rows.push(order);save(rows)}return order;
}
function publicOrder(r){return {id:r.id,accessCode:r.access_code||r.accessCode,createdAt:r.created_at||r.createdAt,status:r.status,customerName:r.customer_name||r.customerName,phone:r.phone,email:r.email,company:r.company||'',projectType:r.project_type||r.projectType||'',address:r.address||'',comment:r.comment||'',items:r.items_json||r.items,total:Number(r.total)}}
export async function getOrderByCode(code){
  await ready;
  code=String(code||'').trim();
  if(!/^\d{5}$/.test(code))return null;
  let r;
  if(usePg)r=(await pool.query('SELECT * FROM orders WHERE access_code=$1 LIMIT 1',[code])).rows[0];
  else r=local().find(x=>String(x.accessCode)===code);
  return r?publicOrder(r):null;
}
export async function listOrders(token){await ready;const rows=usePg?(await pool.query('SELECT * FROM orders WHERE access_token=$1 ORDER BY created_at DESC',[token])).rows:local().filter(x=>x.accessToken===token).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));return rows.map(publicOrder)}
export async function listAllOrders(){await ready;const rows=usePg?(await pool.query('SELECT * FROM orders ORDER BY created_at DESC')).rows:local().sort((a,b)=>b.createdAt.localeCompare(a.createdAt));return rows.map(publicOrder)}
export async function updateOrderStatus(id,status){await ready;const allowed=['Новая','В работе','Ожидает уточнения','Выполнена','Отменена'];if(!allowed.includes(status))throw new Error('Недопустимый статус');if(usePg){const r=await pool.query('UPDATE orders SET status=$2 WHERE id=$1 RETURNING *',[id,status]);return r.rows[0]?publicOrder(r.rows[0]):null}const rows=local();const x=rows.find(o=>o.id===id);if(!x)return null;x.status=status;save(rows);return publicOrder(x)}
export const orderStatuses=['Новая','В работе','Ожидает уточнения','Выполнена','Отменена'];
