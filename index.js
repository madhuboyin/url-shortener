const env = process.env.NODE_ENV || 'development';
const config = require('./config')[env];
const handler = require('./handler');
const bodyParser = require('body-parser');
const express = require('express');
const mustacheExpress = require('mustache-express');
const server = express();
const CronJob = require('cron').CronJob;
const localStorage = require('localStorage');

const port = config.server.port;

server.engine('html', mustacheExpress());
server.set('view engine', 'html');
server.set('views', __dirname + '/views');
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));
server.use(express.static(__dirname + '/public'));

server.post('/shorten', function(req,res) {
    localStorage.setItem('fullUrl',req.body.fullUrl);
    handler.main(req.body.fullUrl)
    setTimeout(function () {
        res.redirect('/');
      }, 1000);
});

server.get('/', function(req,res) {
    let urls = {
        "fullUrl": localStorage.getItem('fullUrl'),
        "shortUrl": localStorage.getItem('shortUrl'),
        "urls": JSON.parse(localStorage.getItem('urls'))
    }
    res.render('index',urls);
});

server.listen(port, () => {
    console.log('server is listening on port: '+port);
});

new CronJob('0 0 * * *', function() {
    handler.dbCleanup()
  }, null, true, 'Asia/Jakarta');