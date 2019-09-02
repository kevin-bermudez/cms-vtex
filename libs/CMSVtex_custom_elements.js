//Dependencias
const request = require('sync-request');
const cheerio = require('cheerio');
const querystring = require('querystring');
const CMSVtex_layout = require('./CMSVtex_layout');
const fs = require('fs');
const path = require('path');
const CMSVtex_general = require('./CMSVtex_general');

/**
 * Custom Elements.
 * @module custom_elements
 * @since 1.0.0
 * @desc Este módulo es util para manipular los custom elements del CMS de vtex incluidos también los objetos de los mismos */
module.exports = (function(){
	cms_vtex_custom_elements = exports;
	cms_vtex_custom_elements.get_list_objects = ( instance_type,instance_id,config ) => {
		//si es HTML
		if(instance_type == 'html'){
			uri_def = CMSVtex_general.get_url_base( config.account ) + '/admin/a/PortalManagement/GetFormHtmlConfig?viewInstanceId=' + instance_id
		}
		else{
			uri_def = CMSVtex_general.get_url_base( config.account ) + '/admin/a/PortalManagement/GetFormShelfConfig?viewInstanceId=' + instance_id
		}
		data = {
			isCustomViewPart : 'True'
		}
		let response_sync = request('POST',uri_def,{
				headers : {
					'Cookie' : CMSVtex_general.nameGeneralCookie + '=' + config.cookie,
					'Content-Type' : "application/x-www-form-urlencoded; charset=UTF-8"
				},
				body : querystring.stringify(data)
			})

		let body = response_sync.body.toString();
		//console.log(body)
		return CMSVtex_general.get_content_object( body,instance_type );
	}

	/**
	 * @method get
	 * @desc Obtiene una lista de los custom elements creados en el CMS de Vtex
	 * @param {int} [quantity_elements_us] Cuantos custom elements se quieren recibir como respuesta.
	 * @param {Boolean} [width_content] Si se quieren obtener los objectos de cada custom element.
	 * @param {Object} config {account:'ex:chefcompany',cookie:'ex:...'}
	 * @return {Object[]} Con toda la información de los custom elements incluidos los objetos de los mismos si así se requiere.
	 */
	cms_vtex_custom_elements.get = ( quantity_elements_us,width_content,config ) => {
		let uri_def = CMSVtex_general.get_url_base( config.account ) + '/admin/a/PortalManagement/HandleCustomViewPartList/?siteId=';

		let data = {
			page : 1,
			rp : (quantity_elements_us) ? quantity_elements_us : 200000000,
			sortname : "Id",
		}

		var response_sync = request('POST', uri_def,{
			headers : {
				'Cookie' : CMSVtex_general.nameGeneralCookie + '=' + config.cookie,
				'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
			},
			body : querystring.stringify(data)
		} ,
		);

		let response_vtex = JSON.parse(response_sync.body.toString()).rows,
			response_vtex_length = response_vtex.length,
			var_return = [];

		for(let index = 0;index < response_vtex_length;index++){
			var_return.push({
				view_part_id : response_vtex[index].id,
				custom_view_part_id : response_vtex[index].cell[1],
				name : response_vtex[index].cell[2],
				tag : response_vtex[index].cell[3],
				type : response_vtex[index].cell[4].toLowerCase()
			})

			if(width_content){
				//console.log(response_vtex[index].cell[4])
				//console.log(response_vtex[index].cell[2],response_vtex[index].cell[4])
				//let type_instance = response_vtex[index].cell[4];
				//console.log('el tipo lo trae como ',type_instance)
				var_return[var_return.length - 1].objects = cms_vtex_custom_elements.get_list_objects( response_vtex[index].cell[4],response_vtex[index].cell[1],config );
			}
		}
		
		return var_return;

	}

	/**
	 * @method get_info_instance
	 * @desc Devuelve la información básica de un custom element sin incluir sus objetos
	 * @param {string} instance_id Identificador devulto por Vtex.
	 * @param {string} view_part_id Segundo identificador devuelto por Vtex y otros métodos de este módulo.
	 * @param {Boolean} coleccion Se pasa como true cuando el tipo de custom element del que se quiere obtener la información es Colección.
	 * @param {Object} config {account:'ex:chefcompany',cookie:'ex:...'}
	 * @return {Object} Con toda la información básica del custom element.
	 */
	cms_vtex_custom_elements.get_info_instance = ( instance_id,view_part_id,coleccion,config ) => {
		let uri_def = CMSVtex_general.get_url_base( config.account ) + '/admin/a/PortalManagement/AddCustomViewPart?siteId=&customViewPartId=' + instance_id + '&viewPartId=' + view_part_id
		//console.log(uri_def)
		let response_sync = request('GET',uri_def,{
				headers : {
					'Cookie' : CMSVtex_general.nameGeneralCookie + '=' + config.cookie,
					'Content-Type' : "application/x-www-form-urlencoded; charset=UTF-8"
				}
			})

		let body = response_sync.body.toString();
		let $ = cheerio.load(body);
		//console.log(body)

		var_return = {
			name : $('#customViewPartNameOut').attr('value').trim(),
			tag_name : $('#customViewPartTagNameOut').attr('value').trim(),
			instance_id,
			view_part_id
		}

		if(coleccion){
			let uri_def = CMSVtex_general.get_url_base( config.account ) + '/admin/a/PortalManagement/GetFormShelfConfig?viewInstanceId=' + instance_id
			//console.log(uri_def)
			let response_sync = request('POST',uri_def,{
					headers : {
						'Cookie' : CMSVtex_general.nameGeneralCookie + '=' + config.cookie,
						'Content-Type' : "application/x-www-form-urlencoded; charset=UTF-8"
					},
					body : querystring.stringify({
						isCustomViewPart : true
					})
				})

			let body = response_sync.body.toString();
			let $ = cheerio.load(body);

			col_var_return = {
				layout : $('#layout').children("option:selected").attr('value'),
				colCount : $('#colCount').attr('value'),
				itemCount : $('#itemCount').attr('value'),
				showUnavailable : (typeof $('#showUnavailable').attr('checked') != 'undefined'),
				isRandomize : (typeof $('#isRandomize').attr('checked') != 'undefined'),
				isPaged : (typeof $('#isPaged').attr('checked') != 'undefined'),
			}

			

			var_return = Object.assign( var_return,col_var_return );
		}

		return var_return;
	}

	cms_vtex_custom_elements.generate_content_list_coleccion = ( actual_objects,instance_id ) => {
		actual_objects_length = actual_objects.length,
		shelf_content_list = []
		//console.log('generate list',actual_objects)
		for(let index = 0;index < actual_objects_length;index++){
			shelf_content_list.push({
				ViewPartInstanceId : instance_id,
				Indice : index,
				ContentName : CMSVtex_general.get_html_entities(actual_objects[index].name),
				Partner : actual_objects[index].partner,
				Campaign : actual_objects[index].campaign,
				Category : actual_objects[index].category,
				Brand : actual_objects[index].brand,
				Source : actual_objects[index].source,
				Keyword : actual_objects[index].keyword,
				Periods : actual_objects[index].period,
				Active : (actual_objects[index].active),
				ProductCluster : (actual_objects[index].additional.ProductCluster) ? actual_objects[index].additional.ProductCluster :'',
				SearchQueryString : actual_objects[index].additional.queryString,
				Id : actual_objects[index].id
			})
		}

		return shelf_content_list;
	}

	cms_vtex_custom_elements.save = ( instance_type,info_new,view_part_id,instance_id,config ) => {
		//instance_id = ''
		let data = {
			viewPartInstanceId : (instance_id) ? instance_id : '',
			//totalRows : 0,
			isCustomViewPart : 'True',
			customViewPartName : info_new.customViewPartName,
			customViewPartTagName : info_new.customViewPartTagName,
			customViewPartTypeId : CMSVtex_general.get_type_control( false,instance_type ),
			customViewPartisPersisted : (view_part_id) ? 'True' : 'False',
			categoryIdSelected : (info_new.categoryIdSelected) ? info_new.categoryIdSelected : '',
			categoryNameSelected : (info_new.categoryNameSelected) ? info_new.categoryNameSelected : ''
		}

		if(instance_type == 'html'){
			data.htmlContentList = (info_new.htmlContentList) ? JSON.stringify(info_new.htmlContentList) : ""
			data.htmlContentListInicial = (info_new.htmlContentListInicial) ? JSON.stringify(info_new.htmlContentListInicial) : ""
			data.FormHtmlConfigId = (instance_id) ? instance_id : ''
		}
		else{
			data.layout = info_new.layout
			data.colCount = info_new.colCount
			data.itemCount = info_new.itemCount
			data.showUnavailable = (info_new.showUnavailable) ? info_new.showUnavailable : false
			data.isRandomize = (info_new.isRandomize) ? info_new.isRandomize : false
			data.isPaged = (info_new.isPaged) ? info_new.isPaged : false
			data.contentList = (info_new.contentList) ? info_new.contentList : '[]'
			data.contentListInicial = (info_new.contentListInicial) ? info_new.contentListInicial : ''
			data.FormShelfConfigId = (instance_id) ? instance_id : ''
			//data.customViewpartId = ''
		}

		if(view_part_id){
			data.customViewPartId = instance_id;
			data.viewPartId = view_part_id;
		}

		//console.log(data)

		let uri_def = CMSVtex_general.get_url_base( config.account ) + 'admin/a/PortalManagement/'
		if(instance_type == 'html'){
			uri_def += 'SaveHtmlConfig'
		}
		else{
			uri_def += 'SaveControlConfig'
		}
		

		let sync_response = request('POST',uri_def,{
			headers : {
				'Cookie' : CMSVtex_general.nameGeneralCookie + '=' + config.cookie,
				'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
			},
			body : querystring.stringify(data)
		})

		let body = sync_response.body.toString();

		if(body != ''){
			$ = cheerio.load( body );
			return $('title').text()
		}
		else{
			return true;
		}
	}

	/**
	 * @method add
	 * @desc Agrega un custom element.
	 * @param {string} instance_type Tipo de custom element: html o coleccion
	 * @param {Object} info_new Con la información de configuración para el custom element según corresponda.
	 * @param {Object} config {account:'ex:chefcompany',cookie:'ex:...'}
	 * @return {string|Boolean} Devuelve true si Vtex no retornó ningún error de lo contrario retorna un string con el mensaje d error generado por Vtex
	 */
	cms_vtex_custom_elements.add = ( instance_type,info_new,config ) => {
		return cms_vtex_custom_elements.save( instance_type,info_new,false,false,config );
	}

	/**
	 * @method update
	 * @desc Actualiza un custom element creado previamente en el CMS.
	 * @param {string} instance_type Tipo de custom element: html o coleccion
	 * @param {Object} info_new Con la información de la nueva configuración para el custom element según corresponda.
	 * @param {string} view_part_id Identificador devuelto por Vtex y otros métodos de este módulo.
	 * @param {string} instance_id Identificador devuelto por Vtex y otros métodos de este módulo.
	 * @param {Object} config {account:'ex:chefcompany',cookie:'ex:...'}
	 * @return {string|Boolean} Devuelve true si Vtex no retornó ningún error de lo contrario retorna un string con el mensaje d error generado por Vtex
	 */
	cms_vtex_custom_elements.update = ( instance_type,info_new,view_part_id,instance_id,config ) => {
		return cms_vtex_custom_elements.save( instance_type,info_new,view_part_id,instance_id,config );
	}

	/**
	 * @method delete
	 * @desc Elimina un custom element creado previamente en el CMS.
	 * @param {string} view_part_id Identificador devuelto por Vtex y otros métodos de este módulo.
	 * @param {string} custom_view_part_id Identificador devuelto por Vtex y otros métodos de este módulo.
	 * @param {Object} config {account:'ex:chefcompany',cookie:'ex:...'}
	 * @return {Boolean} True si se completa la opción correctamente o de lo contrario false.
	 */
	cms_vtex_custom_elements.delete = ( view_part_id,custom_view_part_id,config ) => {
		let data = {
			textConfirm : 'yes',
			customViewPartId : custom_view_part_id,
			viewPartId : view_part_id
		}

		let uri_def = CMSVtex_general.get_url_base( config.account ) + '/admin/a/PortalManagement/DeleteCustomViewPart';

		let response_sync = request('POST',uri_def,{
			headers : {
				'Cookie' : CMSVtex_general.nameGeneralCookie + '=' + config.cookie,
				'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
			},
			body : querystring.stringify(data)
		} ,
		);

		let body = response_sync.body.toString();

		return (body == '');
	}

	/**
	 * @method save_object_html
	 * @desc Crea o actualiza un objeto de tipo html para un custom element determinado.
	 * @param {string} instance_id Identificador devuelto por Vtex y otros métodos de este módulo.
	 * @param {string} view_part_id Identificador devuelto por Vtex y otros métodos de este módulo.
	 * @param {string} info_new Configuración del nuevo objeto html.
	 * @param {string} [id_object] Identificador del objeto en caso de que la acción requerida sea una actualización
	 * @param {Object} config {account:'ex:chefcompany',cookie:'ex:...'}
	 * @return {string|Boolean} Devuelve true si Vtex no retornó ningún error de lo contrario retorna un string con el mensaje d error generado por Vtex
	 */
	cms_vtex_custom_elements.save_object_html = ( instance_id,view_part_id,info_new,id_object,config ) => {
		list_contents_add_us = (JSON.stringify(info_new).substr(0,1) == '{') ? new Array(info_new) : info_new
		list_contents_add_def = [];

		list_contents_add_us.forEach( ( new_content,index )=> {
			list_contents_add_def.push({
				ViewPartInstanceId : instance_id,
				Indice : index,
				ContentName : new_content.ContentName,
				Partner : (new_content.partner) ? new_content.partner : '',
				Campaign : (new_content.campaign) ? new_content.campaign : '',
				Category : (new_content.category) ? new_content.category : '',
				Brand : (new_content.brand) ? new_content.brand : '',
				Source : (new_content.source) ? new_content.source : '',
				Keyword : (new_content.keyword) ? new_content.keyword : '',
				Periods : (new_content.periods) ? new_content.periods : [],
				Active : (new_content.active) ? 'True' : 'False',
				FileName : '',
				Html : (new_content.Html) ? new_content.Html : ''
			} )
		} )

		if(id_object){
			let actual_objects = cms_vtex_custom_elements.get_list_objects( 'html',instance_id,config );

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
				Active : actual_objects[index_object_actual].active,
				FileName : '',
				Html :  actual_objects[index_object_actual].additional,
				Id : actual_objects[index_object_actual].id
			})

			list_contents_add_def[0].Indice = index_object_actual
			list_contents_add_def[0].Id = actual_objects[index_object_actual].id
		}

		let info_instance = cms_vtex_custom_elements.get_info_instance( instance_id,view_part_id,false,config );
		
		return cms_vtex_custom_elements.save('html',{
			customViewPartName : info_instance.name,
			customViewPartTagName : info_instance.tag_name,
			htmlContentList : list_contents_add_def,
			htmlContentListInicial : (typeof initial_content != 'undefined') ? initial_content : ''

		},view_part_id,instance_id,config)

	}

	/**
	 * @method save_object_coleccion
	 * @desc Crea o actualiza un objeto de tipo coleccion para un custom element determinado.
	 * @param {string} instance_id Identificador devuelto por Vtex y otros métodos de este módulo.
	 * @param {string} view_part_id Identificador devuelto por Vtex y otros métodos de este módulo.
	 * @param {string} info_new Configuración del nuevo objeto coleccion.
	 * @param {string} [id_object] Identificador del objeto en caso de que la acción requerida sea una actualización
	 * @param {Object} config {account:'ex:chefcompany',cookie:'ex:...'}
	 * @return {string|Boolean} Devuelve true si Vtex no retornó ningún error de lo contrario retorna un string con el mensaje d error generado por Vtex
	 */
	cms_vtex_custom_elements.save_object_coleccion = ( instance_id,view_part_id,info_new,id_object,config ) => {
		let actual_objects = cms_vtex_custom_elements.get_list_objects( 'coleccion',instance_id,config ),
			shelf_content_list = cms_vtex_custom_elements.generate_content_list_coleccion( actual_objects,instance_id,id_object )

		if(!id_object){
			shelf_content_list.push({
				ViewPartInstanceId : instance_id,
				Indice : actual_objects.length,
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

			//delete actual_objects.objects;
			//actual_objects.totalRows = actual_objects_length + 1
			contentList = JSON.stringify(shelf_content_list)
			contentListInicial = ''

			let info_instance = cms_vtex_custom_elements.get_info_instance( instance_id,view_part_id,true,config );

			//console.log( 'info instance',info_instance )
					
			return cms_vtex_custom_elements.save('coleccion',{
				customViewPartName : info_instance.name,
				customViewPartTagName : info_instance.tag_name,
				layout : info_instance.layout,
				colCount : info_instance.colCount,
				itemCount : info_instance.itemCount,
				showUnavailable : info_instance.showUnavailable,
				isRandomize : info_instance.isRandomize,
				isPaged : info_instance.isPaged,
				contentList : contentList,
				contentListInicial : ''

			},view_part_id,instance_id,config)
		}
		else{
			//console.log(actual_objects.objects)
			let index_object_actual = actual_objects.map( (actual_object) => {
				return actual_object.id
			}).indexOf( id_object )
			
			if(index_object_actual === -1){
				return 'este objeto no existe, paila :\'(';
			}
			else{
				if(actual_objects[index_object_actual].additional.ProductCluster){
					default_productoCluster = actual_objects[index_object_actual].additional.ProductCluster.id
				}
				else{
					default_productoCluster = ''
				}
				//console.log('el index encontrado es',index_object_actual)
				shelf_content_list[index_object_actual] = {
					ViewPartInstanceId : instance_id,
					Indice : index_object_actual,
					ContentName : (info_new.ContentName) ? info_new.ContentName : CMSVtex_general.get_html_entities(actual_objects[index_object_actual].name),
					Partner : (info_new.partner) ? info_new.partner : actual_objects[index_object_actual].partner,
					Campaign : (info_new.campaign) ? info_new.campaign : actual_objects[index_object_actual].campaign,
					Category : (info_new.category) ? info_new.category : actual_objects[index_object_actual].category,
					Brand : (info_new.brand) ? info_new.brand : actual_objects[index_object_actual].brand,
					Source : (info_new.source) ? info_new.source : actual_objects[index_object_actual].source,
					Keyword : (info_new.keyword) ? info_new.keyword : actual_objects[index_object_actual].keyword,
					Periods : (info_new.periods) ? info_new.periods : actual_objects[index_object_actual].period,
					Active : (typeof info_new.active !== 'undefined') ? info_new.active : actual_objects[index_object_actual].active,
					ProductCluster : (info_new.ProductCluster) ? info_new.ProductCluster : default_productoCluster,
					SearchQueryString : (info_new.SearchQueryString) ? info_new.SearchQueryString : actual_objects[index_object_actual].additional.queryString,
					Id : actual_objects[index_object_actual].id
				}

				//console.log(shelf_content_list)

				//actual_objects.totalRows = actual_objects_length + 1
				//actual_objects.contentList = JSON.stringify(shelf_content_list)
				//actual_objects.contentListInicial = JSON.stringify(initial_content_list)

				//return cms_vtex_layout.save_config_coleccion( instance_id,actual_objects )

				let info_instance = cms_vtex_custom_elements.get_info_instance( instance_id,view_part_id,true,config );

				//console.log( 'info instance',info_instance )
						
				return cms_vtex_custom_elements.save('coleccion',{
					customViewPartName : info_instance.name,
					customViewPartTagName : info_instance.tag_name,
					layout : info_instance.layout,
					colCount : info_instance.colCount,
					itemCount : info_instance.itemCount,
					showUnavailable : info_instance.showUnavailable,
					isRandomize : info_instance.isRandomize,
					isPaged : info_instance.isPaged,
					contentList : JSON.stringify(shelf_content_list),
					contentListInicial : JSON.stringify(initial_content_list)

				},view_part_id,instance_id,config)
			}

		}

		//return cms_vtex_layout.get_list_objects( 'coleccion',instance_id );
		
		//return body
	}

	/**
	 * @method delete_object_html
	 * @desc Elimina un objeto del tipo html de un custom element determinado.
	 * @param {string} instance_id Identificador devuelto por Vtex y otros métodos de este módulo.
	 * @param {string} view_part_id Identificador devuelto por Vtex y otros métodos de este módulo.
	 * @param {string} id_object Identificador del objeto que se quiere eliminar.
	 * @param {Object} config {account:'ex:chefcompany',cookie:'ex:...'}
	 * @return {string|Boolean} Devuelve true si Vtex no retornó ningún error de lo contrario retorna un string con el mensaje d error generado por Vtex
	 */
	cms_vtex_custom_elements.delete_object_html = ( instance_id,view_part_id,id_object,config ) => {
		let actual_objects = cms_vtex_custom_elements.get_list_objects( 'html',instance_id,config ),
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

		let info_instance = cms_vtex_custom_elements.get_info_instance( instance_id,view_part_id,false,config );
		
		return cms_vtex_custom_elements.save('html',{
			customViewPartName : info_instance.name,
			customViewPartTagName : info_instance.tag_name,
			htmlContentList : html_content_list,
			htmlContentListInicial : initial_content_list
		},view_part_id,instance_id,config)
	}

	/**
	 * @method delete_object_coleccion
	 * @desc Elimina un objeto del tipo coleccion de un custom element determinado.
	 * @param {string} instance_id Identificador devuelto por Vtex y otros métodos de este módulo.
	 * @param {string} view_part_id Identificador devuelto por Vtex y otros métodos de este módulo.
	 * @param {string} id_object Identificador del objeto que se quiere eliminar.
	 * @param {Object} config {account:'ex:chefcompany',cookie:'ex:...'}
	 * @return {string|Boolean} Devuelve true si Vtex no retornó ningún error de lo contrario retorna un string con el mensaje d error generado por Vtex
	 */
	cms_vtex_custom_elements.delete_object_coleccion = ( instance_id,view_part_id,id_object,config ) => {
		let actual_objects = cms_vtex_custom_elements.get_list_objects( 'coleccion',instance_id,config );
		console.log(actual_objects)
		let index_object = actual_objects.map( ( actual_object ) => {
			return actual_object.id;
		}).indexOf( id_object );

		if(index_object === -1){
			return 'Este objeto no existe, al menos no en esta instancia (?)';
		}
		else{
			let contentList = actual_objects
			let contentListInicial = actual_objects.slice()
			contentList.splice( index_object,1 );
			console.log(contentList,contentListInicial)

			let info_instance = cms_vtex_custom_elements.get_info_instance( instance_id,view_part_id,true,config );
			return cms_vtex_custom_elements.save('coleccion',{
				customViewPartName : info_instance.name,
				customViewPartTagName : info_instance.tag_name,
				layout : info_instance.layout,
				colCount : info_instance.colCount,
				itemCount : info_instance.itemCount,
				showUnavailable : info_instance.showUnavailable,
				isRandomize : info_instance.isRandomize,
				isPaged : info_instance.isPaged,
				contentList : JSON.stringify(contentList),
				contentListInicial : JSON.stringify(contentListInicial)

			},view_part_id,instance_id,config)
			//return cms_vtex_layout.save_config_coleccion( instance_id,actual_objects,true,true )
		}
	}

	return cms_vtex_custom_elements;
})()