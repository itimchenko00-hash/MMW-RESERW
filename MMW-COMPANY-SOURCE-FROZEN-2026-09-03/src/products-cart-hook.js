const express = require('express');
const originalSend = express.response.send;

// MMW-COMPANY is informational only.
// Orders are completed exclusively in MMW-ORDER; no cart is injected here.
express.response.send = function(body){
  return originalSend.call(this, body);
};
