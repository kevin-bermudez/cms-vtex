//Dependencias
const entities = require('html-entities').XmlEntities;
const fs = require('fs');
const path = require('path')

module.exports = (function( cms_vtex_general ){
	file_config = JSON.parse(fs.readFileSync( path.join( __dirname,'../config.json' ),'utf8' ));

	//cookie de autenticación
	cms_vtex_general.cookie_vtex = 'VtexIdclientAutCookie='
	cms_vtex_general.cookie_vtex += file_config.cookie_vtex

	//nombre de la cuenta a la que me voy a conectar
	cms_vtex_general.account_name = 'chefcompany';

	//url relativa donde están almacenados los templates y folders localmente
	cms_vtex_general.url_src = './src';

	//url base para las peticiones al CMS de Vtex
	cms_vtex_general.url_base = 'https://' + cms_vtex_general.account_name + '.vtexcommercestable.com.br/';

	//reemplaza las etiquetas html escapadas en una cadena por su respectiva entidad
	cms_vtex_general.get_html_entities = ( html_content ) => {
		return entities.decode(html_content).replace(new RegExp('&amp;', 'g'),'&')
	}

	//reemplaza entidades html por etiquetas escapadas
	cms_vtex_general.html_entities_encode = ( html_content ) => {
		return entities.encode(html_content).replace(new RegExp('&', 'g'),'&amp;')
	}

	return cms_vtex_general;
})( exports )