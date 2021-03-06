//Dependencias
const request = require('sync-request');
const cheerio = require('cheerio');
const querystring = require('querystring');
const form_data = require('form-data');
const fs = require('fs');
const path = require('path');
const CMSVtex_general = require('./CMSVtex_general');

/**
 * File.
 * @module file
 * @since 1.0.0
 * @desc Este módulo es util para manipular los archivos que se encuentran en el CMS tales como:css, javascript e imágenes
 */
module.exports = (function(){
	cms_vtex_file = exports;
	/**
	 * @method get_list
	 * @desc Obtiene la lista de archivos de un tipo determinado que se encuentra en el CMS de vtex.
	 * @param {string} file_type Tipo de archivo del que se quiere obtener la lista:css,js o images.
	 * @param {integer} [quantity_files_us=200000000] Cantidad de archivos que se quiere obtener.
	 * @param {integer} [page_us=1] Valor para el paginador de resultados
	 * @param {Object} config {account:'ex:chefcompany',cookie:'ex:...'}
	 * @return {Object[]} Lista de archivos con id,nombre y extensión.
	 */
	cms_vtex_file.get_list = ( file_type,quantity_files_us,page_us,config ) => {
		let data = {
			page : (page_us) ? page_us : 1,
			rp : (quantity_files_us) ? quantity_files_us : 200000000,
			sortname : "IdArquivo",
		}

		//console.log('data is',CMSVtex_general.cookie_vtex)

		let uri_def = CMSVtex_general.get_url_base( config.account ) + 'admin/a/PortalManagement/HandleFileListByType/?siteId=undefined&fileType=' + file_type  + '&' + querystring.stringify(data)

		var response_sync = request('POST', uri_def,{
			headers : {
				'Cookie' : CMSVtex_general.nameGeneralCookie + '=' + config.cookie,
				'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
			},
			body : querystring.stringify(data)
		} ,
		);
		//console.log('string body is',response_sync.body.toString(),uri_def)
		return JSON.parse(response_sync.body.toString()).rows
	}

	/**
	 * @method get_file
	 * @desc Obtiene el contenido de un arhivo desde Vtex.
	 * @param {integer} id Id del archivo asignado desde Vtex.
	 * @param {string} type El tipo de archivo que quiero obtener:css,js o image.
	 * @param {Object} config {account:'ex:chefcompany',cookie:'ex:...'}
	 * @return {Object} object Cuando es un archivo js o css devuelve el id del archivo y su contenido, cuando es una imagen devuelve un objeto con el id del archivo y un buffer de información que puede ser escrito en un archivo con la función writeFile del módulo fs.
	 */
	cms_vtex_file.get_file = ( id,type,config ) => {
		if(isNaN(parseInt(id))){
			url_test = id
			uri_def = CMSVtex_general.get_url_arquivos( config.account ) + '/' + id
		}
		else{
			url_test = 'ids/' + id
			uri_def = CMSVtex_general.get_url_arquivos( config.account ) + '/ids/' + id
		}

		if(cms_vtex_file.file_exist( url_test )){
			let response_sync = request('GET',uri_def,{
				headers : {
					'Cookie' : CMSVtex_general.nameGeneralCookie + '=' + config.cookie,
					'Content-Type' : 'text'
				}
			})

			//console.log(response_sync)
			if(response_sync.statusCode > 300){
				//console.log(response_sync)	
			}

			if(type != 'image'){
				body = response_sync.body.toString();
			}		
			else{
				body = response_sync.body;
			}
			return {
				id,
				content : body
			}
		}
		else{
			return {
				error : true
			}
		}
	}

	cms_vtex_file.get_request_token = ( config ) => {
		let uri_def = CMSVtex_general.get_url_base( config.account ) + '/admin/a/PortalManagement/AddFile?fileType=css';

		let response_sync = request('POST',uri_def,{
			headers : {
				'Cookie' : CMSVtex_general.nameGeneralCookie + '=' + config.cookie,
				'Content-Type' : 'text/html'
			}
		})

		let body = response_sync.body.toString();

		$ = cheerio.load(body);

		let request_token = $('#fileUploadRequestToken').attr('value')

		return request_token;
	}

	/**
	 * @method file_exist
	 * @desc Determina si un archivo existe en el CMS de Vtex.
	 * @param {string} name_file Nombre del arhivo que quiero comprobar con su extensión respectiva.
	 * @param {Object} config {account:'ex:chefcompany',cookie:'ex:...'}
	 * @return {Boolean} true -> si existe el archivo, false -> si no existe el archivo
	 */
	cms_vtex_file.file_exist = ( name_file,config ) => {
		//let uri_def = CMSVtex_general.url_base + '/admin/a/FilePicker/FileExists?changedFileName=' + name_file;
		let uri_def = CMSVtex_general.get_url_arquivos( config.account ) + '/' + name_file
		let data = {
			fileName : name_file,
			folder : '/admin/uploads'
		}

		let response_sync = request('GET',uri_def,{
			headers : {
				'Cookie' : CMSVtex_general.nameGeneralCookie + '=' + config.cookie,
				'Content-Type' : 'text/html'
			},
		})

		return (response_sync.statusCode == 200)
	}

	/**
	 * @method upload
	 * @desc Carga un nuevo archivo en el CMS de Vtex.
	 * @param {string} filepath Url que apunta a donde se encuentra el archivo a subir.
	 * @param {Object} config {account:'ex:chefcompany',cookie:'ex:...'}
	 * @return {Promise} Resuelve devolviendo success si el código de respuesta es igual a 200 de lo contrario rechaza
	 */
	cms_vtex_file.upload = async ( filepath,config ) => {
		try {
		  const form = new form_data()
		  form.append('Filename', filepath)
		  form.append('fileext', '*.jpg;*.png;*.gif;*.jpeg;*.ico;*.js;*.css')
		  form.append('folder', '/uploads')
		  form.append('Upload', 'Submit Query')
		  form.append('requestToken', cms_vtex_file.get_request_token( config ))
		  form.append('Filedata', fs.createReadStream(filepath))

		  const response = await new Promise((resolve, reject) => {
		    form.submit({
		      host : CMSVtex_general.get_host(config.account),
		      protocol:'https:',
		      'path': '/admin/a/FilePicker/UploadFile',
		      'headers': {
		        'Cookie': CMSVtex_general.nameGeneralCookie + '=' + config.cookie,
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

	/**
	 * @method update
	 * @desc Modifica un archivo que ya se encuentra en el CMS de Vtex.
	 * @param {string} name_file Nombre del archivo a modificar con la extensión incluida.
	 * @param {string} file_path Ruta a donde se encuentra el archivo nuevo, incluido nombre y extensión del mismo.
	 * @param {Object} config {account:'ex:chefcompany',cookie:'ex:...'}
	 * @return {Promise} Devuelve una promesa igual que la del método upload si el archivo existe, de lo contrario una con el mensaje de que el archivo no existe.
	 */
	cms_vtex_file.update = ( name_file,file_path,config ) => {
		if(cms_vtex_file.file_exist(name_file)){
			return cms_vtex_file.upload( file_path,config );
		}
		else{
			return new Promise((resolve,reject) => {
				resolve('Lo siento este archivo no existe :\'( intente crearlo');
			})
		}
	}

	/**
	 * @method delete
	 * @desc Elimina un archivo del CMS de Vtex.
	 * @param {integer} id_file Id del archivo asignado por el CMS de Vtex.
	 * @param {string} file_type Tipo de archivo a eliminar:css,js o image
	  * @param {Object} config {account:'ex:chefcompany',cookie:'ex:...'}
	 * @return {string|boolean} Retorna verdadero o un mensaje con el error arrojado por Vtex.
	 */
	cms_vtex_file.delete = ( id_file,file_type,config ) => {
		let uri_def = CMSVtex_general.get_url_base( config.account ) + '/admin/a/PortalManagement/DeleteFile?fileId=' + id_file + '&fileType=' + file_type

		var response_sync = request('POST', uri_def,{
			headers : {
				'Cookie' : CMSVtex_general.nameGeneralCookie + '=' + config.cookie,
				'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
			}
		} ,
		);
			
		$ = cheerio.load(response_sync.body.toString())	

		return ($('title').text().trim() == 'VTEX ID Authentication') ? true : $('title');
	}

	return cms_vtex_file
})()