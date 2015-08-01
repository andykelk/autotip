const request = require('request-promise');
const cheerio = require('cheerio');
const config = require('config');
const q = require('bluebird');

function Tips() {
}

Tips.prototype.getTips = function() {
  tipsConfig = config.get('tips');
  return request.get({uri: tipsConfig.url}).then(this.parsePage);
};

Tips.prototype.parsePage = function(page) { 
  $ = cheerio.load(page);
  requests = [];
  tips = [];
  $("div.lscell a").each(function(i, elem) {
    var matchUrl = $(elem).attr("href");
    requests.push(request.get({uri: matchUrl}));
  });
  return q.all(requests).then(function(pages) {return pages.map(function(page) {
    $ = cheerio.load(page);
    var tip = {
      home: $("div#predcontainer1 div.hometeam span.predteamname").html(),
      away: $("div#predcontainer1 div.awayteam span.predteamname").html(),
      tip:  $("div#predcontainer1 div.pcontent span.predteamname").html().replace('<br>',' '),
    };
    return tip;
  })});
};

module.exports = Tips;
