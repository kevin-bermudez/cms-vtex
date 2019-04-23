const CMSVtex = require('./cms-vtex-chef');
const CMSVtex_file = require('./cms-vtex-chef/libs/CMSVtex_file')
const path = require('path');

//test websites
//let websites = CMSVtex.get_websites()
//console.log('websites are',websites)
//let website_by_name = CMSVtex.get_website_by_name( 'chefcompany' )
//console.log('website is',website_by_name)

//test templates
//let templates = CMSVtex.get_templates()
//console.log('templates are',templates)
//let template = CMSVtex.get_template( '554e1aad-3283-48a5-a4d5-9cbe510abae4' )
//console.log('template is',template)
//let template_by_name = CMSVtex.get_template_by_name( 'test para borrar' )
//console.log('template is',template_by_name)
//let html_local = CMSVtex.get_html_local( 'tesT para Borrar' )
//console.log('content is',html_local)//
////add template
//let add_template = CMSVtex.add_template( 'Test 17 abril 2',CMSVtex.get_html_local('401') )
//console.log('add template is',add_template)
////update template
//let update_template = CMSVtex.update_template( 'Test 17 abril','c5e6280df0869c712f2229c9b930f2bd',CMSVtex.get_html_local('19-Account'),CMSVtex.get_html_local('401') )
//console.log('update template is',update_template)
//let delete_template = CMSVtex.delete_template('451ceed2831b490d90ad6cf5b5428b8b');
//console.log('delete template is',delete_template)
////get sub-templates
//let sub_templates = CMSVtex.get_sub_templates();
//console.log('sub templates are',sub_templates)
////add sub-template
//let new_sub_template = CMSVtex.add_sub_template('test sub template 2','<span>Holita desde fuera sub template</span>');
//console.log('sub templates new',new_sub_template)
////update sub-template
////add sub-template
//let update_sub_template = CMSVtex.update_sub_template('test sub template 2','02cad9ff4daa2a0436b7825216814c5b','<a href="">Holita</a>','<span>Holita desde fuera sub template</span>');
//console.log('sub templates new',update_sub_template)
////delete sub template
//let delete_sub_template = CMSVtex.delete_template( '02cad9ff4daa2a0436b7825216814c5b' );
//console.log('delete sub template',delete_sub_template)
////add shelf template
//let new_shelf = CMSVtex.add_shelf_template( 'test shelf','esto es un shelf desde afuera','class-test-externa',false )
//console.log('new shelf',new_shelf)
//let update_shelf = CMSVtex.update_shelf_template( 'test shelf','f3f755964760e9c89bfab35926402be2','ya lo cambiamos','esto es un shelf desde afuera','class-test-externa-cambiada',true )
//console.log('new shelf',update_shelf)
////delete shelf template
//let delete_template = CMSVtex.delete_shelf_template('202dd665f27b4f6f94415a93f7677ebe');
//console.log('template deleted',delete_template)
////get shelf template
//let list_shelfs = CMSVtex.get_shelf_templates();
//console.log('list shelfs',list_shelfs)

//test folders
////get folder
//let folders = CMSVtex.get_folder( 'b6744a2c44fc4b129d498f2df98cd6e9','6bea6aeb8a6e49749a60b236397f3467' )
//console.log('folders are',folders)
////get id new folder
//let id_new_folder = CMSVtex.get_id_new_folder( 'b6744a2c44fc4b129d498f2df98cd6e9','6bea6aeb8a6e49749a60b236397f3467' );
//console.log('id new folder is',id_new_folder)
////add folder
//let new_folder = CMSVtex.save_folder( 'test-externo-vtex-2','b6744a2c44fc4b129d498f2df98cd6e9','6bea6aeb8a6e49749a60b236397f3467' )
//console.log('new folder is',new_folder)
////update folder
//let update_folder = CMSVtex.save_folder( 'test-externo-vtex-3','b6744a2c44fc4b129d498f2df98cd6e9','6bea6aeb8a6e49749a60b236397f3467',{folderId : '3b82dda7d75343ecb6e2b43b00082ac1'} )
//console.log('update folder is',update_folder)
////delete folder
//let delete_folder = CMSVtex.delete_folder( 'b6744a2c44fc4b129d498f2df98cd6e9','bbbfcad3cf11464984e83d714b972e63' );
//console.log('delete folder success',delete_folder)

//test layouts
////get id new layout
//let id_new_layout = CMSVtex.get_id_new_layout('b6744a2c-44fc-4b12-9d49-8f2df98cd6e9','efb635b2-586a-4b04-ab8b-0d73bd18cede');
//console.log('id new layout',id_new_layout)
////add layout
//let new_layout = CMSVtex.save_layout('test externo layout 2','b6744a2c-44fc-4b12-9d49-8f2df98cd6e9','efb635b2-586a-4b04-ab8b-0d73bd18cede','e65cfefc-8cdb-42ad-88ac-9481902e557b','class-externa-jojojo')
//console.log('new layout is',new_layout)
////update layout
//let new_layout = CMSVtex.save_layout('test externo layout 2','b6744a2c-44fc-4b12-9d49-8f2df98cd6e9','efb635b2-586a-4b04-ab8b-0d73bd18cede','e65cfefc-8cdb-42ad-88ac-9481902e557b','class-externa-jojojo-jiji',{layoutId:'8a8800d1-ed26-499b-b2db-8c38073b6459'})
//console.log('new layout is',new_layout)
////delete layout
//let delete_layout = CMSVtex.delete_layout('b6744a2c-44fc-4b12-9d49-8f2df98cd6e9','eae852c2-f7f0-4382-9485-5dd7b094c6b2')
//console.log('delete layout',delete_layout)

//test controls
////add control
//let new_control = CMSVtex.add_control_layout('2fca3178-4975-4892-9090-f269f2e413d4','0f7f127d-257a-4f4e-bc10-f43807568a5d','test externo chef 2','html')
//console.log('new control is',new_control)
////delete control
//let delete_control = CMSVtex.delete_control_layout('2fca3178497548929090f269f2e413d4','0f7f127d-257a-4f4e-bc10-f43807568a5d','bbddaaf0-c5b5-443a-930c-f9bafa169a88')
//console.log('delete control is',delete_control)
////rename control
//let rename_control = CMSVtex.rename_control_layout('2fca3178497548929090f269f2e413d4','0f7f127d-257a-4f4e-bc10-f43807568a5d','eec36743-1fd0-44eb-8411-d28c4dbcb23a','prueba chef externa rename control')
//console.log('delete control is',rename_control)

//test objects
////add object
/*let new_object = CMSVtex.save_object_control('eec36743-1fd0-44eb-8411-d28c4dbcb23a','html',{
	ContentName : 'test externo lo logré melo 4',
	html : '<span>Jo jo joj afuer ajajaja</span>'
})
console.log('new object is',new_object)*/
////update object
//let update_object = CMSVtex.save_object_control('fd365dd5-73ca-4400-badd-0a41fd3aca20','html',{
//	ContentName : 'test externo lo logré melo 5',
//	html : '<span>Updated desde afuera :D sisas</span>'
//},'11512a5e-d2a4-41f1-bf12-d1021e90bdcb')
//console.log('update object is',update_object)
////delete object
//let delete_object = CMSVtex.delete_object_control('fd365dd5-73ca-4400-badd-0a41fd3aca20','html','11512a5e-d2a4-41f1-bf12-d1021e90bdcb');
//console.log('delete object is',delete_object)

//tests files
////get list files
//let list_files_css = CMSVtex.get_list_files( 'css' )
//console.log('list files css',list_files_css)
//let list_files_js = CMSVtex.get_list_files( 'js' )
//console.log('list files js',list_files_js)
//let list_files_images = CMSVtex.get_list_files( 'images' )
//console.log('list files images',list_files_images)

////get file
//let file_css = CMSVtex_file.get_file('155187');
//console.log('file css is',file_css)
//let file_js = CMSVtex_file.get_file('emailUserReview.js');
//console.log('file js is',file_js)
////get image
/*let file_img = CMSVtex_file.get_file(96,'img','jpg',path.join(__dirname,'src/images'));
file_img
.then(({ filename, image }) => {
	console.log('File saved to', filename)
})
.catch((err) => {
console.error(err)
})*/

////get request token
//let request_token = CMSVtex_file.get_request_token();
//console.log('request token is',request_token)
////upload file
/*let upload_file_css = CMSVtex_file.upload( path.join(__dirname,'cms-vtex-chef','templates','fondo-newsletter.png') );
upload_file_css //false si no guarda
.then(( response ) => {
	console.log('upload file is',response)
})*/
////delete file
//let delete_file = CMSVtex_file.delete( '156053','image' );
//console.log('delete file',delete_file);
////existe file
//let file_exist = CMSVtex_file.file_exist('fondo-newsletter.jpg');
//console.log('exist file',file_exist)
////update file
//let update_file = CMSVtex_file.update('test.css',path.join(__dirname,'cms-vtex-chef','templates','test.css'));
//update_file
//.then(( response ) => {
//	console.log('update file is',response);
//})