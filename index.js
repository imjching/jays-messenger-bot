var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();

var token = process.env.ACCESS_TOKEN;

function sendTextMessage(sender, text) {
  messageData = {
    text:text
  }
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token:token},
    method: 'POST',
    json: {
      recipient: {id:sender},
      message: messageData,
    }
  }, function(error, response, body) {
    if (error) {
      console.log('Error sending message: ', error);
    } else if (response.body.error) {
      console.log('Error: ', response.body.error);
    }
  });
}

function sendGenericMessage(sender) {
  messageData = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements": [{
          "title": "First card",
          "subtitle": "Element #1 of an hscroll",
          "image_url": "http://messengerdemo.parseapp.com/img/rift.png",
          "buttons": [{
            "type": "web_url",
            "url": "https://www.messenger.com/",
            "title": "Web url"
          }, {
            "type": "postback",
            "title": "Postback",
            "payload": "Payload for first element in a generic bubble",
          }],
        },{
          "title": "Second card",
          "subtitle": "Element #2 of an hscroll",
          "image_url": "http://messengerdemo.parseapp.com/img/gearvr.png",
          "buttons": [{
            "type": "postback",
            "title": "Postback",
            "payload": "Payload for second element in a generic bubble",
          }],
        }]
      }
    }
  };
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token:token},
    method: 'POST',
    json: {
      recipient: {id:sender},
      message: messageData,
    }
  }, function(error, response, body) {
    if (error) {
      console.log('Error sending message: ', error);
    } else if (response.body.error) {
      console.log('Error: ', response.body.error);
    }
  });
}

app.use(bodyParser.json());

app.set('port', (process.env.PORT || 8000));
app.set('verify_token', (process.env.VERIFY_TOKEN || 'f334b099'));

app.get('/webhook/', function (req, res) {
  if (req.query['hub.verify_token'] === app.get('verify_token')) {
    res.send(req.query['hub.challenge']);
    return;
  }
  res.send('Error, wrong validation token');
})

// execute a single shell command where "cmd" is a string
var exec = function(cmd, cb){
  var child_process = require('child_process');
  var parts = cmd.split(/\s+(.+)?/)[1];
  var ls = child_process.exec(parts, function (err, stdout, stderr) {
    if (err) {
      console.log(error.stack);
      console.log('Error code: ' + error.code);
      console.log('Signal received: ' + error.signal);
      cb('command "' + cmd + '" exited with wrong status code "' + error.code + '"');
    } else {
      console.log('Child Process STDOUT: '+stdout);
      cb(stdout);
    }
  });

  ls.on('exit', function (code) {
    console.log('Child process exited with exit code '+code);
  });
};

var hello = function(text, callback) {
  var output = ['List of commands: ', 'Hello', 'startServer', 'memoryUsage', 'prepareDemo'];

  callback(output.join('\n'));
};

var start_server = function (text, callback) {
  exec('/exec ls -1', callback);
};

var memory_usage = function(text, callback) {

};

var preparing_demo = function(text, callback) {

};

var exec_command = function(text, callback) {
  console.log('exec...'+ text);
  exec(text, callback);
};

var routes = {
  '^Hello': hello,
  '^startServer': start_server,
  '^memoryUsage': memory_usage,
  '^prepareDemo': preparing_demo,
  '^\\/exec\\s[^$]+': exec_command
};

// def memory_usage(message, match):
//     output = memReport()
//     return TextMessageProtocolEntity('\n'.join(output), to=message.getFrom())

// def preparing_demo(message, match):
//     return TextMessageProtocolEntity('Something awesome is cooking', to=message.getFrom())


app.post('/webhook/', function (req, res) {
  messaging_events = req.body.entry[0].messaging;
  for (i = 0; i < messaging_events.length; i++) {
    event = req.body.entry[0].messaging[i];
    sender = event.sender.id;
    if (event.postback) {
      text = JSON.stringify(event.postback);
      sendTextMessage(sender, "Postback received: "+text.substring(0, 320), token);
      continue;
    }
    if (event.message && event.message.text) {
      text = event.message.text;
      console.log(text);
      if (text === 'Generic') {
        sendGenericMessage(sender);
        continue;
      }

      for (var route in routes) {
        if (routes.hasOwnProperty(route)) {
          console.log('text' + text);
          console.log('route' + route);
          if (text.match(route)) {
            console.log(routes[route]);
            routes[route](text, function(data) {
              if (data) {
                sendTextMessage(sender, data.substring(0, 320), token);
              } else {
                sendTextMessage(sender, 'No response', token);
              }
            });
          }
        }
      }
      // sendTextMessage(sender, "Text received, echo: "+ text.substring(0, 200));
      // Handle a text message from this sender
    }
  }
  res.sendStatus(200);
});

app.listen(app.get('port'), function() {
  console.log('App listening on port', app.get('port'));
});