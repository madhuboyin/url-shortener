const env = process.env.NODE_ENV || 'development';
const config = require('./config')[env];
const username = config.database.username
const password = config.database.password
const db_host = config.database.host
const db_port = config.database.port
const db_name = config.database.name
const db_url = 'postgres://'+username+':'+password+'@'+db_host+':'+db_port+'/'+db_name

var pgp = require('pg-promise')(/* options */)
var db = pgp(db_url)

exports.main = function(fullUrl) {

    db.oneOrNone("select * from public.short_urls where full_url=$1 limit 1",[fullUrl], r => !!r)
    .then(data => { 
        if(data == false){
            var shortUrl = shortenUrl(fullUrl)
            storeUrl(fullUrl,shortUrl)
        }else{
            console.log("url exist")
        }
    }).catch(error => {
        console.log(error)
    })

}

function shortenUrl() {

    var chars = "abcdfghjkmnpqrstvwxyz|ABCDFGHJKLMNPQRSTVWXYZ|0123456789";
    var codeLength = 7;
    var shortenUrl = ''

    for (i=0;i<codeLength;i++){ 
        shortenUrl += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return shortenUrl

 
}

function storeUrl(fullUrl,shortUrl) {

    var date = new Date()
    var created_at = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +  date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
    date.setMonth(date.getMonth() + 3)
    var expired_at = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +  date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

    db.oneOrNone("select * from public.short_urls where short_url=$1 limit 1",[shortUrl], r => !!r)
    .then(data => { 
        if(data == false){
            db.oneOrNone("insert into public.short_urls(full_url,short_url,hits,created_at,expired_at) values ($1,$2,$3,$4,$5) returning id", [fullUrl, shortUrl, 0, created_at, expired_at])
            .then(data => {
                console.log('success: ',data)
            })
            .catch(error => {
                console.log(error)
            })
        }else{
            console.log("short url exist")
        }
    }).catch(error => {
        console.log(error)
    })

}

exports.dbCleanup = function() {

    var date = new Date()
    var current_ts = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +  date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

    db.any("DELETE FROM public.short_urls WHERE expired_at < NOW()")
        .then(data => { 
            console.log("[DBCLEANUP] is running -- current timestamp: " + current_ts)
        }).catch(error => {
            console.log("[DBCLEANUP] Error cleaning DB -- current timestamp:  "+current_ts)
        })
}

function storeUrlToLocalStorage(url) {

    var urls = localStorage.getItem('urls')
    console.log(urls)

    db.oneOrNone("SELECT full_url,short_url,hits FROM public.short_urls WHERE full_url=$1",[url])
        .then(data => { 
            console.log(data)
        }).catch(error => {
            console.log(error)
        })
}

exports.addHits =function(shortUrl) {
    db.oneOrNone("UPDATE hits SET hits = hits + 1 WHERE shortUrl=$1;",[shortUrl])
}