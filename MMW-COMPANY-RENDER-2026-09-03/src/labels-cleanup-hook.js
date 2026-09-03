const express = require('express');
const originalSend = express.response.send;

// Remove only the requested numeric prefixes from the four named headings.
// Keep all surrounding structure, cards, links, scripts and other numbering intact.
function cleanServerText(body) {
  if (typeof body !== 'string') return body;

  // Exact headings requested by the user: keep the words, remove only the numbers.
  body = body.replace(/01\s*[·•]\s*Система/gi, 'Система');
  body = body.replace(/05\s*[·•]\s*Экономика/gi, 'Экономика');
  body = body.replace(/04\s*[·•]\s*Портфель/gi, 'Портфель');
  body = body.replace(/02\s*[·•]\s*Продукты/gi, 'Продукты');

  // Keep every product CTA visually identical to the other product buttons.
  // Neutralize an accidental primary/yellow state only inside the products block.
  const productButtonFix = '<style id="mmw-products-button-fix">.products .btn{background:transparent;color:inherit;border-color:var(--l)}.products .btn.primary{background:transparent;color:inherit;border-color:var(--l)}</style>';
  if (body.includes('</head>')) body = body.replace('</head>', productButtonFix+'</head>');

  // Catch dynamically generated versions on the client side.
  if (!body.includes('</body>')) return body;
  const cleanupScript = `<script id="mmw-labels-cleanup">(()=>{
const rules=[
  [/^01\\s*[·•]\\s*Система$/i,'Система'],
  [/^05\\s*[·•]\\s*Экономика$/i,'Экономика'],
  [/^04\\s*[·•]\\s*Портфель$/i,'Портфель'],
  [/^02\\s*[·•]\\s*Продукты$/i,'Продукты']
];
const clean=()=>{const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);const nodes=[];while(w.nextNode())nodes.push(w.currentNode);for(const n of nodes){let v=n.nodeValue.trim();for(const [re,repl] of rules){if(re.test(v)){n.nodeValue=n.nodeValue.replace(re,repl);break;}}}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',clean,{once:true});else clean();
new MutationObserver(clean).observe(document.body,{childList:true,subtree:true});
})();</script>`;
  return body.replace('</body>', cleanupScript+'</body>');
}

express.response.send = function(body) {
  return originalSend.call(this, cleanServerText(body));
};
