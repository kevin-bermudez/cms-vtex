//Dependencias
const request = require('sync-request');
const cheerio = require('cheerio');
const querystring = require('querystring');
const CMSVtex_general = require('./CMSVtex_general');
const CMSVtex_layout = require('./CMSVtex_layout');
//var http = require('http');
const fs = require('fs');
const path = require('path');

module.exports = function( cms_vtex_custom_elements ){
	cms_vtex_custom_elements.get_list_objects = ( instance_type,instance_id ) => {
		//si es HTML
		let uri_def = CMSVtex_general.url_base + '/admin/a/PortalManagement/GetFormHtmlConfig?viewInstanceId=' + instance_id
		data = {
			isCustomViewPart : 'True'
		}
		let response_sync = request('POST',uri_def,{
				headers : {
					'Cookie' : CMSVtex_general.cookie_vtex,
					'Content-Type' : "application/x-www-form-urlencoded; charset=UTF-8"
				},
				body : querystring.stringify(data)
			})

		let body = response_sync.body.toString();
			
		return CMSVtex_general.get_content_object( body,instance_type );
	}

	cms_vtex_custom_elements.get = ( quantity_elements_us,width_content ) => {
		let uri_def = CMSVtex_general.url_base + 'admin/a/PortalManagement/HandleCustomViewPartList/?siteId=';

		let data = {
			page : 1,
			rp : (quantity_elements_us) ? quantity_elements_us : 200000000,
			sortname : "Id",
		}

		var response_sync = request('POST', uri_def,{
			headers : {
				'Cookie' : CMSVtex_general.cookie_vtex,
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
				var_return[var_return.length - 1].objects = cms_vtex_custom_elements.get_list_objects( response_vtex[index].cell[4],response_vtex[index].cell[1] );
			}
		}
		
		return var_return;

	}

	cms_vtex_custom_elements.get_info_instance = ( instance_id,view_part_id ) => {
		let uri_def = CMSVtex_general.url_base + '/admin/a/PortalManagement/AddCustomViewPart?siteId=&customViewPartId=' + instance_id + '&viewPartId=' + view_part_id

		let response_sync = request('GET',uri_def,{
				headers : {
					'Cookie' : CMSVtex_general.cookie_vtex,
					'Content-Type' : "application/x-www-form-urlencoded; charset=UTF-8"
				}
			})

		let body = response_sync.body.toString();
		let $ = cheerio.load(body);
		//console.log(body)
		return {
			name : $('#customViewPartNameOut').attr('value').trim(),
			tag_name : $('#customViewPartTagNameOut').attr('value').trim(),
			instance_id,
			view_part_id
		};
	}

	cms_vtex_custom_elements.save = ( instance_type,info_new,view_part_id,instance_id ) => {
		//instance_id = ''
		let data = {
			viewPartInstanceId : (instance_id) ? instance_id : '',
			FormHtmlConfigId : (instance_id) ? instance_id : '',
			totalRows : 0,
			htmlContentList : (info_new.htmlContentList) ? JSON.stringify(info_new.htmlContentList) : "",
			htmlContentListInicial : (info_new.htmlContentListInicial) ? JSON.stringify(info_new.htmlContentListInicial) : "",
			isCustomViewPart : 'True',
			customViewPartName : info_new.customViewPartName,
			customViewPartTagName : info_new.customViewPartTagName,
			customViewPartTypeId : CMSVtex_general.get_type_control( false,instance_type ),
			customViewPartisPersisted : (view_part_id) ? 'True' : 'False',
			categoryIdSelected : (info_new.categoryIdSelected) ? info_new.categoryIdSelected : '',
			categoryNameSelected : (info_new.categoryNameSelected) ? info_new.categoryNameSelected : ''
		}

		if(view_part_id){
			data.customViewPartId = instance_id;
			data.viewPartId = view_part_id;
		}

		console.log(data)

		let uri_def = CMSVtex_general.url_base + 'admin/a/PortalManagement/SaveHtmlConfig'

		let sync_response = request('POST',uri_def,{
			headers : {
				'Cookie' : CMSVtex_general.cookie_vtex,
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

	cms_vtex_custom_elements.add = ( instance_type,info_new ) => {
		return cms_vtex_custom_elements.save( instance_type,info_new );
	}

	cms_vtex_custom_elements.update = ( instance_type,info_new,view_part_id,instance_id ) => {
		return cms_vtex_custom_elements.save( instance_type,info_new,view_part_id,instance_id );
	}

	cms_vtex_custom_elements.delete = ( view_part_id,custom_view_part_id ) => {
		let data = {
			textConfirm : 'yes',
			customViewPartId : custom_view_part_id,
			viewPartId : view_part_id
		}

		let uri_def = CMSVtex_general.url_base + 'admin/a/PortalManagement/DeleteCustomViewPart';

		let response_sync = request('POST',uri_def,{
			headers : {
				'Cookie' : CMSVtex_general.cookie_vtex,
				'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
			},
			body : querystring.stringify(data)
		} ,
		);

		let body = response_sync.body.toString();

		return (body == '');
	}

	cms_vtex_custom_elements.save_object_html = ( instance_id,view_part_id,info_new,id_object ) => {
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
			let actual_objects = cms_vtex_custom_elements.get_list_objects( 'html',instance_id );

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

		let info_instance = cms_vtex_custom_elements.get_info_instance( instance_id,view_part_id );
		
		return cms_vtex_custom_elements.save('html',{
			customViewPartName : info_instance.name,
			customViewPartTagName : info_instance.tag_name,
			htmlContentList : list_contents_add_def,
			htmlContentListInicial : (typeof initial_content != 'undefined') ? initial_content : ''

		},view_part_id,instance_id)

	}

	cms_vtex_custom_elements.delete_object_html = ( instance_id,view_part_id,id_object ) => {
		let actual_objects = cms_vtex_custom_elements.get_list_objects( 'html',instance_id ),
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

		let info_instance = cms_vtex_custom_elements.get_info_instance( instance_id,view_part_id );
		
		return cms_vtex_custom_elements.save('html',{
			customViewPartName : info_instance.name,
			customViewPartTagName : info_instance.tag_name,
			htmlContentList : html_content_list,
			htmlContentListInicial : initial_content_list
		},view_part_id,instance_id)
	}

	return cms_vtex_custom_elements;
}( exports )