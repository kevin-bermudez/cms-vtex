//Dependencias
const request = require('sync-request');
const cheerio = require('cheerio');
const querystring = require('querystring');
const CMSVtex_general = require('./CMSVtex_general');

module.exports = function( cms_vtex_folder ){
	cms_vtex_folder.get = ( website,folder ) => {
		console.log('start get folder',folder)
		let uri_def = CMSVtex_general.url_base + '/admin/a/PortalManagement/FolderContentBody?dir=folder:' + website + ':' + folder + '/',
			id_website = website,
			is_root = root


		let response_sync = request('POST', uri_def, {
			headers : {
				'Cookie' : CMSVtex_general.cookie_vtex,
				'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
			},
		});

		let body = response_sync.body.toString(),
			$ = cheerio.load(body),
			name_split = $('.jqueryFileTree h3').text().split('/'),
			return_var = {
				id_website : website,
				id_folder : folder
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

		if(c_directories > 0){
			return_var.folders = []

			$('.jqueryFileTreeBody li.directory').each(function(){
				let id_folder_tmp = $(this).find('.IconDel').attr('href').split('?folderId=')[1]
				console.log(id_folder_tmp)
				return_var.folders.push(cms_vtex_folder.get( website,id_folder_tmp ))
			})

			
		}
		
		if($('.jqueryFileTreeBody li.file.page-layout,.jqueryFileTreeBody li.file.page-layout-default').length > 0){
			return_var.layouts = []
			$('.jqueryFileTreeBody li.file.page-layout,.jqueryFileTreeBody li.file.page-layout-default').each(function(){
				let layout_tmp = cms_vtex_folder.get_layout( $(this).find('.IconDel').attr('href').split('layoutId=')[1] )

				return_var.layouts.push({
					id : layout_tmp.id_layout,
					name : layout_tmp.nombre,
					placeholders : layout_tmp.placeholders
				})
			})
		}

		console.log('end get folder',folder)
		return return_var;
	}

	cms_vtex_folder.get_id_new_folder = ( website,folder_parent ) => {
		let uri_def = CMSVtex_general.url_base + 'admin/a/PortalManagement/AddFolder?siteId=' + website + '&folderParentId=' + folder_parent

		let response_sync = request('GET',uri_def,{
			headers : {
				'Cookie' : CMSVtex_general.cookie_vtex,
				'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
			}
		})

		let body = response_sync.body.toString(),
			$ = cheerio.load(body)

		return $('#folderId').attr('value')
		//return body;
	}

	cms_vtex_folder.save = ( name_folder,website_id,parent_id,options ) => {
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
				data.folderId = cms_vtex_folder.get_id_new_folder( website_id,parent_id )
				data.isPersisted = 'False'
			}
		}
		else{
			data.folderId = cms_vtex_folder.get_id_new_folder( website_id,parent_id )
			data.isPersisted = 'False'
		}

		let uri_def = CMSVtex_general.url_base + 'admin/a/PortalManagement/FolderCreate'

		let response_sync = request('POST',uri_def,{
			headers : {
				'Cookie' : CMSVtex_general.cookie_vtex,
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
				error : obj.message
			}
		}	
		else{
			return 'success add folder :'  + name_folder;
		}
	}

	cms_vtex_folder.delete = ( id_website,id_folder ) => {
		let uri_def = CMSVtex_general.url_base + '/admin/a/PortalManagement/FolderDel'

		let data = {
			siteId : id_website,
			folderId : id_folder,
			textConfirm : 'sim'
		}

		let response_sync = request('POST',uri_def,{
			headers : {
				'Cookie' : CMSVtex_general.cookie_vtex,
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
}( exports )