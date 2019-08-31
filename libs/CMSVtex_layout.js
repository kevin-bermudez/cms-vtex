//Dependencias
const request = require('sync-request');
const cheerio = require('cheerio');
const querystring = require('querystring');
const CMSVtex_general = require('./CMSVtex_general');

/**
 * Layout.
 * @module layout
 * @since 1.0.0
 * @desc Este módulo es util para manipular layouts del CMS de vtex incluido también los controles y objetos de los mismos */
module.exports = (function(){
	cms_vtex_layout = exports;
	/**
	 * @method get
	 * @desc Obtiene la información relacionada a un layout.
	 * @param {string} id_layout Id del layout que se quiere obtener.
	 * @param {Object} config {account:'ex:chefcompany',cookie:'ex:...'}
	 * @return {Object} Con toda la información del layout incluidos los placeholders, controles y objetos del mismo
	 */
	cms_vtex_layout.get = ( id_layout,config ) => {
		let uri_def = CMSVtex_general.get_url_base( config.account ) + '/admin/a/PortalManagement/LayoutContent?layoutId=' + id_layout,
			response_sync = request('GET',uri_def,{
				headers : {
					'Cookie' : CMSVtex_general.nameGeneralCookie + '=' + config.cookie,
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
				placeholders : [],
				body_class : $('#bodyClass').attr('value')
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
						if(tipo == 'coleccion'){
							info_control = cms_vtex_layout.get_list_objects( tipo,$(this).attr('instanceid'),config )
							objects = info_control.objects
						}
						else{
							objects = cms_vtex_layout.get_list_objects( tipo,$(this).attr('instanceid'),config )
						}
						return_var.placeholders[index_placeholder].controls.push({
							type : tipo,
							instance : $(this).attr('instanceid'),
							name : $(this).attr('name'),
							objects
						})	

						if(tipo == 'coleccion'){
							delete info_control.objects;
							return_var.placeholders[index_placeholder].controls[return_var.placeholders[index_placeholder].controls.length-1].shelf_config = info_control
						}

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

	/**
	 * @method get_list_objects
	 * @desc Obtiene la lista de objetos definidos para una instancia de control determinada.
	 * @param {string} instance_type El tipo de control que se quiere consultar:html o coleccion.
	 * @param {string} instance_id El id del control que se quiere consultar.
	 * @param {Object} config {account:'ex:chefcompany',cookie:'ex:...'}
	 * @return {Object} Retorna un objeto con toda la información del control incluida la lista de objetos asociados, si es una coleccion, los objetos regresarán en un array dentro del objeto, la propiedad se llama "objects"
	 */
	cms_vtex_layout.get_list_objects = ( instance_type,instance_id,config ) => {
		if(instance_type == 'html' || instance_type == 'coleccion'){
			switch(instance_type){
				case 'html': 
					uri_def = CMSVtex_general.get_url_base( config.account ) + '/admin/a/PortalManagement/GetFormHtmlConfig?viewInstanceId=' + instance_id
				break;
				case 'coleccion' : 
					uri_def = CMSVtex_general.get_url_base( config.account ) + '/admin/a/PortalManagement/GetFormShelfConfig?viewInstanceId=' + instance_id
				break;
			}

			let response_sync = request('POST',uri_def,{
					headers : {
						'Cookie' : CMSVtex_general.nameGeneralCookie + '=' + config.cookie,
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
		
	}

	cms_vtex_layout.get_id_new_layout = ( id_website,id_folder,config ) => {
		let uri_def = CMSVtex_general.get_url_base( config.account ) + '/admin/a/PortalManagement/AddLayout?siteId=' + id_website + '&folderParentId=' + id_folder

		let response_sync = request('GET',uri_def,{
			headers : {
				'Cookie' : CMSVtex_general.nameGeneralCookie + '=' + config.cookie,
				'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
			}
		})

		let body = response_sync.body.toString(),
			$ = cheerio.load(body)

		return $('#layoutId').attr('value')
		//return body;
		
	}

	/**
	 * @method save
	 * @desc Guarda la información de un layout en el CMS de Vtex sea porque se está actualizando o creando uno nuevo.
	 * @param {string} name_layout Nombre del layout.
	 * @param {string} website_id Id del website al que pertenece o pertenecerá el layout.
	 * @param {string} folder_id Id del folder al que pertenece o pertenecerá el layout.
	 * @param {string} template Id del template al que está o estará asociado el layout.
	 * @param {string} body_class Esta clase es agregada al tag "body" en el html al momento de imprimir el layout
	 * @param {Object} options Objeto de configuraciones para el layout, cuando se está realizando una actualización se debe pasar la propiedad "layoutId" con el id del layout existente a modificar.
	 * @param {Object} config {account:'ex:chefcompany',cookie:'ex:...'}
	 * @return {Boolean|Object} Retorna un objeto con id del layout si guarda exitosamente de lo contrario devuelve un string con el mensaje que retorna VTEX.
	 */
	cms_vtex_layout.save = ( name_layout,website_id,folder_id,template,body_class,options,config ) => {
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
				data.layoutId = cms_vtex_layout.get_id_new_layout( website_id,folder_id,config )
				data.actionForm = 'Save'
			}		
		}
		else{
			data.layoutId = cms_vtex_layout.get_id_new_layout( website_id,folder_id,config )
			data.actionForm = 'Save'
		}

		let uri_def = CMSVtex_general.get_url_base( config.account ) + '/admin/a/PortalManagement/SaveLayout'

		let response_sync = request('POST',uri_def,{
			headers : {
				'Cookie' : CMSVtex_general.nameGeneralCookie + '=' + config.cookie,
				'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
			},
			body : querystring.stringify( data )
		})

		let body = response_sync.body.toString();
		$ = cheerio.load(body)

		return ($('title').text() == 'VTEX ID Authentication') ? {new:true,id:data.layoutId} : $('h3').text();
	}

	/**
	 * @method delete
	 * @desc Elimina un layout del CMS de Vtex.
	 * @param {string} id_website Id del website al que pertenece el layout.
	 * @param {string} id_layout Id del layout que se quiere eliminar.
	 * @param {Object} config {account:'ex:chefcompany',cookie:'ex:...'}
	 * @return {Boolean|string} Retorna true si elimina exitosamente de lo contrario devuelve un string con el mensaje que retorna VTEX.
	 */
	cms_vtex_layout.delete = ( id_website,id_layout,config ) => {
		let uri_def = CMSVtex_general.get_url_base( config.account ) + '/admin/a/PortalManagement/LayoutDel'

		let data = {
			siteId : id_website,
			layoutId : id_layout,
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
				layout : id_layout,
				error : obj.message
			}
		}	
		else{
			return 'success delete folder :'  + id_layout;
		}

		//return body
	}

	cms_vtex_layout.save_control = ( layout,config ) => {
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

		let uri_def = CMSVtex_general.get_url_base( config.account ) + '/admin/a/PortalManagement/SaveLayoutSetting'

		let data = {
	        coltrolIdSelectedList: selected_list,
	        siteId: layout.id_site,
	        templateId : layout.id_template,
	        layoutId : layout.id_layout
	      };

		response_sync = request('POST',uri_def,{
			headers : {
				'Cookie' : CMSVtex_general.nameGeneralCookie + '=' + config.cookie,
				'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
			},
			body : querystring.stringify(data)
		})

		let body = response_sync.body.toString();
		let $ = cheerio.load(body)
		//console.log(body)
		return ($('title').text() == 'VTEX ID Authentication') ? true : $('title').text();
	}

	cms_vtex_layout.save_config_coleccion = ( id_control,config_coleccion,update,delete_,config ) => {
		if(update){
			console.log('yes update')
			let control_data = cms_vtex_layout.get_list_objects( 'coleccion',id_control,config );

			let actual_objects = cms_vtex_layout.get_list_objects( 'coleccion',id_control,config )

			layout = (config_coleccion.layout) ? config_coleccion.layout : control_data.layout
			colCount = control_data.colCount
			itemCount = control_data.itemCount
			default_showUnavailable = control_data.showUnavailable
			default_isRandomize = control_data.isRandomize
			default_isPaged = control_data.isPaged

			if(delete_){
				default_contentList = JSON.stringify(cms_vtex_layout.generate_content_list_coleccion( config_coleccion,id_control ))
			}
			else{
				default_contentList = JSON.stringify(cms_vtex_layout.generate_content_list_coleccion( actual_objects,id_control ))
			}
				
		}
		else{
			layout = config_coleccion.layout
			colCount = config_coleccion.colCount
			itemCount = config_coleccion.itemCount
			default_showUnavailable = false
			default_isRandomize = false
			default_isPaged = false
			default_contentList = ''
		}

		let data = {
			viewPartInstanceId : id_control,
			FormShelfconfig_coleccionId : '',
			layout,
			colCount,
			itemCount,
			showUnavailable : (config_coleccion.showUnavailable) ? config_coleccion.showUnavailable : default_showUnavailable,
			isRandomize : (config_coleccion.isRandomize) ? config_coleccion.isRandomize : default_isRandomize,
			isPaged : (config_coleccion.isPaged) ? config_coleccion.isPaged : default_isPaged,
			//totalRows : (config_coleccion.totalRows) ? config_coleccion.totalRows : 1,
			contentList : (config_coleccion.contentList) ? config_coleccion.contentList : default_contentList,
			contentListInicial : (config_coleccion.contentListInicial) ? config_coleccion.contentListInicial : default_contentList,
			isCustomViewPart : 'False',

		}

		//console.log('data save is',data)
		
		let uri_def = CMSVtex_general.get_url_base( config.account ) + 'admin/a/PortalManagement/SaveControlconfig_coleccion';

		let response_sync = request('POST',uri_def,{
			headers : {
				'Cookie' : CMSVtex_general.nameGeneralCookie + '=' + config.cookie,
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

	/**
	 * @method add_control
	 * @desc Agrega un control de un tipo definido a un placeholder determinado.
	 * @param {string} layout_id Id del layout al que pertenece el placeholder sobre el que se va a agregar el control.
	 * @param {string} placeholder_id Id del placeholder sobre el que se quiere agregar el control.
	 * @param {string} name_control Nombre del nuevo control.
	 * @param {string} type_control Tipo del nuevo control:html o coleccion.
	 * @param {Object} [content_layout_us] Este objecto se le pasa a la función con la información del layout sobre el que se va a agregar el control si se quiere ahorrar tiempo de la misma buscándola.
	 * @param {Object} config {account:'ex:chefcompany',cookie:'ex:...'}
	 * @return {Boolean|string} Retorna true si guarda exitosamente de lo contrario devuelve un string con el mensaje que retorna VTEX.
	 */
	cms_vtex_layout.add_control = ( layout_id,placeholder_id,name_control,type_control,content_layout_us,config_shelf,config ) => {
		if(content_layout_us){
			layout = content_layout_us
		}
		else{
			layout = cms_vtex_layout.get( layout_id,config )
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
			
			let save_layout = cms_vtex_layout.save_control( layout,config )

			if(type_control == 'coleccion'){
				let new_layout_data = cms_vtex_layout.get( layout_id,config );
				let index_new_control = new_layout_data.placeholders[placeholder_add_index].controls.map( ( control ) => {
					return control.name;
				}).indexOf( name_control );

				return cms_vtex_layout.save_config_coleccion( new_layout_data.placeholders[placeholder_add_index].controls[index_new_control].instance,config_shelf,false,false,confiig );
			}
			else{
				return save_layout;
			}
			
		}
		else{
			return 'Lo siento, este placeholder no existe (al menos no en este layout (?))';
		}
	}

	/**
	 * @method update_control_coleccion
	 * @desc Agrega un control de un tipo definido a un placeholder determinado.
	 * @param {string} layout_id Id del layout al que pertenece el control de colección que se va a modificar.
	 * @param {string} placeholder_id Id del placeholder al que pertenece el control de colección que se va a modificar.
	 * @param {string} id_control Id del control que se va a modificar.
	 * @param {Object} config_control objeto con la información del nuevo control.
	 * @param {Object} config {account:'ex:chefcompany',cookie:'ex:...'}
	 * @return {Boolean|string} Retorna true si guarda exitosamente de lo contrario devuelve un string con el mensaje que retorna VTEX, si el objeto config está vacío retorna false.
	 */
	cms_vtex_layout.update_control_coleccion = ( layout_id,placeholder_id,id_control,config_control,config ) => {
		if(config_control.name){
			result_rename = cms_vtex_layout.rename_control( layout_id,placeholder_id,id_control,config_control.name,config );
			delete config_control.name
		}

		if(JSON.stringify(config_control) == '{}'){
			if(typeof result_rename != 'undefined') return result_rename;
			else return false;
		}
		else{
			return cms_vtex_layout.save_config_coleccion( id_control,config_control,true,false,config_control,config );
		}
		//

	}

	/**
	 * @method rename_control
	 * @desc Renombra un control, este método no es importante para los controles de colección ya que viene implicita con el método update_control_coleccion de este mismo módulo.
	 * @param {string} layout_id Id del layout al que pertenece el control que se desea renombrar.
	 * @param {string} placeholder_id Id del placeholder al que pertenece el control que se desea renombrar.
	 * @param {string} id_control Id del control que se va a renombrar.
	 * @param {string} name_control Nuevo nombre para el control.
	 * @param {Object} [content_layout_us] Este objecto se le pasa a la función con la información del layout sobre el que se va a agregar el control si se quiere ahorrar tiempo de la misma buscándola.
	 * @param {Object} config {account:'ex:chefcompany',cookie:'ex:...'}
	 * @return {Boolean|string} Retorna true si guarda exitosamente de lo contrario devuelve un string con el mensaje que retorna VTEX.
	 */
	cms_vtex_layout.rename_control = ( layout_id,placeholder_id,id_control,name_control,content_layout_us,config ) => {
		if(content_layout_us){
			layout = content_layout_us
		}
		else{
			layout = cms_vtex_layout.get( layout_id,config )
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

				let rename_control = cms_vtex_layout.save_control( layout,config );
				return rename_control;
			}	
			else{
				return 'Lo siento este control no existe, al menos no en este placeholder :('
			}
		}
		else{
			return 'Lo siento, este placeholder no existe (al menos no en este layout (?))';
		}
	}

	/**
	 * @method delete_control
	 * @desc Elimina un control de un layout y placeholder determinado.
	 * @param {string} layout_id Id del layout al que pertenece el control que se va a eliminar.
	 * @param {string} placeholder_id Id del placeholder al que pertenece el control que se desea eliminar.
	 * @param {string} id_control Id del control que se va a eliminar.
	 * @param {Object} [content_layout_us] Este objecto se le pasa a la función con la información del layout sobre el que se va a agregar el control si se quiere ahorrar tiempo de la misma buscándola.
	 * @param {Object} config {account:'ex:chefcompany',cookie:'ex:...'}
	 * @return {Boolean|string} Retorna true si guarda exitosamente de lo contrario devuelve un string con el mensaje que retorna VTEX.
	 */
	cms_vtex_layout.delete_control = ( layout_id,placeholder_id,id_control,content_layout_us,config ) => {
		if(content_layout_us){
			layout = content_layout_us
		}
		else{
			layout = cms_vtex_layout.get( layout_id,config )
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

				let delete_control = cms_vtex_layout.save_control( layout,config );
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

	/**
	 * @method save_object
	 * @desc Guarda un objeto de tipo html cuando se va a crear o modificar.
	 * @param {string} instance_id Id del control sobre el que se va a guardar el objeto.
	 * @param {string} instance_type Siempre será "html"
	 * @param {Object} info_new Información del nueva del objeto.
	 * @param {string} [id_object] Este parámetro se pasa cuando la operación es de modificación, indicando el id del objeto que se va a modificar.
	 * @param {Object} config {account:'ex:chefcompany',cookie:'ex:...'}
	 * @return {Boolean|string} Retorna true si guarda exitosamente de lo contrario devuelve un string con el mensaje que retorna VTEX.
	 */
	cms_vtex_layout.save_object = ( instance_id,instance_type,info_new,id_object,config ) => {
		let actual_objects = cms_vtex_layout.get_list_objects( instance_type,instance_id,config ),
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

		let uri_def = CMSVtex_general.get_url_base( config.account ) + '/admin/a/PortalManagement/SaveHtmlConfig';
		let response_sync = request('POST',uri_def,{
			headers : {
				'Cookie' : CMSVtex_general.nameGeneralCookie + '=' + config.cookie,
				'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
			},
			body : querystring.stringify( data )
		})

		let body = response_sync.body.toString()
		let $ = cheerio.load(body)

		return (body == '') ? true : $('title').text().trim();
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

	/**
	 * @method save_object_coleccion
	 * @desc Guarda un objeto de tipo colección cuando se va a crear o modificar.
	 * @param {string} instance_id Id del control sobre el que se va a guardar el objeto.
	 * @param {Object} info_new Información nueva del objeto.
	 * @param {string} [id_object] Este parámetro se pasa cuando la operación es de modificación, indicando el id del objeto que se va a modificar.
	 * @param {Object} config {account:'ex:chefcompany',cookie:'ex:...'}
	 * @return {Boolean|string} Retorna true si guarda exitosamente de lo contrario devuelve un string con el mensaje que retorna VTEX.
	 */
	cms_vtex_layout.save_object_coleccion = ( instance_id,info_new,id_object,config ) => {
		let actual_objects = cms_vtex_layout.get_list_objects( 'coleccion',instance_id,config ),
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

			return cms_vtex_layout.save_config_coleccion( instance_id,actual_objects,false,false,config )
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

				return cms_vtex_layout.save_config_coleccion( instance_id,actual_objects,false,false,config )
			}

		}

		//return cms_vtex_layout.get_list_objects( 'coleccion',instance_id );
		
		//return body
	}

	/**
	 * @method delete_object
	 * @desc Elimina un objeto de tipo html perteneciente a un control determinado.
	 * @param {string} instance_id Id del control al que pertenece el objeto que se va a eliminar.
	 * @param {string} instance_type Siempre será html.
	 * @param {string} id_object Id del objeto que se va a eliminar.
	 * @param {Object} config {account:'ex:chefcompany',cookie:'ex:...'}
	 * @return {Boolean|string} Retorna true si guarda exitosamente de lo contrario devuelve un string con el mensaje que retorna VTEX.
	 */
	cms_vtex_layout.delete_object = ( instance_id,instance_type,id_object,config ) => {
		let actual_objects = cms_vtex_layout.get_list_objects( instance_type,instance_id,config ),
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

		let uri_def = CMSVtex_general.get_url_base( config.account ) + '/admin/a/PortalManagement/SaveHtmlConfig';
		let response_sync = request('POST',uri_def,{
			headers : {
				'Cookie' : CMSVtex_general.nameGeneralCookie + '=' + config.cookie,
				'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
			},
			body : querystring.stringify( data )
		})

		let body = response_sync.body.toString()

		return (body == '') ? true : body;
	}

	/**
	 * @method delete_object_coleccion
	 * @desc Elimina un objeto de tipo colección perteneciente a un control determinado.
	 * @param {string} instance_id Id del control al que pertenece el objeto que se va a eliminar.
	 * @param {string} id_object Id del objeto que se va a eliminar.
	 * @param {Object} config {account:'ex:chefcompany',cookie:'ex:...'}
	 * @return {Boolean|string} Retorna true si guarda exitosamente de lo contrario devuelve un string con el mensaje que retorna VTEX.
	 */
	cms_vtex_layout.delete_object_coleccion = ( instance_id,id_object,config ) => {
		let actual_objects = cms_vtex_layout.get_list_objects( 'coleccion',instance_id,config );

		let index_object = actual_objects.objects.map( ( actual_object ) => {
			return actual_object.id;
		}).indexOf( id_object );

		if(index_object === -1){
			return 'Este objeto no existe, al menos no en esta instancia (?)';
		}
		else{
			actual_objects.objects.splice( index_object,1 );
			//console.log(actual_objects.objects)
			return cms_vtex_layout.save_config_coleccion( instance_id,actual_objects,true,true,config )
		}

		//
	}

	return cms_vtex_layout;
})()