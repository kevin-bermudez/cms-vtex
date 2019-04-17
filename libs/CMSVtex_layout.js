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

					var tipo = cms_vtex_layout.get_type_control( $(this).attr('id').split('TSC')[0] );

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

	cms_vtex_layout.get_type_control = ( id_type,name_type ) => {
		types_pred = [
			{
				id : '28488dba-be4f-4ba3-a0e0-355e6a86d406',
				name : 'html'
			},
			{
				id : '1a3c6f6c-854a-4223-8ff1-0e16e11144af',
				name : 'banner-html'
			},
			{
				id : '2a673f22-79a1-4519-93bc-7d30edd9e2c2',
				name : 'coleccion'
			},
			{
				id : '71cf9b9e-81ec-44cc-af38-e6a9161650c7',
				name : 'banner'
			}
		]
		if(name_type){
			search_expression = 'index_type = types_pred.map( (type_pred)=>{return type_pred.name} ).indexOf(name_type)'
			return_expression = 'types_pred[index_type].id'
		}
		else{
			search_expression = 'index_type = types_pred.map( (type_pred)=>{return type_pred.id} ).indexOf(id_type)'
			return_expression = 'types_pred[index_type].name'
		}

		eval( search_expression )

		if(index_type !== -1){
			return eval( return_expression )
		}	
		else{
			return false;
		}
	}

	cms_vtex_layout.get_list_objects = ( instance_type,instance_id ) => {
		//si es HTML
		let uri_def = CMSVtex_general.url_base + '/admin/a/PortalManagement/GetFormHtmlConfig?viewInstanceId=' + instance_id

		let response_sync = request('POST',uri_def,{
				headers : {
					'Cookie' : CMSVtex_general.cookie_vtex,
					'Content-Type' : 'text/HTML'
				}
			})

		let body = response_sync.body.toString(),
			$ = cheerio.load(body),
			return_var = []

		if($('.divFieldSetHtmlDataRow').length > 0){
			$('.divFieldSetHtmlDataRow').each(function(){

				let periods = []
				if($(this).find('#period').text().trim() != ''){
					$(this).find('#period .periodDateItens').each(function(){
						periods.push({
							from : $(this).attr('datetimefrom'),
							to : $(this).attr('datetimeto')
						})
					})
				}

				if(instance_type == 'html'){
					additional = CMSVtex_general.get_html_entities($(this).find('#html a').attr('title'))
				}

				return_var.push({
					    name : $(this).find('#contentName textarea').html(),
					    id : $(this).find('#id').text().trim(),
					    partner : $(this).find('#partner textarea').html(),
					    campaign : $(this).find('#partner textarea').html(),
					    category : $(this).find('#category').text().trim(),
					    brand : $(this).find('#brand').text().trim(),
					    source : $(this).find('#source textarea').html(),
					    keyword : $(this).find('#keyword textarea').html().trim(),
					    period : periods,
					    active : ($(this).find('#active input').attr('checked')) ? true : false,
					    additional : additional
				})
			})
		}

		//res_.end(response_sync.body.toString())
		return return_var;
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
				selected_list += '-||-' + placeholder.id + '[:]' + cms_vtex_layout.get_type_control( false,control.type ) + '[:]'
			
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

		return selected_list
	}

	cms_vtex_layout.add_control = ( layout_id,placeholder_id,name_control,type_control,content_layout_us ) => {
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

			return save_layout;
		}
		else{
			return 'Lo siento, este placeholder no existe (al menos no en este layout (?))';
		}
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

			console.log('placeholder is',layout.placeholders[placeholder_delete_index])

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

			console.log('placeholder is',layout.placeholders[placeholder_delete_index])

			if( index_control_delete !== -1 ){
				layout.placeholders[placeholder_delete_index].controls.splice(index_control_delete,1)

				let delete_control = cms_vtex_layout.save_control( layout );
				return delete_control;
			}	
			else{
				return 'Lo siente este control no existe, al menos no en este placeholder :('
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

	return cms_vtex_layout;
}( exports )