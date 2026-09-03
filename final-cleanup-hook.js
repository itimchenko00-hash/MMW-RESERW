const express = require('express');
const originalSend = express.response.send;

function cleanCompanyHtml(body) {
  if (typeof body !== 'string' || !body.includes('</body>')) return body;

  // Remove the old four-stat strip completely. This is intentionally applied
  // to the final HTML response so no earlier transform can reintroduce it.
  body = body.replace(/<div\s+class=["']wrap\s+stats["'][^>]*>[\s\S]*?<\/div>\s*(?=<section\b)/gi, '');
  body = body.replace(/<div\s+class=["']stat["'][^>]*>\s*<b>\s*(?:MODEL|SYSTEM|LAUNCH)\s*<\/b>[\s\S]*?<\/div>/gi, '');

  // Final safety pass for the exact legacy labels, including variants created
  // by the original canonical HTML.
  body = body.replace(/<b>\s*(?:MODEL|SYSTEM|LAUNCH)\s*<\/b>\s*<span>\s*(?:Экономика проекта|Управление и процессы|План запуска)\s*<\/span>/gi, '');

  return body;
}

express.response.send = function (body) {
  return originalSend.call(this, cleanCompanyHtml(body));
};
