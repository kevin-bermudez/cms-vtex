//Dependencias
const request = require('sync-request');
const cheerio = require('cheerio');
const querystring = require('querystring');
const CMSVtex_general = require('./CMSVtex_general');

/**
 * Folder.
 * @module folder
 * @since 1.0.0
 * @desc Este módulo es util para manipular las carpetas que se encuentran dentro de Sites_and_Channels en el CMS de vtex
 */
module.exports = (function(){
	cms_vtex_folder = exports;
	const CMSVtex_layout = require('./CMSVtex_layout');
	/**
	 * @method get
	 * @desc Obtiene la lista completa de folders con sus layouts correspondientes hijos de un folder determinado
	 * @param {string} website Id del website al que pertenece el folder padre.
	 * @param {string} folder Id del folder del que se quiere obtener la información.
	 * @param {Boolean} [only_folder] Verdadero si quiero obtener layouts falso de lo contrario.
	 * @param {Boolean|String} [not_recursive] Verdadero si no quiero que sea recursiva falso de lo contrario y force si es el root y no quiero que sea recursiva.
	 * @param {Object} config {account:'ex:chefcompany',cookie:'ex:...'}
	 * @return {Object[]} Array con los folders y layouts de un folder padre
	 */
	cms_vtex_folder.get = ( website,folder,only_folder,not_recursive,config ) => {
		console.log('start get folder',folder)
		let uri_edit = CMSVtex_general.get_url_base( config.account ) + '/admin/a/PortalManagement/FolderEdit?siteId='+ website +'&folderId=' + folder

		let response_edit = request('GET', uri_edit, {
			headers : {
				'Cookie' : CMSVtex_general.nameGeneralCookie + '=' + config.cookie,
				'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
			},
		});

		let body_edit = response_edit.body.toString(),
			cheerio2 = cheerio.load(body_edit)

		let uri_def = CMSVtex_general.get_url_base( config.account ) + '/admin/a/PortalManagement/FolderContentBody?dir=folder:' + website + ':' + folder + '/',
			id_website = website,
			is_root = root


		let response_sync = request('POST', uri_def, {
			headers : {
				'Cookie' : CMSVtex_general.nameGeneralCookie + '=' + config.cookie,
				'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
			},
		});

		let body = response_sync.body.toString(),
			$ = cheerio.load(body),
			name_split = $('.jqueryFileTree h3').text().split('/'),
			return_var = {
				id_website : website,
				id_folder : folder,
				defaultMarketingContext : cheerio2('#defaultMarketingContext').attr('value'),
				defaultSearchContext : cheerio2('#defaultSearchContext').attr('value'),
				protocols : cheerio2('#protocols option:selected').text().trim(),
				cacheTypes : cheerio2('#cacheTypes option:selected').text().trim(),
				requiresAuthentication : (typeof cheerio2('#requiresAuthentication').attr('checked') != 'undefined')
			},

			c_directories = $('.jqueryFileTreeBody li.directory').length

		if(name_split[name_split.length - 1] == ''){
			return_var.root = true
			return_var.name = name_split[0]
		}
		else{
			return_var.root = false
			return_var.name = name_split[name_split.length - 1]
		}

		if(!only_folder && $('.jqueryFileTreeBody li.file.page-layout,.jqueryFileTreeBody li.file.page-layout-default').length > 0){
			return_var.layouts = []
			$('.jqueryFileTreeBody li.file.page-layout,.jqueryFileTreeBody li.file.page-layout-default').each(function(){
				let layout_tmp = CMSVtex_layout.get( $(this).find('.IconDel').attr('href').split('layoutId=')[1],config );
				console.log(layout_tmp)
				return_var.layouts.push(layout_tmp);
			})
		}

		if(!not_recursive && $('.jqueryFileTreeBody li.directory').length > 0){
			return_var.folders = []
			$('.jqueryFileTreeBody li.directory').each(function(website_int){
				let id_folder_tmp = $(this).find('.IconDel').attr('href').split('?folderId=')[1]
				let new_folder_tmp = cms_vtex_folder.get(website,id_folder_tmp,only_folder,not_recursive,config)
				return_var.folders.push( new_folder_tmp )
			})
		}


		/*if(only_folder){
			if((!not_recursive && c_directories > 0) || (return_var.root && (typeof not_recursive != 'undefined' && not_recursive != 'force'))){
				return_var.folders = []
				$('.jqueryFileTreeBody li.directory').each(function(){
					let id_folder_tmp = $(this).find('.IconDel').attr('href').split('?folderId=')[1]
					//console.log(id_folder_tmp)
					return_var.folders.push({
						id_website : website,
						id_folder : id_folder_tmp,
						name : $(this).find('div').text().trim(),
						root : false
					})
				})
			}
		}
		else{
			if((!not_recursive && c_directories > 0) || (return_var.root && (typeof not_recursive != 'undefined' && not_recursive != 'force'))){
				return_var.folders = []

				$('.jqueryFileTreeBody li.directory').each(function(){
					let id_folder_tmp = $(this).find('.IconDel').attr('href').split('?folderId=')[1]
					//console.log(id_folder_tmp)
					return_var.folders.push(cms_vtex_folder.get( website,id_folder_tmp,only_folder,not_recursive ))
				})
			}
		}
		
		
		*/

		console.log('end get folder',folder);
		return return_var;
	}

	cms_vtex_folder.get_id_new_folder = ( website,folder_parent,config ) => {
		let uri_def = CMSVtex_general.get_url_base( config.account ) + '/admin/a/PortalManagement/AddFolder?siteId=' + website + '&folderParentId=' + folder_parent

		let response_sync = request('GET',uri_def,{
			headers : {
				'Cookie' : CMSVtex_general.nameGeneralCookie + '=' + config.cookie,
				'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
			}
		})

		let body = response_sync.body.toString(),
			$ = cheerio.load(body)

		return $('#folderId').attr('value')
		//return body;
	}

	/**
	 * @method save
	 * @desc Guarda un folder en el CMS de Vtex
	 * @param {string} name_folder Nombre del folder nuevo.
	 * @param {string} website_id Id del website al que pertenecerá el folder.
	 * @param {string} parent_id Id del folder padre del nuevo folder.
	 * @param {Object} [options] Objeto con propiedades opcionales para configurar el nuevo folder
	 * @param {Object} config {account:'ex:chefcompany',cookie:'ex:...'}
	 * @return {string} Con el mensaje de error generado por Vtex o con un mensaje de éxito que incluye el nombre del nuevo folder.
	 */
	cms_vtex_folder.save = ( name_folder,website_id,parent_id,options,config ) => {
		/*
			protocols
				1 -> HTTP
				2 -> HTTPS
				3 -> HTTP e HTTPS
			cacheTypes
				0 -> No cache
				1 -> Local
				2 -> Remote
				3 -> Local and Remote
			if(requiresAuthentication)
				protocols = 2
				cacheTypes = 0
		*/

		let data = {
			folderName: name_folder, //50 ni primer ni último caracter pueden ser @ mínimo 2 caracteres
			defaultMarketingContext: '', //100
			defaultSearchContext: '', //100
			protocols: "2",
			cacheTypes : "2",
			requiresAuthentication : '',
			siteGuid : website_id,
			parentGuid : parent_id
		};

		if( options ){
			if( options.defaultMarketingContext ){
				data.defaultMarketingContext = options.defaultMarketingContext
			}

			if( options.defaultSearchContext ){
				data.defaultSearchContext = options.defaultSearchContext
			}

			if( options.protocols ){
				data.protocols = options.protocols
			}

			if( options.cacheTypes ){
				data.cacheTypes = options.cacheTypes
			}

			if( options.requiresAuthentication ){
				data.requiresAuthentication = options.requiresAuthentication
			}

			if( options.isPersisted ){
				data.isPersisted = options.isPersisted
			}

			if(options.folderId){
				data.folderId = options.folderId
				data.isPersisted = 'True'
			}
			else{
				data.folderId = cms_vtex_folder.get_id_new_folder( website_id,parent_id,config )
				data.isPersisted = 'False'
			}
		}
		else{
			data.folderId = cms_vtex_folder.get_id_new_folder( website_id,parent_id,config )
			data.isPersisted = 'False'
		}

		let uri_def = CMSVtex_general.get_url_base( config.account ) + '/admin/a/PortalManagement/FolderCreate'

		let response_sync = request('POST',uri_def,{
			headers : {
				'Cookie' : CMSVtex_general.nameGeneralCookie + '=' + config.cookie,
				'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
			},
			body : querystring.stringify( data )
		})

		let body = response_sync.body.toString();

		if(body.indexOf('<applicationexceptionobject>{') !== -1){
			const x = body.indexOf('<applicationexceptionobject>') + 28
			const y = body.indexOf('</applicationexceptionobject>')
			const obj = JSON.parse(body.substr(x, y - x))

			return {
				error : true,
				folder : name_folder,
				error : obj.message,
				id : data.folderId
			}
		}	
		else{
			return 'success add folder :'  + name_folder;
		}
	}

	/**
	 * @method delete
	 * @desc Elimina un folder en el CMS de Vtex
	 * @param {string} id_website Id del website al que pertenece el folder.
	 * @param {string} id_folder Id del folder que se va a eliminar.
	 * @param {Object} config {account:'ex:chefcompany',cookie:'ex:...'}
	 * @return {string} Con el mensaje de error generado por Vtex o con un mensaje de éxito que incluye el id del folder eliminado.
	 */
	cms_vtex_folder.delete = ( id_website,id_folder,config ) => {
		let uri_def = CMSVtex_general.get_url_base( config.account ) + '/admin/a/PortalManagement/FolderDel'

		let data = {
			siteId : id_website,
			folderId : id_folder,
			textConfirm : 'sim'
		}

		let response_sync = request('POST',uri_def,{
			headers : {
				'Cookie' : CMSVtex_general.nameGeneralCookie + '=' + config.cookie,
				'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
			},
			body : querystring.stringify( data )
		})
		//admin/a/PortalManagement/GetFormConfirmFolderDel?folderId=d2f518b11236421bb781e6c024fb1cc0

		let body = response_sync.body.toString()

		if(body.indexOf('<applicationexceptionobject>{') !== -1){
			const x = body.indexOf('<applicationexceptionobject>') + 28
			const y = body.indexOf('</applicationexceptionobject>')
			const obj = JSON.parse(body.substr(x, y - x))

			return {
				error : true,
				folder : name_folder,
				error : obj.message
			}
		}	
		else{
			return 'success delete folder :'  + id_folder;
		}

		//return body
	}

	return cms_vtex_folder;
})()