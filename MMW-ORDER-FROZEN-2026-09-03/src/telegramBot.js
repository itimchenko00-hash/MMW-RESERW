import {config} from './config.js';
import {getOrderByCode,listAllOrders,updateOrderStatus,orderStatuses} from './db.js';

const money=n=>new Intl.NumberFormat('uk-UA',{style:'currency',currency:'UAH',maximumFractionDigits:0}).format(n);
const esc=s=>String(s??'').replace(/[<>&]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]));

async function tg(method,body){
  const token=String(config.telegramBotToken||'').trim();
  if(!token)throw new Error('TELEGRAM_BOT_TOKEN не настроен');
  const r=await fetch(`https://api.telegram.org/bot${token}/${method}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  const data=await r.json().catch(()=>({}));
  if(!r.ok||!data.ok)throw new Error(data.description||`Telegram HTTP ${r.status}`);
  return data.result;
}

function allowed(chatId){return String(chatId)===String(config.telegramChatId||'').trim();}
function help(){return 'MMW-COMPANY BOT\n\n/start — меню\n/orders — последние заявки\n/find 12345 — найти заявку по 5-значному коду\n/status 12345 В работе — изменить статус\n/health — состояние каналов';}
function orderText(o){return `ЗАЯВКА ${esc(o.id)}\nКод: ${esc(o.accessCode)}\nСтатус: ${esc(o.status)}\n\nКлиент: ${esc(o.customerName)}\nТелефон: ${esc(o.phone)}\nEmail: ${esc(o.email)}\nКомпания: ${esc(o.company||'—')}\nТип проекта: ${esc(o.projectType||'—')}\nАдрес: ${esc(o.address||'—')}\n\nЗАКАЗ\n${o.items.map(i=>`• ${esc(i.name)} × ${i.qty} — ${money(i.price*i.qty)}`).join('\n')}\n\nИТОГО: ${money(o.total)}\nКомментарий: ${esc(o.comment||'—')}`;}

export async function handleTelegramUpdate(update){
  const msg=update?.message;
  if(!msg?.chat?.id||!msg.text)return {ok:true,ignored:true};
  if(!allowed(msg.chat.id)){await tg('sendMessage',{chat_id:msg.chat.id,text:'Доступ запрещён.'});return {ok:false,forbidden:true};}
  const text=msg.text.trim();
  if(/^\/(start|help)(@\w+)?$/i.test(text)){await tg('sendMessage',{chat_id:msg.chat.id,text:help()});return {ok:true};}
  if(/^\/health$/i.test(text)){
    const h={email:Boolean(config.resendApiKey&&config.resendFrom&&config.adminEmail),telegram:Boolean(config.telegramBotToken&&config.telegramChatId),database:Boolean(config.databaseUrl)};
    await tg('sendMessage',{chat_id:msg.chat.id,text:`MMW-ORDER HEALTH\nEmail: ${h.email?'OK':'НЕ НАСТРОЕН'}\nTelegram: ${h.telegram?'OK':'НЕ НАСТРОЕН'}\nPostgreSQL: ${h.database?'OK':'НЕ НАСТРОЕН'}`});return {ok:true};
  }
  if(/^\/orders$/i.test(text)){
    const orders=await listAllOrders();
    const latest=orders.slice(0,10);
    const out=latest.length?latest.map(o=>`${o.id} | ${o.status} | ${money(o.total)} | код ${o.accessCode}`).join('\n'):'Заявок пока нет.';
    await tg('sendMessage',{chat_id:msg.chat.id,text:`ПОСЛЕДНИЕ ЗАЯВКИ\n\n${out}`});return {ok:true};
  }
  const find=text.match(/^\/find\s+(\d{5})$/i);
  if(find){const o=await getOrderByCode(find[1]);await tg('sendMessage',{chat_id:msg.chat.id,text:o?orderText(o):'Заявка с таким кодом не найдена.'});return {ok:true};}
  const st=text.match(/^\/status\s+(\d{5})\s+(.+)$/i);
  if(st){const o=await getOrderByCode(st[1]);if(!o){await tg('sendMessage',{chat_id:msg.chat.id,text:'Заявка не найдена.'});return {ok:true};}const status=st[2].trim();if(!orderStatuses.includes(status)){await tg('sendMessage',{chat_id:msg.chat.id,text:`Недопустимый статус. Доступны: ${orderStatuses.join(', ')}`});return {ok:true};}const updated=await updateOrderStatus(o.id,status);await tg('sendMessage',{chat_id:msg.chat.id,text:`Статус заявки ${updated.id} изменён на «${updated.status}».`});return {ok:true};}
  await tg('sendMessage',{chat_id:msg.chat.id,text:help()});return {ok:true};
}

export async function setTelegramWebhook(){
  if(!config.telegramBotToken||!config.publicBaseUrl)return {ok:false,error:'Не настроены TELEGRAM_BOT_TOKEN или PUBLIC_BASE_URL'};
  return tg('setWebhook',{url:`${config.publicBaseUrl.replace(/\/$/,'')}/api/telegram/webhook`});
}
