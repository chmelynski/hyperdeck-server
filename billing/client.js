
const fs = require('fs');
const http = require('http');
const crypto = require('crypto');

//const md5 = crypto.createHash('md5');
//md5.update('some data to hash');
//const digest = md5.digest('hex'); // => 32 hex digits (for md5)
//console.log(digest);

// https://nodejs.org/api/http.html#http_http_request_options_callback
// http.request(options[, callback])

var options = {};
options.protocol = 'http:'; // http: or https:
options.host = 'www.hyperdeck.io'; // localhost , www.foo.com
options.method = 'GET'; // GET , POST
options.path = '/'; // include query string if any
//options.auth = 'user:password'; // 'user:password'

function Callback(response) {
	
	console.log(`STATUS: ${response.statusCode}`);
	console.log(`HEADERS: ${JSON.stringify(response.headers)}`);
	response.setEncoding('utf8');
	response.on('data', (chunk) => { console.log(`BODY: ${chunk}`); });
	response.on('end', () => { console.log('No more data in response.'); });
}

//var req = http.request(options, Callback);
//req.end();

var host = 'dev.hyperdeck.io';
function Create(referrer, subscriptionId, subscriptionUrl) {
	
	var salt = ''; for (var i = 0; i < 32; i++) { salt += (Math.trunc(Math.random() * 16)).toString(16); }
	var privateKey = 'a6529f98cf8baeb6ebc0af83b910c0d7';
	var hash = crypto.createHash('md5').update(salt + privateKey).digest('hex');
	// in python, the test is HTTP_X_SECURITY_HASH == hashlib.md5(HTTP_X_SECURITY_DATA + private_key).hexdigest()
	
	// referrer="#{order.referrer}"
	// order_id="#{order.reference}"
	// id="#{orderItem.subscription.reference}"
	// fs_url="#{orderItem.subscription.url.detail}"
	// end_date="#{orderItem.subscription.endDate}"
	// next_period="#{orderItem.subscription.nextPeriodDate}"
	var json = {};
	json['referrer'] = referrer;
	json['id'] = subscriptionId;
	json['fs_url'] = subscriptionUrl;
	
	var postData = JSON.stringify(json);
	
	var options = {};
	options.protocol = 'http:';
	options.host = host;
	options.method = 'POST';
	options.path = '/notify/sub_create';
	options.headers = {};
	options.headers['HTTP_USER_AGENT'] = 'FS'; // python accesses this as request.META['HTTP_USER_AGENT'] - what is META?
	options.headers['HTTP_X_SECURITY_DATA'] = salt;
	options.headers['HTTP_X_SECURITY_HASH'] = hash;
	options.headers['Content-Type'] = 'application/json';
	options.headers['Content-Length'] = Buffer.byteLength(postData);
	
	var req = http.request(options, Callback);
	req.write(postData);
	req.end();
}
function Activate() {
	
	var salt = ''; for (var i = 0; i < 32; i++) { salt += (Math.trunc(Math.random() * 16)).toString(16); }
	var privateKey = 'f0a75700bbcdf7e6d59284bec01b38f9';
	var hash = crypto.createHash('md5').update(salt + privateKey).digest('hex');
	
	var json = {};
	
	var postData = JSON.stringify(json);
	
	var options = {};
	options.protocol = 'http:';
	options.host = host;
	options.method = 'POST';
	options.path = '/notify/sub_activate';
	
	var req = http.request(options, Callback);
	req.write(postData);
	req.end();
}
function Change(subscriptionId, newPlanName) {
	
	var salt = ''; for (var i = 0; i < 32; i++) { salt += (Math.trunc(Math.random() * 16)).toString(16); }
	var privateKey = 'ff0900d231708326e5788a9fb87ba211';
	var hash = crypto.createHash('md5').update(salt + privateKey).digest('hex');
	
	//id="#{subscription.reference}"
	//referrer="#{subscription.referrer}"
	//plan="#{subscription.productName}"
	//end_date="#{subscription.endDate}"
	//next_period="#{subscription.nextPeriodDate}"
	var json = {};
	json['id'] = subscriptionId;
	json['plan'] = newPlanName;
	
	var postData = JSON.stringify(json);
	
	var options = {};
	options.protocol = 'http:';
	options.host = host;
	options.method = 'POST';
	options.path = '/notify/sub_change';
	options.headers = {};
	options.headers['HTTP_USER_AGENT'] = 'FS';
	options.headers['HTTP_X_SECURITY_DATA'] = salt;
	options.headers['HTTP_X_SECURITY_HASH'] = hash;
	options.headers['Content-Type'] = 'application/json';
	options.headers['Content-Length'] = Buffer.byteLength(postData);
	
	var req = http.request(options, Callback);
	req.write(postData);
	req.end();
}
function Deactivate(subscriptionId) {
	
	var salt = ''; for (var i = 0; i < 32; i++) { salt += (Math.trunc(Math.random() * 16)).toString(16); }
	var privateKey = '693bfb0a4dab24da21334cd6dbac6bb2';
	var hash = crypto.createHash('md5').update(salt + privateKey).digest('hex');
	
	//id="#{subscription.reference}"
	//referrer="#{subscription.referrer}"
	//end_date="#{subscription.endDate}"
	//next_period="#{subscription.nextPeriodDate}"
	var json = {};
	json['id'] = subscriptionId;
	
	var postData = JSON.stringify(json);
	
	var options = {};
	options.protocol = 'http:';
	options.host = host;
	options.method = 'POST';
	options.path = '/notify/sub_deactivate';
	options.headers = {};
	options.headers['HTTP_USER_AGENT'] = 'FS';
	options.headers['HTTP_X_SECURITY_DATA'] = salt;
	options.headers['HTTP_X_SECURITY_HASH'] = hash;
	options.headers['Content-Type'] = 'application/json';
	options.headers['Content-Length'] = Buffer.byteLength(postData);
	
	var req = http.request(options, Callback);
	req.write(postData);
	req.end();
}
function PayFail(subscriptionId) {
	
	var salt = ''; for (var i = 0; i < 32; i++) { salt += (Math.trunc(Math.random() * 16)).toString(16); }
	var privateKey = '228287fcc1faa140bf4b820e700b3ec2';
	var hash = crypto.createHash('md5').update(salt + privateKey).digest('hex');
	
	//id="#{subscription.reference}"
	//referrer="#{subscription.referrer}"
	//end_date="#{subscription.endDate}"
	//next_period="#{subscription.nextPeriodDate}"
	var json = {};
	json['id'] = subscriptionId;
	
	var postData = JSON.stringify(json);
	
	var options = {};
	options.protocol = 'http:';
	options.host = host;
	options.method = 'POST';
	options.path = '/notify/sub_payfail';
	options.headers = {};
	options.headers['HTTP_USER_AGENT'] = 'FS';
	options.headers['HTTP_X_SECURITY_DATA'] = salt;
	options.headers['HTTP_X_SECURITY_HASH'] = hash;
	options.headers['Content-Type'] = 'application/json';
	options.headers['Content-Length'] = Buffer.byteLength(postData);
	
	var req = http.request(options, Callback);
	req.write(postData);
	req.end();
}

//Create('45b907b87725c05e22e4a8557ca6259c', 'subscriptionId', 'subscriptionUrl');
//Change('subscriptionId', 'Medium');
//PayFail('subscriptionId');
//Deactivate('subscriptionId');

