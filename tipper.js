const request = require('request');
const cheerio = require('cheerio');
const config = require('config');

function Tipper() {
}

Tipper.prototype.enterTips = function(predictions) {
  tipperConfig = config.get('tipper');
  request.get({uri: tipperConfig.url, jar: true}, function(err, response, page) {
    winston.log('info', 'Loaded main tipping page');
    $ = cheerio.load(page);
    var csrfToken = $('input[name="csrfmiddlewaretoken"]').val();
    var loginForm ={
      username: tipperConfig.username,
      password: tipperConfig.password,
      csrfmiddlewaretoken: csrfToken
    }; 
    winston.log('info', 'Form we are sending is: %s', JSON.stringify(loginForm));
    request.post({
      uri: tipperConfig.url + 'accounts/login/',
      form: loginForm,
      jar: true,
      followAllRedirects: true
    }, function(err, response, page) {
      winston.log('info', 'Logged in');
      $ = cheerio.load(page);
      thisWeek = $('li.ismCurrent a').attr('href');
      winston.log('info', 'Link to this week is %s', thisWeek);
      request.get({
        uri: tipperConfig.url + thisWeek,
        jar: true,
        followAllRedirects: true
      }, function(err, response, page) {
        winston.log('info', 'Loaded this week page');
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
        winston.log('info', 'Form we are sending is: %s', JSON.stringify(form));
        request.post({
          uri: response.request.uri.href,
          form: form,
          jar: true
        }, function(err, response, page) {
          if (err) {
            winston.log('info', 'Error from post: %s', JSON.stringify(err));
          }
        });
      });
    });
  });
};

module.exports = Tipper;
