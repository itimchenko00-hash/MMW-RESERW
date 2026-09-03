const express=require('express');
const originalSend=express.response.send;

const PRODUCT_IDS={
  'BUSINESS CONCEPT':'business-concept',
  'BUSINESS PROJECT':'business-project',
  'BUSINESS SYSTEM':'business-system',
  'INVESTMENT PROJECT':'investment-project',
  'BUSINESS RESTART':'business-restart',
  'BUSINESS SALE':'business-sale',
  'BUSINESS + INVESTOR':'business-investor',
  'CUSTOM BUSINESS PROJECT':'custom-business-project',
  'LARGE SCALE':'large-scale'
};
const ORDER_URL='https://mmw-order.onrender.com/';

function addOrderLinks(html){
  for(const [name,id] of Object.entries(PRODUCT_IDS)){
    const cardRe=new RegExp('(<(?:article|div)[^>]*class="[^"]*(?:product|card)[^"]*"[^>]*>[\\s\\S]*?<h3[^>]*>\\s*)'+name.replace(/[+]/g,'\\+')+'([\\s\\S]*?<a[^>]*class="btn(?: primary)?"[^>]*)(?:href="#package-request"|href="#vacancies"|href="[^"]*")([^>]*>)','i');
    html=html.replace(cardRe,(m,pre,button,tail)=>pre+name+button+'href="'+ORDER_URL+'?add='+encodeURIComponent(id)+'"'+tail.replace(/data-product-id="[^"]*"/g,'')+'');
  }
  html=html.replace(/href="#package-request">Получить расчёт/g,'href="'+ORDER_URL+'">Оформить заявку');
  html=html.replace(/href="#vacancies">Связаться с MMW-COMPANY/g,'href="'+ORDER_URL+'">Оформить заявку через MMW-ORDER');
  return html;
}

function vacanciesSection(){
  return `<section id="vacancies"><div class="wrap"><div class="head"><div><div class="eyebrow">Коммуникация</div><h2>Работаем вместе. <em>Строим проекты.</em></h2></div><p>Если вы хотите работать с MMW-COMPANY, присоединиться к проекту или предложить свою экспертизу — расскажите о себе.</p></div><div class="contact"><div class="panel"><div class="eyebrow">MMW-COMPANY</div><h3>Вакансии и партнёрство</h3><p class="notice">Мы формируем проектные команды под конкретные задачи: управление, финансы, строительство, девелопмент, продажи, маркетинг, IT, логистика и другие направления.</p><div class="noticeBox">Открытые позиции, требования и условия сотрудничества будут опубликованы здесь отдельно.</div></div><div class="panel"><form class="form" action="mailto:itimchenko00@gmail.com" method="post" enctype="text/plain"><input name="Имя" placeholder="Ваше имя" required><input name="Контакт" placeholder="Телефон / мессенджер" required><input name="Email" type="email" placeholder="Email"><input name="Направление" placeholder="Специализация / желаемая позиция"><textarea name="Сообщение" placeholder="Расскажите о себе, опыте и чем вы можете быть полезны проектам MMW-COMPANY"></textarea><button class="btn primary full" type="submit">Связаться с MMW-COMPANY →</button></form></div></div></div></section>`;
}

express.response.send=function(body){
  if(typeof body==='string' && body.includes('</body>') && body.includes('MMW-COMPANY')){
    body=addOrderLinks(body);
    body=body.replace(/<section id="package-request">[\s\S]*?<\/section>/g,vacanciesSection());
  }
  return originalSend.call(this,body);
};
