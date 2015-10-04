const config = require('config');

var Tips = require('./tips');
var Tipper = require('./tipper');

winston = require('winston');

winston.add(winston.transports.File, { filename: 'autotip.log' });
winston.remove(winston.transports.Console);

winston.log('info', 'Starting up...');

tips = new Tips();
tipper = new Tipper();
tips.getTips().then(tipper.enterTips);
