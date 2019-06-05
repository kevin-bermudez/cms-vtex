const express = require('express');
const request = require('sync-request');
const cheerio = require('cheerio');
const router = express.Router();
const fs = require('fs')
const app = express();
const path = require('path');
const ejs = require('ejs');

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
	cookie_prev = {
		cookie_vtex : cookie,
		auto : dest_auto,
		account
	};

	let dest_conf_def = (dest_auto != 'auto') ? dest_config : path.join( __dirname,'/../config.json' )

	if(fs.existsSync( dest_conf_def )){
		cookie_def = JSON.parse( fs.readFileSync( dest_conf_def,'utf8' ) )
		console.log('cookie def antes',cookie_def)
		index_account = cookie_def.map( ( data ) => {
			return data.account
		}).indexOf( account )

		if(index_account == -1){
			index_account = cookie_def.length
		}

		console.log(index_account,'index account is')

		cookie_def[index_account] = cookie_prev;
		
	}
	else{
		cookie_def = [cookie_prev]
	}

	if(dest_auto != 'auto'){
		fs.writeFileSync( path.join( __dirname,'/../config.json' ),JSON.stringify({auto:dest_auto},null,1) );
	}

	fs.writeFileSync( dest_conf_def,JSON.stringify(cookie_def,null,1) );
}

const open = require('open');

/**
 * @method
 * @desc Abre una ventana para realizar el login en Vtex con una cuenta que tenga acceso al admin de una cuenta específica
 */
module.exports = function( account,dest,redirect ){
	dest_auto = (dest) ? dest : 'auto'

	/*if(!fs.existsSync( dest )){
		fs.writeFileSync( dest )
	}*/

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
		let html = ''
		ejs.renderFile(path.join( path.join(__dirname,'../templates/login-vtex.ejs') ), {
			account_name : account
		}, {
			async : false
		}, function(err, str){
		    html = str
		});

		//return str_template;
		//let html = fs.readFileSync(path.join(__dirname,'../templates/login-vtex.html'),'utf8')
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

	//console.log(url_base + '/get-cookie')
	open(url_base + '/get-cookie')
}

/**
 * @method is_logged
 * @desc Comprueba si la cookie almacenada para una cuenta determinada es valida o no
 * @return Boolean Retorna true si es valida y false si no
*/
module.exports.is_logged = function( account,config_file_path ){
	if(!fs.existsSync( config_file_path ))
		return false;

	let config_arr = JSON.parse( fs.readFileSync( config_file_path ) )

	index_in_config = config_arr.map( account => {
		return account.account;
	} ).indexOf( account );

	if(index_in_config === -1){
		return false;
	}
	else{
		let uri_def = 'https://' + account + '.vtexcommercestable.com.br/admin/Site/Help.aspx'
		let response_sync = request('GET',uri_def,{
			headers : {
				'Cookie' : 'VtexIdclientAutCookie=' + config_arr[index_in_config].cookie_vtex,
				'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
			}
		})
		let $ = cheerio.load( response_sync.body.toString() )
		
		return ($('title').text().trim() != 'VTEX ID Authentication')
	}
}


