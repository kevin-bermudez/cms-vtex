const express = require('express');
const router = express.Router();
const fs = require('fs')
const app = express();

const get_cookie = ( name_cookie,cookies ) => {
	let cookies_joined = cookies.split(';');
	let cookies_joined_length = cookies_joined.length;
	let real_cookies = {}

	for(let index = 0;index < cookies_joined_length;index++){
		split_cookie = cookies_joined[index].split('=');
		
		if(split_cookie[0]){
			eval('real_cookies.' + split_cookie[0] + ' = "' + split_cookie[1] + '"');
		}
		
	}

	return real_cookies[name_cookie];
}

const save_cookie = ( cookie ) => {
	let cookie_def = {cookie_vtex : cookie};
	fs.writeFileSync('config.json',JSON.stringify(cookie_def,null,1));
}

//settings
app.set('port', process.env.PORT || 2000);

//middlewares
app.use((req, res, next) => {
	console.log(`${req.url}`,`${req.method}`);
	next();
})

//routes
app.use(router)

//start server
app.listen(app.get('port'), () =>{
	console.log('server on port ', app.get('port'))	
})

router.get('/get-cookie',(req,res) => {
	let html = fs.readFileSync('./templates/login-vtex.html','utf8')
	res.end(html)
})

router.get('/cookie-auth',(req,res) => {
	let cookie_auth = get_cookie('VtexIdclientAutCookie',req.headers.cookie)
	console.log("Cookie de autenticación es :  ", cookie_auth);
	save_cookie(cookie_auth)
	let html = fs.readFileSync('./templates/cerrar-ventana.html','utf8')
	res.end(html)
	res.end('obteniendo cookie')
	process.exit(0)
})

const open = require('open');
const url_base = 'http://localhost:' + app.get('port')
open(url_base + '/get-cookie')

