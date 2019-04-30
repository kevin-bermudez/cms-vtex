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

	cms_vtex_custom_elements.save = ( instance_type,info_new,view_part_id,instance_id ) => {
		//instance_id = ''
		let data = {
			viewPartInstanceId : (instance_id) ? instance_id : '',
			FormHtmlConfigId : (instance_id) ? instance_id : '',
			totalRows : 0,
			htmlContentList : "",
			htmlContentListInicial : "",
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

	return cms_vtex_custom_elements;
}( exports )