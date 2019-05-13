//Dependencias
const request = require('sync-request');
const request2 = require('request');
const cheerio = require('cheerio');
const crypto = require('crypto');
const fs = require('fs');
const CMSVtex_general = require('./CMSVtex_general');
const querystring = require('querystring');

/**
 * Template.
 * @module template
 * @since 1.0.0
 * @desc Este módulo es util para manipular templates,sub-templates,shelf templates del CMS de vtex */
module.exports = function( cms_vtex_template ){
	/**
	 * @method get
	 * @desc Obtiene una lista de templates,sub templates o shelf templates.
	 * @param {Boolean} [sub_templates] Si se requier obtener los sub-templates.
	 * @param {Boolean} [shelf_template] Si se requier obtener los shelf-templates, si este se pasa true sub_templates debe ser false.
	 * @return {Object[]} Con toda la información de los templates incluidos id,nombre y html
	 */
	cms_vtex_template.get = ( sub_templates,shelf_template ) => {
		let sub_templates_def = (sub_templates) ? 1 : 0,
			uri_def = CMSVtex_general.url_base + 'admin/a/PortalManagement/GetTemplateList?type='

			if(shelf_template){
				uri_def += 'shelfTemplate'
			}
			else{
				uri_def += 'viewTemplate&IsSub=' + sub_templates_def
			}

		let response_sync = request('GET',uri_def,
		{
			headers : {
				'Cookie' : CMSVtex_general.cookie_vtex,
				'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
			}
		})

		let body = response_sync.body.toString(),
			$ = cheerio.load(body),
			return_var = []
		contador = 0
		$('.jqueryFileTreeBody li').each(function(){
			//let quick_return = cms_vtex_template.get_template( $(this).find('a').attr('href').split('=')[1] )
			console.log('guardando un template',(contador++) + ' de ',$('.jqueryFileTreeBody li').length)
			return_var.push({
				id : $(this).find('a').attr('href').split('=')[1],
				name : $(this).find('div').text(),
				html : (shelf_template) ? cms_vtex_template.get_template( $(this).find('a').attr('href').split('=')[1],true ).html : cms_vtex_template.get_template( $(this).find('a').attr('href').split('=')[1] ).html
			})
		})	
		return return_var	
	}

	/**
	 * @method get_sub_templates
	 * @desc Obtiene una lista de sub templates.
	 * @return {Object[]} Con toda la información de los sub templates incluidos id,nombre y html
	 */
	cms_vtex_template.get_sub_templates = () =>{return cms_vtex_template.get( true )}

	/**
	 * @method get_shelf_templates
	 * @desc Obtiene una lista de shelf templates.
	 * @return {Object[]} Con toda la información de los shelf templates incluidos id,nombre y html
	 */
	cms_vtex_template.get_shelf_templates = () => { return cms_vtex_template.get( false,true )}

	/**
	 * @method get_template
	 * @desc Obtiene la información de un template específico bien sea: template,sub template o shelf template.
	 * @param {string} id_template Id de template asignado por el CMS de Vtex del que se requiere la información.
	 * @param {Boolean} [shelf] Se pasa como true si la información que se requiere corresponde a un shelf template.
	 * @return {Object} Con la información del template que incluye id,nombre y html
	 */
	cms_vtex_template.get_template = ( id_template,shelf ) => {
		
		if(shelf){
			uri_def = CMSVtex_general.url_base + 'admin/a/PortalManagement/ShelfTemplateContent?ShelfTemplateId=' + id_template
		}
		else{
			uri_def = CMSVtex_general.url_base + 'admin/a/PortalManagement/TemplateContent?templateId=' + id_template
		}
		
		
		let response_sync = request('GET',uri_def,{
				headers : {
					'Cookie' : CMSVtex_general.cookie_vtex,
					'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
				}
			})

		let body = response_sync.body.toString();
	
		let $ = cheerio.load(body),
			info_template = {
				id : id_template,
				name : $('input#templateName').attr('value'),
				html : CMSVtex_general.get_html_entities($('textarea').html()),
				//placeholders : xml_object
			}
	
		return info_template	
	}

	cms_vtex_template.get_template_by_name = ( name_template,html_local ) => {
		let all_templates = JSON.parse(fs.readFileSync('list-templates.json', 'utf8')),
		//let all_templates = cms_vtex_template.get(),
			index_template = all_templates.map(( template ) => {
				return template.name.toLowerCase()
			}).indexOf(name_template.toLowerCase())

		if(index_template !== -1){
			return_var = all_templates[index_template]
			if(html_local){
				return_var.html = cms_vtex_template.get_html_local( all_templates[index_template].name )
			}
		}

		return return_var
		
	}

	cms_vtex_template.get_html_local = ( name_template ) => {
		let path_template = CMSVtex_general.url_src + '/templates/' + name_template + '.html',
			template_exist = fs.existsSync( path_template )

		if(template_exist){
			let content = fs.readFileSync( path_template,'utf8' );

			return content;
		}
		else{
			return false;
		}


	}

	cms_vtex_template.get_new_template_id = (templatename) => crypto.createHash('md5').update(templatename).digest('hex')

	cms_vtex_template.save_template = ( name_template,sub_template_us,content,action_form,id_template,original_content_us,shelf_template,class_shelf,round_corners ) => {
		let sub_template = (sub_template_us) ? true : false;
		let original_content = (original_content_us) ? original_content_us : '';

		if(action_form == 'Save'){
			id_template = cms_vtex_template.get_new_template_id(name_template);
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

		uri_def = (shelf_template) ? CMSVtex_general.url_base + 'admin/a/PortalManagement/SaveShelfTemplate' : CMSVtex_general.url_base + 'admin/a/PortalManagement/SaveTemplate'
		console.log('uri def is',uri_def)
		let response_sync = request('POST',uri_def,{
			headers : {
				'Cookie' : CMSVtex_general.cookie_vtex,
				'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
			},
			body : querystring.stringify(data_form)
		})

		let body = response_sync.body.toString();
		console.log(body)
		if(body.indexOf('<applicationexceptionobject>{') !== -1){
			const x = body.indexOf('<applicationexceptionobject>') + 28
			const y = body.indexOf('</applicationexceptionobject>')
			const obj = JSON.parse(body.substr(x, y - x))

			return {
				error : true,
				template : name_template,
				error : obj.message
			}
		}	
		else{
			return 'success ' + action_form + ': ' + name_template;
		}
	}

	/**
	 * @method add_template
	 * @desc Crea un template.
	 * @param {string} name_template Nombre del nuevo template.
	 * @param {string} content Html del nuevo template
	 * @return {Object|string} Si existe un errror al momento de guardar un template retorna un objeto con las propiedades error:true,nombre del template y descripción del error.
	 */
	cms_vtex_template.add_template = ( name_template,content ) => {
		return cms_vtex_template.save_template( name_template,false,content,'Save' );
	}

	/**
	 * @method update_template
	 * @desc Actualiza un template.
	 * @param {string} name_template Nuevo nombre del template.
	 * @param {string} id_template Id del template que se va a modificar.
	 * @param {string} content Nuevo html del template
	 * @param {string} original_content Html anterior del template
	 * @return {Object|string} Si existe un errror al momento de guardar un template retorna un objeto con las propiedades error:true,nombre del template y descripción del error.
	 */
	cms_vtex_template.update_template = ( name_template,id_template,content,original_content ) => {
		return cms_vtex_template.save_template( name_template,false,content,'Update',id_template,original_content );
	}	

	/**
	 * @method add_sub_template
	 * @desc Crea un sub template.
	 * @param {string} name_sub_template Nombre del nuevo sub template.
	 * @param {string} content Html del nuevo sub template
	 * @return {Object|string} Si existe un errror al momento de guardar un sub template retorna un objeto con las propiedades error,nombre del sub template y descripción del error.
	 */
	cms_vtex_template.add_sub_template = ( name_sub_template,content ) => { 
		return cms_vtex_template.save_template( name_sub_template,true,content,'Save' ) 
	}

	/**
	 * @method update_sub_template
	 * @desc Actualiza un sub template.
	 * @param {string} name_sub_template Nuevo nombre del sub template.
	 * @param {string} id_sub_template Id del sub template que se va a modificar.
	 * @param {string} content Nuevo html del sub template
	 * @param {string} original_content Html anterior del sub template
	 * @return {Object|string} Si existe un errror al momento de guardar un sub template retorna un objeto con las propiedades error:true,nombre del template y descripción del error.
	 */
	cms_vtex_template.update_sub_template = ( name_sub_template,id_sub_template,content,original_content ) => {
		return cms_vtex_template.save_template( name_sub_template,true,content,'Update',id_sub_template,original_content )
	}

	/**
	 * @method add_shelf_template
	 * @desc Crea un sub template.
	 * @param {string} name_template Nombre del nuevo shelf template.
	 * @param {string} content Html del nuevo shelf template.
	 * @param {string} templateCssClass clase css agregada al contenedor de la vitrina
	 * @param {Boolean} round_corners
	 * @return {Object|string} Si existe un errror al momento de guardar un shelf template retorna un objeto con las propiedades error,nombre del shelf template y descripción del error.
	 */
	cms_vtex_template.add_shelf_template = ( name_template,content,templateCssClass,round_corners ) => {
		return cms_vtex_template.save_template( name_template,false,content,'Save',false,false,true,templateCssClass,round_corners );
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
	 * @return {Object|string} Si existe un errror al momento de guardar un shelf template retorna un objeto con las propiedades error:true,nombre del shelf template y descripción del error.
	 */
	cms_vtex_template.update_shelf_template = ( name_shelf_template,id_shelf_template,content,original_content,templateCssClass,round_corners ) => {
		return cms_vtex_template.save_template( name_shelf_template,false,content,'Update',id_shelf_template,original_content,true,templateCssClass,round_corners )
	}

	/**
	 * @method delete
	 * @desc Elimina un template o sub template o shelf template.
	 * @param {string} id_template Id del temlate,sub template o shelf template que se va a eliminar.
	 * @param {Boolean} [shelf_template] Se pasa como true si lo que se quiere eliminar es un shelf template.
	 * @return {Boolean|string} Si realiza la eliminación correctamente devuelve true, de lo contrario retorna un mensaje con el error devuelto por Vtex.
	 */
	cms_vtex_template.delete = ( id_template,shelf_template ) => {
		/*let info_template = cms_vtex_template.get_template( id_template );

		return info_template;*/

		let uri_def = (shelf_template) ? CMSVtex_general.url_base + 'admin/a/PortalManagement/ShelfTemplateDel' : CMSVtex_general.url_base + '/admin/a/PortalManagement/TemplateDel'
		let data = {
			id : id_template,
			textConfirm : 'sim',
		}

		let sync_response = request('POST',uri_def,{
			headers : {
				'Cookie' : CMSVtex_general.cookie_vtex,
				'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
			},
			body : querystring.stringify( data )
		})

		let body = sync_response.body.toString(),
			$ = cheerio.load(body);

		return ($('title').text().trim() == 'VTEX ID Authentication') ? true : $('title').text();
	}

	return cms_vtex_template;
}( exports )