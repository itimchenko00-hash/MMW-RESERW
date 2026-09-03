import express from 'express';
import helmet from 'helmet';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {catalog} from './catalog.js';
import {createOrder,listOrders,getOrderByCode,listAllOrders,updateOrderStatus,orderStatuses} from './db.js';
import {notifyOrder,notifyFeedback,sendTestNotifications} from './notifications.js';
import {handleTelegramUpdate} from './telegramBot.js';
import {orderPdf} from './pdf.js';
import {config} from './config.js';

const dir=path.dirname(fileURLToPath(import.meta.url));
const app=express();
const accessAttempts=new Map();
const WINDOW=10*60*1000,MAX_ATTEMPTS=12;

app.use(helmet({contentSecurityPolicy:false}));
app.use(express.json({limit:'100kb'}));
app.use(express.static(path.join(dir,'../public')));

const admin=(q,r,next)=>{if(!config.adminKey)return r.status(503).json({error:'ADMIN_KEY не настроен на сервере.'});if(q.query.key===config.adminKey||q.headers['x-admin-key']===config.adminKey)return next();return r.status(401).json({error:'Доступ к журналу запрещён.'});};
app.get('/api/health',(q,r)=>r.json({ok:true,app:'MMW-ORDER',database:Boolean(config.databaseUrl),email:Boolean(config.resendApiKey&&config.resendFrom&&config.adminEmail),telegram:Boolean(config.telegramBotToken&&config.telegramChatId)}));
app.get('/api/config',(q,r)=>r.json({app:config.appName,telegramBotUsername:config.telegramBotUsername||''}));
app.get('/api/catalog',(q,r)=>r.json(catalog));
app.get('/api/orders',async(q,r)=>{try{const t=String(q.query.token||'');if(!/^[a-f0-9]{48}$/.test(t))return r.status(400).json({error:'Некорректный токен'});r.json({orders:await listOrders(t)});}catch(e){console.error(e);r.status(500).json({error:'Не удалось загрузить заявки.'});}});
app.get('/api/admin/orders',admin,async(q,r)=>{try{r.json({orders:await listAllOrders(),statuses:orderStatuses});}catch(e){console.error(e);r.status(500).json({error:'Не удалось загрузить журнал.'});}});
app.patch('/api/admin/orders/:id/status',admin,async(q,r)=>{try{const o=await updateOrderStatus(q.params.id,String(q.body?.status||''));if(!o)return r.status(404).json({error:'Заявка не найдена.'});r.json({order:o});}catch(e){r.status(400).json({error:e.message});}});
app.post('/api/admin/test-notifications',admin,async(q,r)=>{try{r.json({notifications:await sendTestNotifications()});}catch(e){console.error(e);r.status(500).json({error:'Тест уведомлений не выполнен.'});}});
app.post('/api/telegram/webhook',async(q,r)=>{r.status(200).json({ok:true});try{await handleTelegramUpdate(q.body||{});}catch(e){console.error('Telegram webhook error:',e.message);}});
app.post('/api/order-access',async(q,r)=>{try{const ip=q.ip||q.socket.remoteAddress||'unknown',now=Date.now(),a=accessAttempts.get(ip)||[],recent=a.filter(t=>now-t<WINDOW);if(recent.length>=MAX_ATTEMPTS)return r.status(429).json({error:'Слишком много попыток. Повторите через 10 минут.'});recent.push(now);accessAttempts.set(ip,recent);const code=String(q.body?.code||'').trim();if(!/^\d{5}$/.test(code))return r.status(400).json({error:'Введите ровно 5 цифр кода доступа.'});const order=await getOrderByCode(code);if(!order)return r.status(404).json({error:'Заявка с таким кодом не найдена.'});accessAttempts.delete(ip);r.json({order});}catch(e){console.error(e);r.status(500).json({error:'Не удалось открыть заявку.'});}});
app.get('/api/orders/:id/pdf',async(q,r)=>{try{const id=String(q.params.id||'').trim().toUpperCase(),code=String(q.query.code||'').trim();const o=await getOrderByCode(code);if(!o||o.id!==id)return r.status(404).json({error:'Заявка или код доступа не найдены.'});const pdf=await orderPdf(o);r.setHeader('Content-Type','application/pdf');r.setHeader('Content-Disposition',`attachment; filename="${o.id}.pdf"`);r.send(pdf);}catch(e){console.error(e);r.status(500).json({error:'Не удалось сформировать PDF.'});}});
app.post('/api/orders',async(q,r)=>{try{const p=q.body||{};if(!p.customerName?.trim()||!p.phone?.trim()||!p.email?.trim()||!Array.isArray(p.items)||!p.items.length)return r.status(400).json({error:'Заполните имя, телефон, email и добавьте позицию.'});if(!/^\S+@\S+\.\S+$/.test(p.email))return r.status(400).json({error:'Проверьте email.'});const o=await createOrder({customerName:p.customerName.trim().slice(0,120),phone:p.phone.trim().slice(0,40),email:p.email.trim().slice(0,160),company:String(p.company||'').trim().slice(0,160),projectType:String(p.projectType||'').trim().slice(0,100),address:String(p.address||'').trim().slice(0,300),comment:String(p.comment||'').trim().slice(0,2000),items:p.items});const notifications=await notifyOrder(o);r.status(201).json({order:{...o,accessToken:undefined},accessCode:o.accessCode,accessToken:o.accessToken,notifications});}catch(e){console.error(e);r.status(500).json({error:'Не удалось создать заявку.'});}});
app.post('/api/feedback',async(q,r)=>{try{const p=q.body||{};if(!p.name?.trim()||!p.contact?.trim()||!p.message?.trim())return r.status(400).json({error:'Заполните имя, контакт и сообщение.'});const result=await notifyFeedback({name:String(p.name).trim().slice(0,120),contact:String(p.contact).trim().slice(0,160),message:String(p.message).trim().slice(0,2000)});r.status(201).json({ok:true,notifications:result});}catch(e){console.error(e);r.status(500).json({error:'Не удалось отправить сообщение.'});}});
app.listen(config.port,()=>console.log(`MMW-ORDER listening on ${config.port}`));
