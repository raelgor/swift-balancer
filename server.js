
var https = require('https'),
    httpProxy = require('http-proxy'),
    fs = require('fs'),
    express = require('express');

var urls = [
    'http://10.240.146.236:80',
    'http://10.240.218.237:80',
    'http://10.240.68.14:80'
];

var index = 0;

function randomUrl() {
    ++index > (urls.length-1) && ( index = 0 );
    return urls[index];
}

var proxy = httpProxy.createProxyServer({});

var server = https.createServer({
    key: fs.readFileSync('swiftfinger.key'),
    cert: fs.readFileSync('swiftfinger.crt')
}, function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    var str = ''; for (var key in req) str += ':' + key;
    req.url.split('::hlb::').length > 1 ?
    res.end('[LB]10.240.66.151 '+req.headers.host +'::' + process.pid + '::' + Math.floor(process.memoryUsage().rss / 1024 / 1024) + ' MB')
    :
    proxy.web(req, res, {target:randomUrl()})
}).listen(443, '10.240.66.151');

var http = express();
http.get('*', function (req, res) {
    res.redirect('https://swiftfinger.com' + req.url)
})
http.listen(80, '10.240.66.151');

server.on('upgrade', function (req, socket, head) {
    proxy.ws(req, socket, head, { target: randomUrl() });
});

var hangCount = 0;

console.log('Proxy started. r10. pid:', process.pid);
process.on('uncaughtException', function (err) {
    console.log(err);
    console.log(++hangCount);
})
