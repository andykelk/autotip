const request = require('request');
const cheerio = require('cheerio');
const config = require('config');

function Tipper() {
}

Tipper.prototype.enterTips = function(predictions) {
  tipperConfig = config.get('tipper');
  request.get({uri: tipperConfig.url, jar: true}, function(err, response, page) {
    $ = cheerio.load(page);
    var csrfToken = $('input[name="csrfmiddlewaretoken"]').val();
    request.post({
      uri: tipperConfig.url + 'accounts/login/',
      form: {
        username: tipperConfig.username,
        password: tipperConfig.password,
        csrfmiddlewaretoken: csrfToken
      },
      jar: true,
      followAllRedirects: true
    }, function(err, response, page) {
      var form = {};
      $ = cheerio.load(page);

      var csrfToken = $('input[name="csrfmiddlewaretoken"]').val();
      form['csrfmiddlewaretoken'] = csrfToken;
      form['prediction_formset-TOTAL_FORMS'] = 10;
      form['prediction_formset-INITIAL_FORMS'] = 0;
      form['prediction_formset-MAX_NUM_FORMS'] = 10;
      count = 0;
      joker = 0;
      $("tbody.ism-fixture").each(function() {
        count++;
        $this = $(this);
        //need to check one of the prediction_formset-0-joker ones...
        var home = $this.find('td.ism-team').eq(0).text();
        var away = $this.find('td.ism-team').eq(1).text();
        var optionName = $this.find('td.ism-js-tips').eq(0).find('input').attr('name');
        var homeWin = $this.find('td.ism-js-tips').eq(0).find('input').attr('value');
        var draw = $this.find('td.ism-js-tips').eq(1).find('input').attr('value');
        var awayWin = $this.find('td.ism-js-tips').eq(2).find('input').attr('value');
        var jokerOption = $this.find('label.ism-joker').eq(0).find('input').attr('name');
        // map Tottenham to Spurs
        if (home == 'Spurs') {
          home = 'Tottenham';
        }
        var tip;
        predictions.forEach(function(prediction) {
          if (prediction.home == home && prediction.away == away) {
            tip = prediction.tip;
          }
        });
        if (tip) {
          if (tip.match(/away win/i)) {
            form[optionName] = awayWin;
          }
          else if (tip.match(/home win/i)) {
            form[optionName] = homeWin;
          }
          else if (tip.match(/draw/i)) {
            form[optionName] = draw;
          }
          if (joker == 0 && tip.match(/large/i)) {
            joker = 1;
            form[jokerOption] = 'on';
          }
        }
        count--;
      });
      while (count > 0) {
        next;
      }
      //console.log(form);
      request.post({
        uri: response.request.uri.href,
        form: form,
        jar: true
      });
    });
  });
};

module.exports = Tipper;
