const express = require('express');
const originalSend = express.response.send;

express.response.send = function(body){
  if(typeof body === 'string' && body.includes('MMW-COMPANY') && body.includes('<div class="wrap stats">')){
    body = body.replace(/<div class="stat">[\s\S]*?<b>\s*(MODEL|SYSTEM|LAUNCH)\s*<\/b>[\s\S]*?<\/div>/gi, '');
    body = body.replace(/<div class="wrap stats">\s*<div class="stat">[\s\S]*?<\/div>\s*<\/div>/gi, match => match.replace(/<div class="wrap stats">/, '<div class="wrap stats" style="grid-template-columns:1fr">'));
  }
  return originalSend.call(this, body);
};
