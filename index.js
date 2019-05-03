//Dependencies
const request = require('sync-request');
const cheerio = require('cheerio');
const entities = require('html-entities').XmlEntities;
const fs = require('fs');
const path = require('path')
const CMSVtex_website = require(path.join(__dirname,'libs/CMSVtex_website'));
const CMSVtex_folder = require(path.join(__dirname,'libs/CMSVtex_folder'));
const CMSVtex_layout = require(path.join(__dirname,'libs/CMSVtex_layout'));
const CMSVtex_template = require(path.join(__dirname,'libs/CMSVtex_template'));
const CMSVtex_login = require(path.join(__dirname,'libs/CMSVtex_login'));
const CMSVtex_file = require(path.join(__dirname,'libs/CMSVtex_file'));

module.exports = function(){
	return {
		website : CMSVtex_website,
		folder : CMSVtex_folder,
		layout : CMSVtex_layout,
		template : CMSVtex_template,
		login : CMSVtex_login,
		file : CMSVtex_file
		//websites
		/*get_websites : CMSVtex_website.get,
		get_website_by_name : CMSVtex_website.get_website_by_name,
		//templates
		get_templates : CMSVtex_template.get,
		get_template : CMSVtex_template.get_template,
		get_template_by_name : CMSVtex_template.get_template_by_name,
		get_html_local : CMSVtex_template.get_html_local,
		add_template : CMSVtex_template.add_template,
		update_template : CMSVtex_template.update_template,
		delete_template : CMSVtex_template.delete,
		get_sub_templates : CMSVtex_template.get_sub_templates,
		add_sub_template : CMSVtex_template.add_sub_template,
		update_sub_template : CMSVtex_template.update_sub_template,
		add_shelf_template : CMSVtex_template.add_shelf_template,
		update_shelf_template : CMSVtex_template.update_shelf_template,
		delete_shelf_template : CMSVtex_template.delete_shelf_template,
		get_shelf_templates : CMSVtex_template.get_shelf_templates,
		//folders
		get_folder : CMSVtex_folder.get,
		get_id_new_folder : CMSVtex_folder.get_id_new_folder,
		save_folder : CMSVtex_folder.save,
		delete_folder : CMSVtex_folder.delete,
		//layouts
		get_id_new_layout : CMSVtex_layout.get_id_new_layout,
		get_layout : CMSVtex_layout.get,
		save_layout : CMSVtex_layout.save,
		delete_layout : CMSVtex_layout.delete,
		//controls
		add_control_layout : CMSVtex_layout.add_control,
		delete_control_layout : CMSVtex_layout.delete_control,
		rename_control_layout : CMSVtex_layout.rename_control,
		//objects
		get_list_objects : CMSVtex_layout.get_list_objects,
		save_object_control : CMSVtex_layout.save_object,
		delete_object_control : CMSVtex_layout.delete_object,
		//files
		get_list_files : CMSVtex_file.get_list,
		download_file : CMSVtex_file.get_file,
		upload_file : CMSVtex_file.upload,
		delete_file : CMSVtex_file.delete,
		//login
		vtex_login : CMSVtex_login*/
	}
}()