//Dependencias
const request = require('sync-request');
const cheerio = require('cheerio');
const CMSVtex_general = require('./CMSVtex_general');

/**
 * Website.
 * @module website
 * @since 1.0.0
 * @desc Este módulo es útil para obtener los websites asociados a una cuenta o la información de uno específico*/
module.exports = function( cms_vtex_website ){

	/**
	 * @method get_website_by_name
	 * @desc Obtiene la información referente a un website.
	 * @param {string} website_name Si se requier obtener los sub-templates.
	 * @return {Object} Con la información de un website nombre,id y id del folder root
	*/
	cms_vtex_website.get_website_by_name = ( website_name ) => {
		//console.log('empezó ejecución')
		let websites = cms_vtex_website.get();
		//console.log('llegó a websites is',websites)
		let website_result_index = websites.map( ( website) => {
			return website.name.toLowerCase()
		}).indexOf(website_name.toLowerCase())

		return websites[website_result_index]
	}

	/**
	 * @method get
	 * @desc Obtiene la lista de los websites de una cuenta Vtex específica.
	 * @return {Object[]} Con la información de todos los website nombre,id y id del folder root
	*/
	cms_vtex_website.get = ( ) => {
		let data = {
	        dir: 'sites:/',
	        onlyFolders: false,
	        onlyFiles: false,
	        multiSelect: false
	    },
	    uri_def = CMSVtex_general.url_base + 'admin/a/PortalManagement/FolderContent'
			
		response_sync = request('POST',uri_def,{
			headers : {
				'Cookie' : CMSVtex_general.cookie_vtex,
				'Content-Type' : 'application/json',
			},
			dataType : 'HTML',
			json : data
		})

		let body = response_sync.body.toString(),
			$ = cheerio.load(body),
			return_var = []
		$('.jqueryFileTree a').each(function(){
			if($(this).attr('rel') != 'site:'){
				return_var.push({
					id : $(this).attr('rel').split(':')[1],
					root : $(this).attr('rel').split(':')[2].replace('/',''),
					name : $(this).text()
				}) 
			}
		})

		return return_var
	}

	return cms_vtex_website;
}( exports )