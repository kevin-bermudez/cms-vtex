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

/**
 * File.
 * @module file
 * @since 1.0.0
 * @desc Este módulo es util para manipular los archivos que se encuentran en el CMS tales como:css, javascript e imágenes
 */
module.exports = function( cms_vtex_file ){
	/**
	 * @method get_list
	 * @desc Obtiene la lista de archivos de un tipo determinado que se encuentra en el CMS de vtex.
	 * @param {string} file_type Tipo de archivo del que se quiere obtener la lista:css,js o images.
	 * @param {integer} [quantity_files_us=200000000] Cantidad de archivos que se quiere obtener.
	 * @return {Object[]} Lista de archivos con id,nombre y extensión.
	 */
	cms_vtex_file.get_list = ( file_type,quantity_files_us ) => {
		let data = {
			page : 1,
			rp : (quantity_files_us) ? quantity_files_us : 200000000,
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

	/**
	 * @method get_file
	 * @desc Obtiene el contenido de un arhivo desde Vtex si es css o js y lo descarga si es una imagen.
	 * @param {integer} id Id del archivo asignado desde Vtex.
	 * @param {string} type El tipo de archivo que quiero obtener:css,js o image.
	 * @param {string} [ext] Se pasa cuando el tipo de archivo es image, significa su extensión:jpg,png,gif,jpeg,ico
	 * @param {string} [dest] Se pasa cuando el tipo de archivo es image con la ruta donde se va a descargar la misma
	 * @return {Object} object Cuando es un archivo js o css devuelve el id del archivo y su contenido, cuando es una imagen devuelve un objeto con la respuesta de descarga de la misma.
	 */
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
			if(response_sync.statusCode > 300){
				console.log(response_sync)	
			}

			let body = response_sync.body.toString()

			return {
				id,
				content : body
			}
		}
		else{
			let dest_exist = fs.existsSync( dest );

			if(dest_exist){
				//console.log('si existe');
			}
			else{
				fs.mkdirSync( dest )
			}

		  	const options = {
		  	  url: CMSVtex_general.url_arquivos + '/ids/' + id + '.' + ext,
		  	  dest: dest
		  	}			
			 
			return image_downloader.image(options);			 
		}

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

	/**
	 * @method file_exist
	 * @desc Determina si un archivo existe en el CMS de Vtex.
	 * @param {string} name_file Nombre del arhivo que quiero comprobar con su extensión respectiva.
	 * @return {Boolean} true -> si existe el archivo, false -> si no existe el archivo
	 */
	cms_vtex_file.file_exist = ( name_file ) => {
		//let uri_def = CMSVtex_general.url_base + '/admin/a/FilePicker/FileExists?changedFileName=' + name_file;
		let uri_def = CMSVtex_general.url_arquivos + '/' + name_file
		let data = {
			fileName : name_file,
			folder : '/admin/uploads'
		}

		let response_sync = request('GET',uri_def,{
			headers : {
				'Cookie' : CMSVtex_general.cookie_vtex,
				'Content-Type' : 'text/html'
			},
		})

		return (response_sync.statusCode == 200)
	}

	/**
	 * @method upload
	 * @desc Carga un nuevo archivo en el CMS de Vtex.
	 * @param {string} filepath Url que apunta a donde se encuentra el archivo a subir.
	 * @return {Promise} Resuelve devolviendo success si el código de respuesta es igual a 200 de lo contrario rechaza
	 */
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

	/**
	 * @method update
	 * @desc Modifica un archivo que ya se encuentra en el CMS de Vtex.
	 * @param {string} name_file Nombre del archivo a modificar con la extensión incluida.
	 * @param {string} file_path Ruta a donde se encuentra el archivo nuevo, incluido nombre y extensión del mismo.
	 * @return {Promise} Devuelve una promesa igual que la del método upload si el archivo existe, de lo contrario una con el mensaje de que el archivo no existe.
	 */
	cms_vtex_file.update = ( name_file,file_path ) => {
		if(cms_vtex_file.file_exist(name_file)){
			return cms_vtex_file.upload( file_path );
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
	 * @param {file_type} Tipo de archivo a eliminar:css,js o image
	 * @return {Promise} Devuelve una promesa igual que la del método upload si el archivo existe, de lo contrario una con el mensaje de que el archivo no existe.
	 */
	cms_vtex_file.delete = ( id_file,file_type ) => {
		let uri_def = CMSVtex_general.url_base + 'admin/a/PortalManagement/DeleteFile?fileId=' + id_file + '&fileType=' + file_type

		var response_sync = request('POST', uri_def,{
			headers : {
				'Cookie' : CMSVtex_general.cookie_vtex,
				'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
			}
		} ,
		);
			
		$ = cheerio.load(response_sync.body.toString())	

		return ($('title').text().trim() == 'VTEX ID Authentication') ? true : $('title');
	}

	return cms_vtex_file
}( exports )