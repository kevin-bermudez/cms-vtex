//Dependencias
const request = require('sync-request');
const cheerio = require('cheerio');
const querystring = require('querystring');
const CMSVtex_general = require('./CMSVtex_general');

module.exports = function( cms_vtex_layout ){
	cms_vtex_layout.get = ( id_layout ) => {
		let uri_def = CMSVtex_general.url_base + 'admin/a/PortalManagement/LayoutContent?layoutId=' + id_layout,
			response_sync = request('GET',uri_def,{
				headers : {
					'Cookie' : CMSVtex_general.cookie_vtex,
					'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
				}
			})

		let body = response_sync.body.toString()

		$ = cheerio.load(body),
			return_var = {
				id_site : $('#siteId').attr('value'),
				id_template : $('#templateId').attr('value'),
				id_layout : $('#layoutId').attr('value'),
				name : $('form[action="/admin/a/PortalManagement/SaveLayoutSetting"] fieldset legend').text(),
				default : (typeof $('#layoutDefault').attr('checked') != 'undefined'),
				active : (typeof $('#isActive').attr('checked') != 'undefined'),
				use_legacy : (typeof $('#useLegacy').attr('checked') != 'undefined'),
				placeholders : []
			}
		$('.vtex-placeholder-span').each(function(){
			return_var.placeholders.push({
				id : $(this).next().attr('id'),
				name : $(this).text().replace('add object','').trim(),
				controls : []
			})
		})

		$('.vtex-placeholder-container').each(function(){
			if(!$(this).is(':empty')){
				$(this).children().each(function(){
					var index_placeholder = return_var.placeholders.map(function( placeholder ){
						return placeholder.id
					}).indexOf($(this).parent().attr('containerid'))

					var tipo = CMSVtex_general.get_type_control( $(this).attr('id').split('TSC')[0] );

					if(index_placeholder !== -1){
						return_var.placeholders[index_placeholder].controls.push({
							type : tipo,
							instance : $(this).attr('instanceid'),
							name : $(this).attr('name'),
							objects : cms_vtex_layout.get_list_objects( 'html',$(this).attr('instanceid') )
						})	
					}
				})
			}
		})
		/*
			Id Control: primera parte nombre radio tipo control
			+ segunda parte del control:
			HTML -> 28488dba-be4f-4ba3-a0e0-355e6a86d406::Html
			BANNER HTML -> 1a3c6f6c-854a-4223-8ff1-0e16e11144af::BannerDhtml
			COLECCIÓN -> 2a673f22-79a1-4519-93bc-7d30edd9e2c2::Coleção
			BANNER -> 71cf9b9e-81ec-44cc-af38-e6a9161650c7::Banner
			//cria um selo para identificar exclusivamente cada controle
			function MakeTimeStamp() {
			    var currentTime = new Date();
			    return 'TSC' + currentTime.getHours() + currentTime.getMinutes() + currentTime.getSeconds() + currentTime.getMilliseconds();
			}
		*/
		return return_var
	}	

	cms_vtex_layout.get_list_objects = ( instance_type,instance_id ) => {
		switch(instance_type){
			case 'html': 
				uri_def = CMSVtex_general.url_base + '/admin/a/PortalManagement/GetFormHtmlConfig?viewInstanceId=' + instance_id
			break;
			case 'coleccion' : 
				uri_def = CMSVtex_general.url_base + 'admin/a/PortalManagement/GetFormShelfConfig?viewInstanceId=' + instance_id
			break;
		}

		let response_sync = request('POST',uri_def,{
				headers : {
					'Cookie' : CMSVtex_general.cookie_vtex,
					'Content-Type' : 'text/HTML'
				}
			})

		let body = response_sync.body.toString();
		let $ = cheerio.load(body);

		switch(instance_type){
			case 'html': 
				var_return = CMSVtex_general.get_content_object( body,instance_type );
			break;
			case 'coleccion' : 
				var_return = {
					layout : $('#layout option:selected').attr('value').trim(),
					colCount : $('#colCount').attr('value'),
					itemCount : $('#itemCount').attr('value'),
					isRandomize : (typeof $('#isRandomize').attr('checked') != 'undefined'),
					showUnavailable : (typeof $('#showUnavailable').attr('checked') != 'undefined'),
					isPaged : (typeof $('#isPaged').attr('checked') != 'undefined'),
					objects : CMSVtex_general.get_content_object( body,instance_type )
				}	
			break;
		}

		return var_return;
	}

	cms_vtex_layout.get_id_new_layout = ( id_website,id_folder ) => {
		let uri_def = CMSVtex_general.url_base + '/admin/a/PortalManagement/AddLayout?siteId=' + id_website + '&folderParentId=' + id_folder

		let response_sync = request('GET',uri_def,{
			headers : {
				'Cookie' : CMSVtex_general.cookie_vtex,
				'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
			}
		})

		let body = response_sync.body.toString(),
			$ = cheerio.load(body)

		return $('#layoutId').attr('value')
		//return body;
		
	}

	cms_vtex_layout.save = ( name_layout,website_id,folder_id,template,body_class,options ) => {
		let data = {
			hdnAction : 'Update',
			nameLayout : name_layout,
			bodyClass : body_class,
			templates : template,
			isActive : false,
			layoutDefault : false,
			useLegacy : 'false',
			siteId : website_id,
			folderParentId : folder_id,
		}

		if(options){
			if(options.isActive !== undefined){
				data.isActive = options.isActive
			}

			if(options.layoutDefault !== undefined){
				data.layoutDefault = options.layoutDefault
			}

			if(options.useLegacy !== undefined){
				data.useLegacy = options.useLegacy
			}

			if(options.layoutId !== undefined){
				data.layoutId = options.layoutId
				data.actionForm = 'Update'
			}	
			else{
				data.layoutId = cms_vtex_layout.get_id_new_layout( website_id,folder_id )
				data.actionForm = 'Save'
			}		
		}
		else{
			data.layoutId = cms_vtex_layout.get_id_new_layout( website_id,folder_id )
			data.actionForm = 'Save'
		}

		let uri_def = CMSVtex_general.url_base + '/admin/a/PortalManagement/SaveLayout'

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

			//return {
			//	error : true,
			//	layout : name_layout,
			//	error : obj.message
			//}
		}	
		else{
			//return 'success add folder :'  + name_folder;
		}
		return body
	}

	cms_vtex_layout.delete = ( id_website,id_layout ) => {
		let uri_def = CMSVtex_general.url_base + '/admin/a/PortalManagement/LayoutDel'

		let data = {
			siteId : id_website,
			layoutId : id_layout,
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
				layout : id_layout,
				error : obj.message
			}
		}	
		else{
			return 'success delete folder :'  + id_layout;
		}

		//return body
	}

	cms_vtex_layout.save_control = ( layout ) => {
		selected_list = ''
		control_number = 1

		layout.placeholders.map( ( placeholder ) => {
			if(control_number>1){
				selected_list += '-||-'
			}

			selected_list += placeholder.id + '[:][:][:] -||-' 

			placeholder.controls.map( ( control ) => {
				selected_list += '-||-' + placeholder.id + '[:]' + CMSVtex_general.get_type_control( false,control.type ) + '[:]'
			
				if( control.instance ){
					selected_list += control.instance
				}

				selected_list += '[:]' + control.name
			})

			control_number++
		})

		let uri_def = CMSVtex_general.url_base + 'admin/a/PortalManagement/SaveLayoutSetting'

		let data = {
	        coltrolIdSelectedList: selected_list,
	        siteId: layout.id_site,
	        templateId : layout.id_template,
	        layoutId : layout.id_layout
	      };

		response_sync = request('POST',uri_def,{
			headers : {
				'Cookie' : CMSVtex_general.cookie_vtex,
				'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
			},
			body : querystring.stringify(data)
		})

		let body = response_sync.body.toString();
		let $ = cheerio.load(body)
		//console.log(body)
		return ($('title').text() == 'VTEX ID Authentication') ? true : $('title').text();
	}

	cms_vtex_layout.save_config_coleccion = ( id_control,config,update,delete_ ) => {
		if(update){
			console.log('yes update')
			let control_data = cms_vtex_layout.get_list_objects( 'coleccion',id_control );

			let actual_objects = cms_vtex_layout.get_list_objects( 'coleccion',id_control )

			layout = (config.layout) ? config.layout : control_data.layout
			colCount = control_data.colCount
			itemCount = control_data.itemCount
			default_showUnavailable = control_data.showUnavailable
			default_isRandomize = control_data.isRandomize
			default_isPaged = control_data.isPaged

			if(delete_){
				default_contentList = JSON.stringify(cms_vtex_layout.generate_content_list_coleccion( config,id_control ))
			}
			else{
				default_contentList = JSON.stringify(cms_vtex_layout.generate_content_list_coleccion( actual_objects,id_control ))
			}
				
		}
		else{
			layout = config.layout
			colCount = config.colCount
			itemCount = config.itemCount
			default_showUnavailable = false
			default_isRandomize = false
			default_isPaged = false
			default_contentList = ''
		}

		let data = {
			viewPartInstanceId : id_control,
			FormShelfConfigId : '',
			layout,
			colCount,
			itemCount,
			showUnavailable : (config.showUnavailable) ? config.showUnavailable : default_showUnavailable,
			isRandomize : (config.isRandomize) ? config.isRandomize : default_isRandomize,
			isPaged : (config.isPaged) ? config.isPaged : default_isPaged,
			//totalRows : (config.totalRows) ? config.totalRows : 1,
			contentList : (config.contentList) ? config.contentList : default_contentList,
			contentListInicial : (config.contentListInicial) ? config.contentListInicial : default_contentList,
			isCustomViewPart : 'False',

		}

		//console.log('data save is',data)
		
		let uri_def = CMSVtex_general.url_base + 'admin/a/PortalManagement/SaveControlConfig';

		let response_sync = request('POST',uri_def,{
			headers : {
				'Cookie' : CMSVtex_general.cookie_vtex,
				'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
			},
			body : querystring.stringify(data)
		})

		let body = response_sync.body.toString();

		if(body != ''){
			$ = cheerio.load( body );
			return $('title').text()
		}
		else{
			return true;
		}
	}

	cms_vtex_layout.add_control = ( layout_id,placeholder_id,name_control,type_control,content_layout_us,config_shelf ) => {
		if(content_layout_us){
			layout = content_layout_us
		}
		else{
			layout = cms_vtex_layout.get( layout_id )
		}

		let placeholder_add_index = layout.placeholders.map( ( placeholder) => {
			return placeholder.id
		}).indexOf( placeholder_id )

		if(placeholder_add_index !== -1){
			layout.placeholders[placeholder_add_index].controls.push({
				type : type_control,
				name : name_control,
				objects : []
			})
			
			let save_layout = cms_vtex_layout.save_control( layout )

			if(type_control == 'coleccion'){
				let new_layout_data = cms_vtex_layout.get( layout_id );
				let index_new_control = new_layout_data.placeholders[placeholder_add_index].controls.map( ( control ) => {
					return control.name;
				}).indexOf( name_control );

				return cms_vtex_layout.save_config_coleccion( new_layout_data.placeholders[placeholder_add_index].controls[index_new_control].instance,config_shelf );
			}
			else{
				return save_layout;
			}
			
		}
		else{
			return 'Lo siento, este placeholder no existe (al menos no en este layout (?))';
		}
	}

	cms_vtex_layout.update_control_coleccion = ( layout_id,placeholder_id,id_control,config ) => {
		if(config.name){
			result_rename = cms_vtex_layout.rename_control( layout_id,placeholder_id,id_control,config.name );
			delete config.name
		}

		if(JSON.stringify(config) == '{}'){
			if(typeof result_rename != 'undefined') return result_rename;
			else return false;
		}
		else{
			return cms_vtex_layout.save_config_coleccion( id_control,config,true );
		}
		//

	}

	cms_vtex_layout.rename_control = ( layout_id,placeholder_id,id_control,name_control,content_layout_us ) => {
		if(content_layout_us){
			layout = content_layout_us
		}
		else{
			layout = cms_vtex_layout.get( layout_id )
		}

		let placeholder_delete_index = layout.placeholders.map( ( placeholder) => {
			return placeholder.id
		}).indexOf( placeholder_id )

		if(placeholder_delete_index !== -1){
			let index_control_delete = layout.placeholders[placeholder_delete_index].controls.map( (control )  => {
				return control.instance
			}).indexOf( id_control )

			//console.log('placeholder is',layout.placeholders[placeholder_delete_index])

			if( index_control_delete !== -1 ){
				layout.placeholders[placeholder_delete_index].controls[index_control_delete].name = name_control

				let rename_control = cms_vtex_layout.save_control( layout );
				return rename_control;
			}	
			else{
				return 'Lo siente este control no existe, al menos no en este placeholder :('
			}
		}
		else{
			return 'Lo siento, este placeholder no existe (al menos no en este layout (?))';
		}
	}

	cms_vtex_layout.delete_control = ( layout_id,placeholder_id,id_control,content_layout_us ) => {
		if(content_layout_us){
			layout = content_layout_us
		}
		else{
			layout = cms_vtex_layout.get( layout_id )
		}

		let placeholder_delete_index = layout.placeholders.map( ( placeholder) => {
			return placeholder.id
		}).indexOf( placeholder_id )

		if(placeholder_delete_index !== -1){
			let index_control_delete = layout.placeholders[placeholder_delete_index].controls.map( (control )  => {
				return control.instance
			}).indexOf( id_control )

			//console.log('placeholder is',layout.placeholders[placeholder_delete_index])

			if( index_control_delete !== -1 ){
				layout.placeholders[placeholder_delete_index].controls.splice(index_control_delete,1)

				let delete_control = cms_vtex_layout.save_control( layout );
				return delete_control;
			}	
			else{
				return 'Lo siento este control no existe, al menos no en este placeholder :('
			}
		}
		else{
			return 'Lo siento, este placeholder no existe (al menos no en este layout (?))';
		}
	}

	cms_vtex_layout.save_object = ( instance_id,instance_type,info_new,id_object ) => {
		let actual_objects = cms_vtex_layout.get_list_objects( instance_type,instance_id ),
			html_content_list = []

		indice = 0
		/*actual_objects.map( ( actual_object ) => {
			html_content_list.push({
				ViewPartInstanceId : instance_id,
				Indice : indice,
				ContentName : actual_object.name,
				Partner : actual_object.partner,
				Campaign : actual_object.campaign,
				Category : actual_object.category,
				Brand : actual_object.brand,
				Source : actual_object.source,
				Keyword : actual_object.keyword,
				Periods : actual_object.period,
				Active : (actual_object.active) ? 'True' : 'False',
				FileName : '',
				Html : actual_object.additional
			})

			indice++
		})*/

		//let add_actual_objects = html_content_list

		html_content_list.push({
			ViewPartInstanceId : instance_id,
			Indice : indice,
			ContentName : (info_new.ContentName) ? info_new.ContentName : '',
			Partner : (info_new.partner) ? info_new.partner : '',
			Campaign : (info_new.campaign) ? info_new.campaign : '',
			Category : (info_new.category) ? info_new.category : '',
			Brand : (info_new.brand) ? info_new.brand : '',
			Source : (info_new.source) ? info_new.source : '',
			Keyword : (info_new.keyword) ? info_new.keyword : '',
			Periods : (info_new.periods) ? info_new.periods : [],
			Active : (info_new.active) ? 'True' : 'False',
			FileName : '',
			Html : (info_new.html) ? info_new.html : ''
		})

		if(id_object){
			let index_object_actual = actual_objects.map( (actual_object) => {
				return actual_object.id
			}).indexOf( id_object )
			console.log('object actual',actual_objects[index_object_actual])
			initial_content = []

			initial_content.push({
				ViewPartInstanceId : instance_id,
				Indice : index_object_actual,
				ContentName :  actual_objects[index_object_actual].name,
				Partner :  actual_objects[index_object_actual].partner,
				Campaign :  actual_objects[index_object_actual].campaign,
				Category :  actual_objects[index_object_actual].category,
				Brand :  actual_objects[index_object_actual].brand,
				Source :  actual_objects[index_object_actual].source,
				Keyword :  actual_objects[index_object_actual].keyword,
				Periods :  actual_objects[index_object_actual].period,
				Active : ( info_new.active ) ? info_new.active :  actual_objects[index_object_actual].active,
				FileName : '',
				Html :  actual_objects[index_object_actual].additional,
				Id : actual_objects[index_object_actual].id
			})

			html_content_list[0].Indice = index_object_actual
			html_content_list[0].Id = actual_objects[index_object_actual].id
		}

		//return actual_objects;
		let data = {
			viewPartInstanceId : instance_id,
			isCustomViewPart : 'False',
			FormHtmlConfigId : instance_id,
			//htmlContentList : '[{"ViewPartInstanceId":"9224e5c8-a4a0-4dbd-9f14-b01af2803775","Indice":0,"ContentName":"COntenido agregado desde afuera :)","Partner":"","Campaign":"","Category":"54","Brand":"","Source":"","Keyword":"","Periods":[{"From":"21/03/2019 00:00","To":"26/03/2019 23:59"},{"From":"18/03/2019 00:00","To":"27/03/2019 12:59"}],"Active":false,"FileName":"","Html":"Esta es la prueba desde afuera <span>sisas</span>"}]',
			htmlContentList : JSON.stringify(html_content_list),
			htmlContentListInicial : (typeof initial_content != 'undefined') ? JSON.stringify(initial_content) : '[]'
		}

		let uri_def = CMSVtex_general.url_base + '/admin/a/PortalManagement/SaveHtmlConfig';
		let response_sync = request('POST',uri_def,{
			headers : {
				'Cookie' : CMSVtex_general.cookie_vtex,
				'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
			},
			body : querystring.stringify( data )
		})

		let body = response_sync.body.toString()

		return (body == '');
	}

	cms_vtex_layout.generate_content_list_coleccion = ( actual_objects,instance_id,id_object ) => {
		actual_objects_length = actual_objects.objects.length,
		shelf_content_list = []
		console.log('generate list',actual_objects)
		for(let index = 0;index < actual_objects_length;index++){
			shelf_content_list.push({
				ViewPartInstanceId : instance_id,
				Indice : index,
				ContentName : CMSVtex_general.get_html_entities(actual_objects.objects[index].name),
				Partner : actual_objects.objects[index].partner,
				Campaign : actual_objects.objects[index].campaign,
				Category : actual_objects.objects[index].category,
				Brand : actual_objects.objects[index].brand,
				Source : actual_objects.objects[index].source,
				Keyword : actual_objects.objects[index].keyword,
				Periods : actual_objects.objects[index].period,
				Active : (actual_objects.objects[index].active),
				ProductCluster : (actual_objects.objects[index].additional.ProductCluster) ? actual_objects.objects[index].additional.ProductCluster :'',
				SearchQueryString : actual_objects.objects[index].additional.queryString,
				Id : actual_objects.objects[index].id
			})

			//console.log('el add is',actual_objects.objects[index].additional)
			if(id_object){
				if(typeof initial_content === 'undefined') initial_content_list = []
				initial_content_list.push(shelf_content_list[shelf_content_list.length - 1])
			}
		}

		return shelf_content_list;
	}

	cms_vtex_layout.save_object_coleccion = ( instance_id,info_new,id_object ) => {
		let actual_objects = cms_vtex_layout.get_list_objects( 'coleccion',instance_id ),
			shelf_content_list = cms_vtex_layout.generate_content_list_coleccion( actual_objects,instance_id,id_object )
		

		if(!id_object){
			shelf_content_list.push({
				ViewPartInstanceId : instance_id,
				Indice : actual_objects.objects.length,
				ContentName : (info_new.ContentName) ? CMSVtex_general.get_html_entities(info_new.ContentName) : '',
				Partner : (info_new.partner) ? info_new.partner : '',
				Campaign : (info_new.campaign) ? info_new.campaign : '',
				Category : (info_new.category) ? info_new.category : '',
				Brand : (info_new.brand) ? info_new.brand : '',
				Source : (info_new.source) ? info_new.source : '',
				Keyword : (info_new.keyword) ? info_new.keyword : '',
				Periods : (info_new.periods) ? info_new.periods : [],
				Active : (info_new.active) ? 'True' : 'False',
				ProductCluster : (info_new.ProductCluster) ? info_new.ProductCluster : '',
				SearchQueryString : (info_new.SearchQueryString) ? info_new.SearchQueryString : ''
			})

			delete actual_objects.objects;
			//actual_objects.totalRows = actual_objects_length + 1
			actual_objects.contentList = JSON.stringify(shelf_content_list)
			actual_objects.contentListInicial = (typeof initial_content_list != 'undefined') ? JSON.stringify(initial_content_list) : ''

			return cms_vtex_layout.save_config_coleccion( instance_id,actual_objects )
		}
		else{
			//console.log(actual_objects.objects)
			let index_object_actual = actual_objects.objects.map( (actual_object) => {
				return actual_object.id
			}).indexOf( id_object )
			
			if(index_object_actual === -1){
				return 'este objeto no existe, paila :\'(';
			}
			else{
				if(actual_objects.objects[index_object_actual].additional.ProductCluster){
					default_productoCluster = actual_objects.objects[index_object_actual].additional.ProductCluster.id
				}
				else{
					default_productoCluster = ''
				}
				console.log('el index encontrado es',index_object_actual)
				shelf_content_list[index_object_actual] = {
					ViewPartInstanceId : instance_id,
					Indice : index_object_actual,
					ContentName : (info_new.ContentName) ? info_new.ContentName : CMSVtex_general.get_html_entities(actual_objects.objects[index_object_actual].name),
					Partner : (info_new.partner) ? info_new.partner : actual_objects.objects[index_object_actual].partner,
					Campaign : (info_new.campaign) ? info_new.campaign : actual_objects.objects[index_object_actual].campaign,
					Category : (info_new.category) ? info_new.category : actual_objects.objects[index_object_actual].category,
					Brand : (info_new.brand) ? info_new.brand : actual_objects.objects[index_object_actual].brand,
					Source : (info_new.source) ? info_new.source : actual_objects.objects[index_object_actual].source,
					Keyword : (info_new.keyword) ? info_new.keyword : actual_objects.objects[index_object_actual].keyword,
					Periods : (info_new.periods) ? info_new.periods : actual_objects.objects[index_object_actual].period,
					Active : (typeof info_new.active !== 'undefined') ? info_new.active : actual_objects.objects[index_object_actual].active,
					ProductCluster : (info_new.ProductCluster) ? info_new.ProductCluster : default_productoCluster,
					SearchQueryString : (info_new.SearchQueryString) ? info_new.SearchQueryString : actual_objects.objects[index_object_actual].additional.queryString,
					Id : actual_objects.objects[index_object_actual].id
				}

				console.log(shelf_content_list)

				delete actual_objects.objects;
				//actual_objects.totalRows = actual_objects_length + 1
				actual_objects.contentList = JSON.stringify(shelf_content_list)
				actual_objects.contentListInicial = JSON.stringify(initial_content_list)

				return cms_vtex_layout.save_config_coleccion( instance_id,actual_objects )
			}

		}

		//return cms_vtex_layout.get_list_objects( 'coleccion',instance_id );
		
		//return body
	}

	cms_vtex_layout.delete_object = ( instance_id,instance_type,id_object ) => {
		let actual_objects = cms_vtex_layout.get_list_objects( instance_type,instance_id ),
			html_content_list = [],
			initial_content_list = []

		indice = 0,
		indice2 = 0
		actual_objects.map( ( actual_object ) => {
			if(actual_object.id != id_object){
				html_content_list.push({
					ViewPartInstanceId : instance_id,
					Indice : indice,
					ContentName : actual_object.name,
					Partner : actual_object.partner,
					Campaign : actual_object.campaign,
					Category : actual_object.category,
					Brand : actual_object.brand,
					Source : actual_object.source,
					Keyword : actual_object.keyword,
					Periods : actual_object.period,
					Active : (actual_object.active) ? 'True' : 'False',
					FileName : '',
					Html : actual_object.additional,
					Id : actual_object.id
				})
				indice++
			}
			//else{
			initial_content_list.push({
				ViewPartInstanceId : instance_id,
				Indice : indice2,
				ContentName : actual_object.name,
				Partner : actual_object.partner,
				Campaign : actual_object.campaign,
				Category : actual_object.category,
				Brand : actual_object.brand,
				Source : actual_object.source,
				Keyword : actual_object.keyword,
				Periods : actual_object.period,
				Active : (actual_object.active) ? 'True' : 'False',
				FileName : '',
				Html : actual_object.additional,
				Id : actual_object.id
			})
			//}

			indice2++
		})

		//return actual_objects;
		let data = {
			viewPartInstanceId : instance_id,
			isCustomViewPart : 'False',
			FormHtmlConfigId : instance_id,
			//htmlContentList : '[{"ViewPartInstanceId":"9224e5c8-a4a0-4dbd-9f14-b01af2803775","Indice":0,"ContentName":"COntenido agregado desde afuera :)","Partner":"","Campaign":"","Category":"54","Brand":"","Source":"","Keyword":"","Periods":[{"From":"21/03/2019 00:00","To":"26/03/2019 23:59"},{"From":"18/03/2019 00:00","To":"27/03/2019 12:59"}],"Active":false,"FileName":"","Html":"Esta es la prueba desde afuera <span>sisas</span>"}]',
			htmlContentList : JSON.stringify(html_content_list),
			htmlContentListInicial : (typeof initial_content_list != 'undefined') ? JSON.stringify(initial_content_list) : '[]'
		}

		let uri_def = CMSVtex_general.url_base + '/admin/a/PortalManagement/SaveHtmlConfig';
		let response_sync = request('POST',uri_def,{
			headers : {
				'Cookie' : CMSVtex_general.cookie_vtex,
				'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
			},
			body : querystring.stringify( data )
		})

		let body = response_sync.body.toString()

		return (body == '') ? true : body;
	}

	cms_vtex_layout.delete_object_coleccion = ( instance_id,id_object ) => {
		let actual_objects = cms_vtex_layout.get_list_objects( 'coleccion',instance_id );

		let index_object = actual_objects.objects.map( ( actual_object ) => {
			return actual_object.id;
		}).indexOf( id_object );

		if(index_object === -1){
			return 'Este objeto no existe, al menos no en esta instancia (?)';
		}
		else{
			actual_objects.objects.splice( index_object,1 );
			//console.log(actual_objects.objects)
			return cms_vtex_layout.save_config_coleccion( instance_id,actual_objects,true,true )
		}

		//
	}

	return cms_vtex_layout;
}( exports )