//Dependencias
const request = require('sync-request');
const request2 = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const querystring = require('querystring');
const CMSVtex_general = require('./CMSVtex_general');

/**
 * Template.
 * @module template
 * @since 1.0.0
 * @desc Este módulo es util para manipular templates,sub-templates,shelf templates del CMS de vtex */
module.exports = (function(){
	cms_vtex_template = exports;
	/**
	 * @method get
	 * @desc Obtiene una lista de templates,sub templates o shelf templates.
	 * @param {Boolean} [sub_templates] Si se requier obtener los sub-templates.
	 * @param {Boolean} [shelf_template] Si se requiere obtener los shelf-templates, si este se pasa true sub_templates debe ser false.
	 * @param {Boolean} [no_return_html] Si se quiere obtener los templates sin su html
	 * @param {Object} config {account:'ex:chefcompany',cookie:'ex:...'}
	 * @return {Object[]} Con toda la información de los templates incluidos id,nombre y html
	 */
	cms_vtex_template.get = ( sub_templates,shelf_template,no_return_html,config ) => {
		let sub_templates_def = (sub_templates) ? 1 : 0,
			uri_def = CMSVtex_general.get_url_base( config.account ) + '/admin/a/PortalManagement/GetTemplateList?type='

			if(shelf_template){
				uri_def += 'shelfTemplate'
			}
			else{
				uri_def += 'viewTemplate&IsSub=' + sub_templates_def
			}

		let response_sync = request('GET',uri_def,
		{
			headers : {
				'Cookie' : CMSVtex_general.nameGeneralCookie + '=' + config.cookie,
				'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
			}
		})

		let body = response_sync.body.toString(),
			$ = cheerio.load(body),
			return_var = []
		contador = 0
		console.log(uri_def)
		$('.jqueryFileTreeBody li').each(function(){
			//let quick_return = cms_vtex_template.get_template( $(this).find('a').attr('href').split('=')[1] )
			console.log('guardando un template',(contador++) + ' de ',$('.jqueryFileTreeBody li').length)
			return_var.push({
				id : $(this).find('a').attr('href').split('=')[1],
				name : $(this).find('div').text()
			})

			if( !no_return_html ){
				if(shelf_template){
					return_var[return_var.length - 1].info_shelf = cms_vtex_template.get_template( $(this).find('a').attr('href').split('=')[1],true )
				}
				else{
					return_var[return_var.length - 1].html = (shelf_template) ? cms_vtex_template.get_template( $(this).find('a').attr('href').split('=')[1],true ).html : cms_vtex_template.get_template( $(this).find('a').attr('href').split('=')[1] ).html
				}
			}
		})	
		return return_var	
	}

	/**
	 * @method get_sub_templates
	 * @param {Boolean} [no_return_html] Si se quiere obtener los subtemplates sin su html
	 * @param {Object} config {account:'ex:chefcompany',cookie:'ex:...'}
	 * @desc Obtiene una lista de sub templates.
	 * @return {Object[]} Con toda la información de los sub templates incluidos id,nombre y html
	 */
	cms_vtex_template.get_sub_templates = ( no_return_html,config ) =>{return cms_vtex_template.get( true,false,no_return_html,config )}

	/**
	 * @method get_shelf_templates
	 * @param {Boolean} [no_return_html] Si se quiere obtener los subtemplates sin su html
	 * @param {Object} config {account:'ex:chefcompany',cookie:'ex:...'}
	 * @desc Obtiene una lista de shelf templates.
	 * @return {Object[]} Con toda la información de los shelf templates incluidos id,nombre y html
	 */
	cms_vtex_template.get_shelf_templates = ( no_return_html,config ) => { return cms_vtex_template.get( false,true,no_return_html,config )}

	/**
	 * @method get_template
	 * @desc Obtiene la información de un template específico bien sea: template,sub template o shelf template.
	 * @param {string} id_template Id de template asignado por el CMS de Vtex del que se requiere la información.
	 * @param {Boolean} [shelf] Se pasa como true si la información que se requiere corresponde a un shelf template.
	 * @param {Object} config {account:'ex:chefcompany',cookie:'ex:...'}
	 * @return {Object} Con la información del template que incluye id,nombre y html
	 */
	cms_vtex_template.get_template = ( id_template,shelf,config ) => {
		
		if(shelf){
			uri_def = CMSVtex_general.get_url_base( config.account ) + '/admin/a/PortalManagement/ShelfTemplateContent?ShelfTemplateId=' + id_template
		}
		else{
			uri_def = CMSVtex_general.get_url_base( config.account ) + '/admin/a/PortalManagement/TemplateContent?templateId=' + id_template
		}
		
		//console.log(uri_def)
		let response_sync = request('GET',uri_def,{
				headers : {
					'Cookie' : CMSVtex_general.nameGeneralCookie + '=' + config.cookie,
					'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
				}
			})

		let body = response_sync.body.toString();
	
		let $ = cheerio.load(body),
			info_template = {
				id : id_template,
				name : $('input#templateName').attr('value'),
				html : CMSVtex_general.get_html_entities($('textarea').html()),
				//placeholders : xml_obje
			}

		if(shelf){
			info_template.templateCssClass = $('#templateCssClass').attr('value')
			info_template.round_corners = (typeof $('#roundCorners').attr('checked') !== 'undefined')
		}
	
		return info_template	
	}

	cms_vtex_template.get_new_template_id = ( sub_templates,shelf_template,config ) => {
		let sub_templates_def = (sub_templates) ? 'true' : 'false';

		if(shelf_template){
			uri_def = CMSVtex_general.get_url_base( config.account ) + '/admin/a/PortalManagement/AddShelfTemplate'
		}
		else{
			uri_def = CMSVtex_general.get_url_base( config.account ) + '/admin/a/PortalManagement/AddTemplate?siteId=&isSub=' + sub_templates_def
		}

		let response_sync = request('GET',uri_def,
		{
			headers : {
				'Cookie' : CMSVtex_general.nameGeneralCookie + '=' + config.cookie,
				'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
			}
		})

		let $ = cheerio.load(response_sync.body.toString());

		return ($('title').text().trim() == 'VTEX ID Authentication') ? false : $('#templateId').attr('value');
	}

	cms_vtex_template.save_template = ( name_template,sub_template_us,content,action_form,id_template,original_content_us,shelf_template,class_shelf,round_corners,config ) => {
		let sub_template = (sub_template_us) ? true : false;
		let original_content = (original_content_us) ? original_content_us : '';

		if(action_form == 'Save'){
			if(shelf_template){
				id_template = cms_vtex_template.get_new_template_id(false,true,config);
			}
			else if(sub_template){
				id_template = cms_vtex_template.get_new_template_id(true,false,config);
			}
			else{
				id_template = cms_vtex_template.get_new_template_id(false,false,config);
			}
			
			original_html = ''
		}

		let data_form = {
			template : content,
			isSub : sub_template,
			templateId : id_template,
			actionForm : action_form,
			textConfirm: 'sim',
			originalTemplate : original_content,
			templateName : name_template
		}

		if(shelf_template){
			data_form.templateCssClass = class_shelf
			data_form.roundCorners = round_corners
		}

		if(id_template == undefined){
			return 'no se pudo crear el template';
		}

		uri_def = (shelf_template) ? CMSVtex_general.get_url_base( config.account ) + '/admin/a/PortalManagement/SaveShelfTemplate' : CMSVtex_general.get_url_base( config.account ) + '/admin/a/PortalManagement/SaveTemplate'
		//console.log('uri def is',uri_def)
		let response_sync = request('POST',uri_def,{
			headers : {
				'Cookie' : CMSVtex_general.nameGeneralCookie + '=' + config.cookie,
				'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
			},
			body : querystring.stringify(data_form)
		})

		let body = response_sync.body.toString();

		if(body.indexOf('<applicationexceptionobject>{') !== -1){
			const x = body.indexOf('<applicationexceptionobject>') + 28
			const y = body.indexOf('</applicationexceptionobject>')
			const obj = JSON.parse(body.substr(x, y - x))

			return obj.message
		}	
		else{
			return {
				success : true,
				new_name : name_template,
				new_id : id_template,
				new_html : content
			}
		}
	}

	/**
	 * @method add_template
	 * @desc Crea un template.
	 * @param {string} name_template Nombre del nuevo template.
	 * @param {string} content Html del nuevo template
	 * @param {Object} config {account:'ex:chefcompany',cookie:'ex:...'}
	 * @return {Object|string} Si existe un errror al momento de guardar un template retorna un objeto con las propiedades error:true,nombre del template y descripción del error.
	 */
	cms_vtex_template.add_template = ( name_template,content,config ) => {
		return cms_vtex_template.save_template( name_template,false,content,'Save',false,false,false,false,false,config );
	}

	/**
	 * @method update_template
	 * @desc Actualiza un template.
	 * @param {string} name_template Nuevo nombre del template.
	 * @param {string} id_template Id del template que se va a modificar.
	 * @param {string} content Nuevo html del template
	 * @param {string} original_content Html anterior del template
	 * @param {Object} config {account:'ex:chefcompany',cookie:'ex:...'}
	 * @return {Object|string} Si existe un errror al momento de guardar un template retorna un objeto con las propiedades error:true,nombre del template y descripción del error.
	 */
	cms_vtex_template.update_template = ( name_template,id_template,content,original_content,config ) => {
		return cms_vtex_template.save_template( name_template,false,content,'Update',id_template,original_content,config );
	}	

	/**
	 * @method add_sub_template
	 * @desc Crea un sub template.
	 * @param {string} name_sub_template Nombre del nuevo sub template.
	 * @param {string} content Html del nuevo sub template
	 * @param {Object} config {account:'ex:chefcompany',cookie:'ex:...'}
	 * @return {Object|string} Si existe un errror al momento de guardar un sub template retorna un objeto con las propiedades error,nombre del sub template y descripción del error.
	 */
	cms_vtex_template.add_sub_template = ( name_sub_template,content,config ) => { 
		return cms_vtex_template.save_template( name_sub_template,true,content,'Save',config ) 
	}

	/**
	 * @method update_sub_template
	 * @desc Actualiza un sub template.
	 * @param {string} name_sub_template Nuevo nombre del sub template.
	 * @param {string} id_sub_template Id del sub template que se va a modificar.
	 * @param {string} content Nuevo html del sub template
	 * @param {string} original_content Html anterior del sub template
	 * @param {Object} config {account:'ex:chefcompany',cookie:'ex:...'}
	 * @return {Object|string} Si existe un errror al momento de guardar un sub template retorna un objeto con las propiedades error:true,nombre del template y descripción del error.
	 */
	cms_vtex_template.update_sub_template = ( name_sub_template,id_sub_template,content,original_content,config ) => {
		return cms_vtex_template.save_template( name_sub_template,true,content,'Update',id_sub_template,original_content,config )
	}

	/**
	 * @method add_shelf_template
	 * @desc Crea un sub template.
	 * @param {string} name_template Nombre del nuevo shelf template.
	 * @param {string} content Html del nuevo shelf template.
	 * @param {string} templateCssClass clase css agregada al contenedor de la vitrina
	 * @param {Boolean} round_corners
	 * @param {Object} config {account:'ex:chefcompany',cookie:'ex:...'}
	 * @return {Object|string} Si existe un errror al momento de guardar un shelf template retorna un objeto con las propiedades error,nombre del shelf template y descripción del error.
	 */
	cms_vtex_template.add_shelf_template = ( name_template,content,templateCssClass,round_corners,config ) => {
		return cms_vtex_template.save_template( name_template,false,content,'Save',false,false,true,templateCssClass,round_corners,config );
	}

	/**
	 * @method update_shelf_template
	 * @desc Actualiza un shelf template.
	 * @param {string} name_shelf_template Nuevo nombre del shelf template.
	 * @param {string} id_shelf_template Id del shelf template que se va a modificar.
	 * @param {string} content Nuevo html del shelf template
	 * @param {string} original_content Html anterior del shelf template
	 * @param {string} templateCssClass Nueva clase css que se agrega a la vitrina que contiene los productos.
	 * @param {Boolean} round_corners
	 * @param {Object} config {account:'ex:chefcompany',cookie:'ex:...'}
	 * @return {Object|string} Si existe un errror al momento de guardar un shelf template retorna un objeto con las propiedades error:true,nombre del shelf template y descripción del error.
	 */
	cms_vtex_template.update_shelf_template = ( name_shelf_template,id_shelf_template,content,original_content,templateCssClass,round_corners,config ) => {
		return cms_vtex_template.save_template( name_shelf_template,false,content,'Update',id_shelf_template,original_content,true,templateCssClass,round_corners,config )
	}

	/**
	 * @method delete
	 * @desc Elimina un template o sub template o shelf template.
	 * @param {string} id_template Id del temlate,sub template o shelf template que se va a eliminar.
	 * @param {Boolean} [shelf_template] Se pasa como true si lo que se quiere eliminar es un shelf template.
	 * @param {Object} config {account:'ex:chefcompany',cookie:'ex:...'}
	 * @return {Boolean|string} Si realiza la eliminación correctamente devuelve true, de lo contrario retorna un mensaje con el error devuelto por Vtex.
	 */
	cms_vtex_template.delete = ( id_template,shelf_template,config ) => {
		/*let info_template = cms_vtex_template.get_template( id_template );

		return info_template;*/

		let uri_def = (shelf_template) ? CMSVtex_general.get_url_base( config.account ) + '/admin/a/PortalManagement/ShelfTemplateDel' : CMSVtex_general.get_url_base( config.account ) + '/admin/a/PortalManagement/TemplateDel'
		let data = {
			id : id_template,
			textConfirm : 'sim',
		}

		let sync_response = request('POST',uri_def,{
			headers : {
				'Cookie' : CMSVtex_general.nameGeneralCookie + '=' + config.cookie,
				'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
			},
			body : querystring.stringify( data )
		})

		let body = sync_response.body.toString(),
			$ = cheerio.load(body);

		return ($('title').text().trim() == 'VTEX ID Authentication') ? true : $('title').text();
	}

	return cms_vtex_template;
})()