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

	cms_vtex_authentication.get_token_vtexid = ( account ) => {
		let uri_def = CMSVtex_general.get_url_myvtex( account ) + '/api/vtexid/pub/authentication/start';

		let response_sync = request('GET',uri_def,{
			headers : {
				'Content-Type' : "application/json"
			}
		})
		console.log(response_sync)
		let response_json = JSON.parse(response_sync.body.toString())
		return (response_json.authenticationToken) ? response_json.authenticationToken : false
	}

	/**
	 * @method send_access_key
	 * @desc Envía el código de acceso a un correo registrado en la cuenta de Vtex
	 * @param {int} [quantity_elements_us] Cuantos custom elements se quieren recibir como respuesta.
	 * @param {Boolean} [width_content] Si se quieren obtener los objectos de cada custom element.
	 * @param {Object} config {account:'ex:chefcompany',cookie:'ex:...'}
	 * @return {Object[]} Con toda la información de los custom elements incluidos los objetos de los mismos si así se requiere.
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

	return cms_vtex_authentication;
})()