const request = require('sync-request');
const cheerio = require('cheerio');
const querystring = require('querystring');
const CMSVtex_general = require('./CMSVtex_general');

/**
 * Authentication.
 * @module authentication
 * @since 1.0.0
 * @desc A través de este módulo se obtiene la cookie de autenticación en el admin de Vtex */
module.exports = (function(){
	cms_vtex_authentication = exports;

	/**
	 * @method get_token_vtexid
	 * @desc Obtiene el token de autenticación e VtexId para usar
	 * @param {String} account Cuenta de Vtex asociada
	 * @return {String} Token para ser usado al obtener la cookie de autenticación
	 */
	cms_vtex_authentication.get_token_vtexid = ( account ) => {
		let uri_def = CMSVtex_general.get_url_myvtex( account ) + '/api/vtexid/pub/authentication/start';

		let response_sync = request('GET',uri_def,{
			headers : {
				'Content-Type' : "application/json"
			}
		})
		
		let response_json = JSON.parse(response_sync.body.toString())
		return (response_json.authenticationToken) ? response_json.authenticationToken : false
	}

	/**
	 * @method send_access_key
	 * @desc Envía el código de acceso a un correo registrado en la cuenta de Vtex
	 * @param {String} email Correo del usuario registrado
	 * @param {String} account Cuenta de Vtex asociada
	 * @return {Boolean|String} false si no puede enviar el acces key, o el token de autenticación si lo envía.
	 */
	cms_vtex_authentication.send_access_key = ( email,account ) => {
		let authentication_token = cms_vtex_authentication.get_token_vtexid( account )

		if(authentication_token){
			let uri_def = CMSVtex_general.get_url_myvtex( account ) + '/api/vtexid/pub/authentication/accesskey/send';

			let data = {
				authenticationToken : authentication_token,
				email : email
			}

			let response_sync = request('POST',uri_def,{
				headers : {
					'Content-Type' : "application/x-www-form-urlencoded; charset=UTF-8",
					'host' : CMSVtex_general.get_host_myvtex( account )
				},
				body : querystring.stringify(data)
			})

			let response_json = response_sync.body.toString()
			//console.log('response send access key',response_sync)
			if(response_json == '{}'){
				return authentication_token;
			}
			else{
				return false;
			}
		}
		else{
			return false;
		}
	}

	cms_vtex_authentication.get_cookie_authentication = ( account,email,access_key,token_vtexid ) => {
		let uri_def = CMSVtex_general.get_url_myvtex( account ) + '/api/vtexid/pub/authentication/accesskey/validate';
		
		let data = {
			authenticationToken : token_vtexid,
			login : email,
			accesskey : access_key
		}

		let response_sync = request('POST',uri_def,{
			headers : {
				'Content-Type' : "application/x-www-form-urlencoded; charset=UTF-8"
			},
			body : querystring.stringify(data)
		})
		let response_json = JSON.parse( response_sync.body.toString() )
		console.log('response json',response_json)
		if(response_json.authStatus == 'Success'){
			return {
				cookie : response_json.authCookie.Value,
				expire : response_json.expiresIn
			}
		}
		else{
			return response_json.authStatus;
		}
		
	}

	return cms_vtex_authentication;
})()