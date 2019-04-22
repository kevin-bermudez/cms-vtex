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

	cms_vtex_file.upload = () => {
		var fs = require("fs");
		var request = require("request");

		var options = { method: 'POST',
		  url: 'https://chefcompany.vtexcommercestable.com.br/admin/a/FilePicker/UploadFile',
		  headers: 
		   { 'Postman-Token': '310ae978-066b-4682-be54-498704a63a0e',
		     'cache-control': 'no-cache',
		     Connection: 'keep-alive',
		     'content-length': '801',
		     'accept-encoding': 'gzip, deflate',
		     Host: 'chefcompany.vtexcommercestable.com.br',
		     Accept: '*/*',
		     'User-Agent': 'PostmanRuntime/7.11.0',
		     'Content-Type': 'application/x-www-form-urlencoded',
		     Cookie: 'VtexIdclientAutCookie=eyJhbGciOiJFUzI1NiIsImtpZCI6IkMwNzI5NzczNkM5NzRGNUM4MTZGQkY5MTlCRTlFQTk1MDE0MEMyNDAiLCJ0eXAiOiJqd3QifQ.eyJzdWIiOiJrYmVybXVkZXNAY2hlZmNvbXBhbnkuY28iLCJhY2NvdW50IjoiX192dGV4X2FkbWluIiwic2NvcGUiOiJjaGVmY29tcGFueTphZG1pbiIsImF1dGhvcml6YWJsZXMiOlsidnJuOmlhbTpfX3Z0ZXhfYWRtaW46dXNlcnMva2Jlcm11ZGVzQGNoZWZjb21wYW55LmNvIl0sImV4cCI6MTU1NjAyNTcyMSwib0F1dGhVc2VySW5mbyI6MTA1MjkyNzMsIm9BdXRoVXNlckluZm9MaXN0IjpbMTA1MjkyNzNdLCJ1c2VySWQiOiI2NTdlZDIwNC03ZWQxLTQ0MjItOGY0MC0wMzFhZTRiYmM2ODMiLCJhdXRoX2x2bCI6InN0cm9uZyIsImlhdCI6MTU1NTkzOTMyMSwiaXNzIjoidG9rZW4tZW1pdHRlciIsImp0aSI6IjMxZDYwNjZiLWIwZjktNDVmNC1iOTlkLTM5MTU0ZGQ1NTc0ZiJ9.Z5MkxsXqJS4BQ4yLraNumB7Q7nz1X6VKnineQmWaJUshVnGigMJXZOW-gij9TDg5KFyfqej_Yz8Y8GpKJvE1PQ,VtexIdclientAutCookie=eyJhbGciOiJFUzI1NiIsImtpZCI6IkMwNzI5NzczNkM5NzRGNUM4MTZGQkY5MTlCRTlFQTk1MDE0MEMyNDAiLCJ0eXAiOiJqd3QifQ.eyJzdWIiOiJrYmVybXVkZXNAY2hlZmNvbXBhbnkuY28iLCJhY2NvdW50IjoiX192dGV4X2FkbWluIiwic2NvcGUiOiJjaGVmY29tcGFueTphZG1pbiIsImF1dGhvcml6YWJsZXMiOlsidnJuOmlhbTpfX3Z0ZXhfYWRtaW46dXNlcnMva2Jlcm11ZGVzQGNoZWZjb21wYW55LmNvIl0sImV4cCI6MTU1NjAyNTcyMSwib0F1dGhVc2VySW5mbyI6MTA1MjkyNzMsIm9BdXRoVXNlckluZm9MaXN0IjpbMTA1MjkyNzNdLCJ1c2VySWQiOiI2NTdlZDIwNC03ZWQxLTQ0MjItOGY0MC0wMzFhZTRiYmM2ODMiLCJhdXRoX2x2bCI6InN0cm9uZyIsImlhdCI6MTU1NTkzOTMyMSwiaXNzIjoidG9rZW4tZW1pdHRlciIsImp0aSI6IjMxZDYwNjZiLWIwZjktNDVmNC1iOTlkLTM5MTU0ZGQ1NTc0ZiJ9.Z5MkxsXqJS4BQ4yLraNumB7Q7nz1X6VKnineQmWaJUshVnGigMJXZOW-gij9TDg5KFyfqej_Yz8Y8GpKJvE1PQ; ISSMB=ScreenMedia=0&UserAcceptMobile=False; IPI=UsuarioGUID=657ed204-7ed1-4422-8f40-031ae4bbc683; SGTS=D00BEE0930A6EE45B080F807830D3653; SGTP=UGUIDReturn=True',
		     'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' },
		  formData: 
		   { Filename: 'test-add-2.css',
		     fileext: '*.jpg;*.png;*.gif;*.jpeg;*.ico;*.js;*.css',
		     folder: '/uploads',
		     requestToken: '5JUBLKEBLEPTMD5DPVKOLJ2Z0X1E0T1V0D1I0R1E0K1C0I1P0E1L0I1F636915502666910432',
		     Filedata: 
		      { value: 'fs.createReadStream("/Users/kevinbermudez/Documents/Proyectos/pruebas-html/cms-vtex-chef/templates/test.css")',
		        options: 
		         { filename: '/Users/kevinbermudez/Documents/Proyectos/pruebas-html/cms-vtex-chef/templates/test.css',
		           contentType: null } } } };

		request(options, function (error, response, body) {
		  if (error) throw new Error(error);

		  console.log(body);
		});

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