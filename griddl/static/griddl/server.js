var express = require('express');
var app = express().use(express.static('.')).listen(80, function(){});
console.log('listening...');
