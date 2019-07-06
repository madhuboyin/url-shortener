var env = process.env.NODE_ENV || 'development';
var config = require('./config')[env];
var handler = require('./handler');
var bodyParser = require('body-parser');
var express = require('express');
const router = express.Router();
var server = express();
var CronJob = require('cron').CronJob;

const port = config.server.port

server.use(express.static(__dirname+'/public'))
server.use(bodyParser.json())
server.use(bodyParser.urlencoded({ extended: true })); 

router.get('/', function(req,res) {
    res.render('index.html')
});

server.post('/shorten', function(req,res) {
    handler.main(req.body.fullUrl)
    res.redirect('/')
});

server.listen(port, () => {
    console.log('server is listening on port: '+port)
});

new CronJob('0 0 * * *', function() {
    handler.dbCleanup()
  }, null, true, 'Asia/Jakarta');