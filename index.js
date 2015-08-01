const config = require('config');

var Tips = require('./tips');
var Tipper = require('./tipper');

tips = new Tips();
tipper = new Tipper();
tips.getTips().then(tipper.enterTips);
