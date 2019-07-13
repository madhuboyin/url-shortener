const env = process.env.NODE_ENV || 'development';
const config = require('./config')[env];
const username = config.database.username
const password = config.database.password
const db_host = config.database.host
const db_port = config.database.port
const db_name = config.database.name
const db_url = 'postgres://'+username+':'+password+'@'+db_host+':'+db_port+'/'+db_name
const localStorage = require('localStorage')

var urls = JSON.parse(localStorage.getItem('urls')) || [];
var pgp = require('pg-promise')(/* options */)
var db = pgp(db_url)

exports.main = async function(fullUrl) {

    await db.oneOrNone("select * from public.short_urls where full_url=$1 limit 1",[fullUrl], r => !!r)
    .then(data => { 
        if(data == false){
            var shortUrl = shortenUrl(fullUrl)
            storeUrl(fullUrl,shortUrl)
        }else{
            db.oneOrNone("select * from public.short_urls where full_url=$1 limit 1",[fullUrl],)
            .then(data => { 
                console.log("existed: " + data)
            })
        }
    }).catch(error => {
        console.log(error)
    })

    db.oneOrNone("select * from public.short_urls where full_url=$1 limit 1",[fullUrl],)
    .then(data => {
        console.log(data.short_url)
        localStorage.setItem('shortUrl',data.short_url);
    }).catch(error => {
        console.log(error)
    })

}

function shortenUrl() {

    var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
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
                storeUrlToLocalStorage(fullUrl)
            })
            .catch(error => {
                console.log(error)
            })
        }else{
            db.oneOrNone("select * from public.short_urls where short_url=$1 limit 1",[shortUrl],)
            .then(data => { 
                console.log('success: ',data)
                storeUrlToLocalStorage(fullUrl)
                return data
            })
        }
    }).catch(error => {
        console.log(error)
    })

}

function storeUrlToLocalStorage(fullUrl) {
    
    db.oneOrNone("select full_url,short_url,hits from public.short_urls where full_url=$1 limit 1",[fullUrl])
    .then(data => { 
        url = {
            fullUrl: data.full_url,
            shortUrl: data.short_url,
            hits: data.hits,
        }
        urls.push(url)
        localStorage.setItem('urls',JSON.stringify(urls))
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

exports.addHits =function(shortUrl) {
    db.oneOrNone("UPDATE hits SET hits = hits + 1 WHERE shortUrl=$1;",[shortUrl])
}