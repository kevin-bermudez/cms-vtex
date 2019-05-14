const express = require('express');
const router = express.Router();
const fs = require('fs')
const app = express();
const path = require('path')

/**
 * Login.
 * @module login
 * @since 1.0.0
 * @desc Este módulo sirve para obtener la información que va a autenticar todas las peticiones a Vtex.
*/
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

const save_cookie = ( cookie,dest_config,account ) => {
	let cookie_def = {
		cookie_vtex : cookie,
		auto : dest_auto,
		account
	};
	fs.writeFileSync( dest_config,JSON.stringify(cookie_def,null,1) );
}

const open = require('open');

/**
 * @method
 * @desc Abre una ventana para realizar el login en Vtex con una cuenta que tenga acceso al admin de una cuenta específica
 * @param {string} account Cuenta con la que se identifica el cliente en Vtex.
 * @param {string} [dest] Ruta del destino donde quedará almacenada la info de configuración del plugin sobre todo información de autenticación.
*/
module.exports = function( account,dest,redirect ){
	dest_auto = (dest) ? dest : 'auto'

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
		let html = fs.readFileSync(path.join(__dirname,'../templates/login-vtex.html'),'utf8')
		res.end(html)
	})

	router.get('/cookie-auth',(req,res) => {
		let cookie_auth = get_cookie('VtexIdclientAutCookie',req.headers.cookie)
		//console.log("Cookie de autenticación es :  ", cookie_auth);
		//console.log('dest is',dest_auto)
		save_cookie(cookie_auth,dest_auto,account)
		let html = fs.readFileSync(path.join(__dirname,'../templates/cerrar-ventana.html'),'utf8')
		res.end(html)
		res.end('obteniendo cookie')

		if(redirect){
			res.redirect( redirect )
		}
		else{
			process.exit(0)
		}
	})

	const url_base = 'http://localhost:' + app.get('port')

	console.log(url_base + '/get-cookie')
	open(url_base + '/get-cookie')
}


