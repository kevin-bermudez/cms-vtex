//Dependencias
const entities = require('html-entities').XmlEntities;
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

module.exports = (function( cms_vtex_general ){
	file_config = JSON.parse(fs.readFileSync( path.join( __dirname,'../config.json' ),'utf8' ));

	//cookie de autenticación
	cms_vtex_general.cookie_vtex = 'VtexIdclientAutCookie='
	cms_vtex_general.cookie_vtex += file_config.cookie_vtex

	//nombre de la cuenta a la que me voy a conectar
	cms_vtex_general.account_name = 'chefcompany';

	//url relativa donde están almacenados los templates y folders localmente
	cms_vtex_general.url_src = './src';

	//host base
	cms_vtex_general.host = cms_vtex_general.account_name + '.vtexcommercestable.com.br';

	//url base para las peticiones al CMS de Vtex
	cms_vtex_general.url_base = 'https://' + cms_vtex_general.host + '/';

	//url arquivos
	cms_vtex_general.url_arquivos = 'https://' + cms_vtex_general.account_name + '.vteximg.com.br/arquivos'

	//reemplaza las etiquetas html escapadas en una cadena por su respectiva entidad
	cms_vtex_general.get_html_entities = ( html_content ) => {
		return entities.decode(html_content).replace(new RegExp('&amp;', 'g'),'&')
	}

	//reemplaza entidades html por etiquetas escapadas
	cms_vtex_general.html_entities_encode = ( html_content ) => {
		return entities.encode(html_content).replace(new RegExp('&', 'g'),'&amp;')
	}

	//obtiene el contenido de un objeto sea de un placeholder o custom element
	cms_vtex_general.get_content_object = ( body,instance_type ) => {
		let $ = cheerio.load(body),
			return_var = []
		
		if($('.divFieldSetHtmlDataRow').length > 0){
			$('.divFieldSetHtmlDataRow').each(function(){

				let periods = []
				if($(this).find('#period').text().trim() != ''){
					$(this).find('#period .periodDateItens').each(function(){
						periods.push({
							from : $(this).attr('datetimefrom'),
							to : $(this).attr('datetimeto')
						})
					})
				}
				//console.log('este es el tipo',(instance_type === 'html'),'html',instance_type)
				//let string_compare = new String(instance_type)
				//console.log(instance_type.toLowerCase())
				if(instance_type.toLowerCase().trim() ==='html'){
					additional = cms_vtex_general.get_html_entities($(this).find('#html a').attr('title'))
				}

				return_var.push({
					    name : $(this).find('#contentName textarea').html(),
					    id : $(this).find('#id').text().trim(),
					    partner : $(this).find('#partner textarea').html(),
					    campaign : $(this).find('#partner textarea').html(),
					    category : $(this).find('#category').text().trim(),
					    brand : $(this).find('#brand').text().trim(),
					    source : $(this).find('#source textarea').html(),
					    keyword : $(this).find('#keyword textarea').html().trim(),
					    period : periods,
					    active : ($(this).find('#active input').attr('checked')) ? true : false,
					    additional : additional
				})
			})
		}

		return return_var;
	}

	//devuelve el id o nombre del tipo de control
	cms_vtex_general.get_type_control = ( id_type,name_type ) => {
		types_pred = [
			{
				id : '28488dba-be4f-4ba3-a0e0-355e6a86d406',
				name : 'html'
			},
			{
				id : '1a3c6f6c-854a-4223-8ff1-0e16e11144af',
				name : 'banner-html'
			},
			{
				id : '2a673f22-79a1-4519-93bc-7d30edd9e2c2',
				name : 'coleccion'
			},
			{
				id : '71cf9b9e-81ec-44cc-af38-e6a9161650c7',
				name : 'banner'
			}
		]
		if(name_type){
			search_expression = 'index_type = types_pred.map( (type_pred)=>{return type_pred.name} ).indexOf(name_type)'
			return_expression = 'types_pred[index_type].id'
		}
		else{
			search_expression = 'index_type = types_pred.map( (type_pred)=>{return type_pred.id} ).indexOf(id_type)'
			return_expression = 'types_pred[index_type].name'
		}

		eval( search_expression )

		if(index_type !== -1){
			return eval( return_expression )
		}	
		else{
			return false;
		}
	}

	return cms_vtex_general;
})( exports )