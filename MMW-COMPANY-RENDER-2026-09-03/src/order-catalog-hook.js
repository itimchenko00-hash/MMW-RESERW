const express = require('express');
const originalSend = express.response.send;

// MMW-COMPANY only presents information.
// Tariffs, add-ons and final ordering live in MMW-ORDER.
express.response.send = function(body){
  return originalSend.call(this, body);
};
