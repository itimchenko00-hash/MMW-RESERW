import PDFDocument from 'pdfkit';
import fs from 'node:fs';
const money=n=>new Intl.NumberFormat('uk-UA',{style:'currency',currency:'UAH',maximumFractionDigits:0}).format(Number(n)||0);
const fontCandidates=['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf','/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf'];
const boldCandidates=['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf','/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf'];
const regularPath=fontCandidates.find(p=>fs.existsSync(p));
const boldPath=boldCandidates.find(p=>fs.existsSync(p));
const C={forest:'#082D22',emerald:'#167A55',mint:'#BDEFD4',paper:'#F4F8F5',ink:'#18352A',muted:'#61786C',line:'#D9E6DE',white:'#FFFFFF'};
export function orderPdf(o){
 return new Promise((resolve,reject)=>{
  const doc=new PDFDocument({size:'A4',margin:42});const chunks=[];
  doc.on('data',c=>chunks.push(c));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);
  const regular=()=>regularPath?doc.font(regularPath):doc.font('Helvetica');
  const bold=()=>boldPath?doc.font(boldPath):doc.font('Helvetica-Bold');
  const right=doc.page.width-42;const width=right-42;let y;
  const date=new Date(o.createdAt).toLocaleString('uk-UA',{day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});
  const section=(n,title)=>{bold().fontSize(10).fillColor(C.emerald).text(n+'  /  '+title,42,y);y+=22;};
  const tableHead=()=>{doc.roundedRect(42,y,width,25,5).fill(C.forest);regular().fontSize(8).fillColor(C.white).text('НАИМЕНОВАНИЕ',52,y+8,{width:220});regular().fontSize(8).fillColor(C.white).text('КОЛ-ВО',278,y+8,{width:48,align:'center'});regular().fontSize(8).fillColor(C.white).text('ЦЕНА',335,y+8,{width:65,align:'right'});regular().fontSize(8).fillColor(C.white).text('СУММА',right-78,y+8,{width:68,align:'right'});y+=25;};
  const pageHeader=()=>{doc.rect(0,0,doc.page.width,105).fill(C.forest);doc.rect(0,101,doc.page.width,4).fill(C.emerald);doc.circle(62,43,19).lineWidth(1.3).strokeColor(C.mint).stroke();bold().fontSize(10).fillColor(C.mint).text('MMW',43,39,{width:38,align:'center'});bold().fontSize(18).fillColor(C.white).text('MMW',92,23);regular().fontSize(8).fillColor('#C4DED0').text('PROJECT DEVELOPMENT & MANAGEMENT',92,46,{characterSpacing:.9});bold().fontSize(17).fillColor(C.white).text('ВЫПИСКА ПО ЗАЯВКЕ',42,68);};
  pageHeader();
  y=126;doc.roundedRect(42,y,width,65,9).fill(C.paper);regular().fontSize(7.5).fillColor(C.muted).text('НОМЕР ЗАЯВКИ',56,y+10);bold().fontSize(12).fillColor(C.ink).text(String(o.id),56,y+25,{width:300});regular().fontSize(7.5).fillColor(C.muted).text('СТАТУС',right-115,y+10,{width:98,align:'right'});bold().fontSize(10).fillColor(C.emerald).text(String(o.status||'Новая'),right-150,y+25,{width:133,align:'right'});
  regular().fontSize(8.5).fillColor(C.muted).text('Дата оформления: '+date,42,y+76);regular().fontSize(8.5).fillColor(C.muted).text('Код доступа: '+String(o.accessCode||'—'),right-175,y+76,{width:175,align:'right'});
  y+=101;section('01','ДАННЫЕ КЛИЕНТА');
  const customer=[['Имя',o.customerName],['Телефон',o.phone],['Email',o.email],['Компания',o.company],['Тип проекта',o.projectType],['Адрес',o.address]].filter(v=>v[1]);
  const gap=10,colW=(width-gap)/2,rowH=40;
  customer.forEach((v,i)=>{const col=i%2,row=Math.floor(i/2),x=42+col*(colW+gap),yy=y+row*rowH;doc.roundedRect(x,yy,colW,rowH-5,6).fillAndStroke(C.white,C.line);regular().fontSize(7).fillColor(C.muted).text(v[0].toUpperCase(),x+9,yy+6,{width:colW-18});regular().fontSize(8.5).fillColor(C.ink).text(String(v[1]),x+9,yy+18,{width:colW-18,height:15,ellipsis:true});});
  y+=Math.ceil(customer.length/2)*rowH+9;section('02','СОСТАВ ЗАКАЗА');tableHead();
  (o.items||[]).forEach((item,i)=>{const name=String(item.name||'Позиция'),qty=Number(item.qty)||1,price=Number(item.price)||0;regular().fontSize(8.3);const nameHeight=doc.heightOfString(name,{width:210});const h=Math.max(29,nameHeight+13);if(y+h>doc.page.height-75){doc.addPage();pageHeader();y=122;tableHead();}if(i%2===0)doc.rect(42,y,width,h).fill(C.paper);regular().fontSize(8.3).fillColor(C.ink).text(name,52,y+7,{width:210});regular().fontSize(8.3).fillColor(C.ink).text(String(qty),278,y+7,{width:48,align:'center'});regular().fontSize(8.3).fillColor(C.ink).text(money(price),335,y+7,{width:65,align:'right'});regular().fontSize(8.3).fillColor(C.ink).text(money(price*qty),right-78,y+7,{width:68,align:'right'});y+=h;});
  y+=13;if(y>doc.page.height-112){doc.addPage();pageHeader();y=122;}doc.roundedRect(right-222,y,222,59,8).fill(C.forest);regular().fontSize(7.5).fillColor(C.mint).text('ИТОГОВАЯ СТОИМОСТЬ',right-207,y+10,{width:192,align:'right'});bold().fontSize(16).fillColor(C.white).text(money(o.total),right-207,y+25,{width:192,align:'right'});y+=72;
  if(o.comment){if(y>doc.page.height-100){doc.addPage();pageHeader();y=122;}section('03','КОММЕНТАРИЙ');regular().fontSize(8.5).fillColor(C.ink).text(String(o.comment),42,y,{width});y=doc.y+14;}
  const footerY=doc.page.height-44;doc.moveTo(42,footerY-9).lineTo(right,footerY-9).lineWidth(.7).strokeColor(C.line).stroke();regular().fontSize(7).fillColor(C.muted).text('MMW  /  РАЗВИТИЕ ПРОЕКТОВ ОТ ВОЗМОЖНОСТИ ДО РЕЗУЛЬТАТА',42,footerY,{width:330});regular().fontSize(7).fillColor(C.muted).text('СФОРМИРОВАНО АВТОМАТИЧЕСКИ',right-175,footerY,{width:175,align:'right'});
  doc.end();
 });
}