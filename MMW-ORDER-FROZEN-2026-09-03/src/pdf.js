import PDFDocument from 'pdfkit';
import fs from 'node:fs';
const money=n=>new Intl.NumberFormat('uk-UA',{style:'currency',currency:'UAH',maximumFractionDigits:0}).format(n);
const fontCandidates=['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf','/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf'];
const cyrillicFont=fontCandidates.find(p=>fs.existsSync(p));
export function orderPdf(o){
  return new Promise((resolve,reject)=>{
    const doc=new PDFDocument({size:'A4',margin:50}); const chunks=[];
    doc.on('data',c=>chunks.push(c)); doc.on('end',()=>resolve(Buffer.concat(chunks))); doc.on('error',reject);
    if(cyrillicFont)doc.font(cyrillicFont);
    doc.fontSize(20).text('MMW-ORDER',{align:'center'}); doc.moveDown(.4); doc.fontSize(16).text('ВЫПИСКА ПО ЗАЯВКЕ',{align:'center'}); doc.moveDown();
    doc.fontSize(11).text(`Номер заявки: ${o.id}`); doc.text(`Код доступа: ${o.accessCode}`); doc.text(`Дата: ${new Date(o.createdAt).toLocaleString('uk-UA')}`); doc.text(`Статус: ${o.status}`); doc.moveDown();
    doc.fontSize(13).text('ЗАКАЗЧИК'); doc.fontSize(11).text(`Имя: ${o.customerName}`); doc.text(`Телефон: ${o.phone}`); doc.text(`Email: ${o.email}`); if(o.company)doc.text(`Компания: ${o.company}`); if(o.projectType)doc.text(`Тип проекта: ${o.projectType}`); if(o.address)doc.text(`Адрес: ${o.address}`); doc.moveDown();
    doc.fontSize(13).text('СОСТАВ ЗАКАЗА'); doc.moveDown(.3); doc.fontSize(11); o.items.forEach(i=>doc.text(`${i.name} — ${i.qty} × ${money(i.price)} = ${money(i.price*i.qty)}`)); doc.moveDown(); doc.fontSize(14).text(`ИТОГО: ${money(o.total)}`); if(o.comment){doc.moveDown();doc.fontSize(13).text('КОММЕНТАРИЙ');doc.fontSize(11).text(o.comment)}
    doc.moveDown(2);doc.fontSize(9).fillColor('#666').text('Документ сформирован автоматически системой MMW-ORDER.'); doc.end();
  });
}
