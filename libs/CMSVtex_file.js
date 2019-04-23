//Dependencias
const request = require('sync-request');
const cheerio = require('cheerio');
const querystring = require('querystring');
const CMSVtex_general = require('./CMSVtex_general');
const image_downloader = require('image-downloader');
const form_data = require('form-data');
//var http = require('http');
const fs = require('fs');
const path = require('path');

module.exports = function( cms_vtex_file ){

	cms_vtex_file.get_file = ( id,type,ext,dest ) => {
		

		if(type == 'css' || type == 'js' || typeof type === 'undefined'){
			if(isNaN(parseInt(id))){
				uri_def = CMSVtex_general.url_arquivos + '/' + id
			}
			else{
				uri_def = CMSVtex_general.url_arquivos + '/ids/' + id
			}

			let response_sync = request('GET',uri_def,{
				headers : {
					'Cookie' : CMSVtex_general.cookie_vtex,
					'Content-Type' : 'text'
				}
			})

			console.log(response_sync)

			let body = response_sync.body.toString()

			return {
				id,
				content : body
			}
		}
		else{
			let dest_exist = fs.existsSync( dest );

			if(dest_exist){
				console.log('si existe');
			}
			else{
				console.log('aún no existe');
				fs.mkdirSync( dest )
			}

		  	const options = {
		  	  url: CMSVtex_general.url_arquivos + '/ids/' + id + '.' + ext,
		  	  dest: dest
		  	}			
			 
			return image_downloader.image(options);			 
		}

	}

	cms_vtex_file.get_list = ( file_type,quantity_files_us ) => {
		let data = {
			page : 1,
			rp : (quantity_files_us) ? quantity_files_us : 200,
			sortname : "IdArquivo",
		}

		let uri_def = CMSVtex_general.url_base + 'admin/a/PortalManagement/HandleFileListByType/?siteId=undefined&fileType=' + file_type

		var response_sync = request('POST', uri_def,{
			headers : {
				'Cookie' : CMSVtex_general.cookie_vtex,
				'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
			},
			body : querystring.stringify(data)
		} ,
		);
		
		return JSON.parse(response_sync.body.toString()).rows
	}

	cms_vtex_file.get_request_token = () => {
		let uri_def = CMSVtex_general.url_base + '/admin/a/PortalManagement/AddFile?fileType=css';

		let response_sync = request('POST',uri_def,{
			headers : {
				'Cookie' : CMSVtex_general.cookie_vtex,
				'Content-Type' : 'text/html'
			}
		})

		let body = response_sync.body.toString();

		$ = cheerio.load(body);

		let request_token = $('#fileUploadRequestToken').attr('value')

		return request_token;
	}

	cms_vtex_file.file_exist = ( name_file ) => {
		let uri_def = CMSVtex_general.url_base + '/admin/a/FilePicker/FileExists?changedFileName=';

		let data = {
			DIPPKP : name_file,
			folder : '/admin/uploads'
		}

		let response_sync = request('POST',uri_def,{
			headers : {
				'Cookie' : CMSVtex_general.cookie_vtex,
				'Content-Type' : 'text/html'
			},
			body : querystring.stringify( data )
		})

		let body = response_sync.body.toString();

		console.log(body);
	}

	cms_vtex_file.upload = async ( filepath ) => {
		try {
		  const form = new form_data()
		  form.append('Filename', filepath)
		  form.append('fileext', '*.jpg;*.png;*.gif;*.jpeg;*.ico;*.js;*.css')
		  form.append('folder', '/uploads')
		  form.append('Upload', 'Submit Query')
		  form.append('requestToken', cms_vtex_file.get_request_token())
		  form.append('Filedata', fs.createReadStream(filepath))

		  const response = await new Promise((resolve, reject) => {
		    form.submit({
		      host : CMSVtex_general.host,
		      protocol:'https:',
		      'path': '/admin/a/FilePicker/UploadFile',
		      'headers': {
		        'Cookie': CMSVtex_general.cookie_vtex,
		        'Content-Type': form.getHeaders()['content-type'],
		      }
		    }, (err, res) => {
		      if (err) reject(err)
		      else if(res.statusCode > parseInt(200)) reject(false)
		      resolve('success')
		    })
		  })

		  return response
		} catch(err) { return err }
	}

	cms_vtex_file.delete = ( id_file,file_type ) => {
		let uri_def = CMSVtex_general.url_base + 'admin/a/PortalManagement/DeleteFile?fileId=' + id_file + '&fileType=' + file_type

		var response_sync = request('POST', uri_def,{
			headers : {
				'Cookie' : CMSVtex_general.cookie_vtex,
				'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
			}
		} ,
		);
		
		return response_sync.body.toString();
	}

	return cms_vtex_file
}( exports )