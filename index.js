//Dependencies
const request = require('sync-request');
const cheerio = require('cheerio');
const entities = require('html-entities').XmlEntities;
const fs = require('fs');
const path = require('path')
let base_dir = path.join(__dirname)

if(__dirname.trim() == '/'){
	base_dir = './'
	
}

const CMSVtex_website = require(base_dir + 'libs/CMSVtex_website');
const CMSVtex_folder = require(base_dir + 'libs/CMSVtex_folder');
const CMSVtex_layout = require(base_dir + 'libs/CMSVtex_layout');
const CMSVtex_custom_elements = require(base_dir + 'libs/CMSVtex_custom_elements');
const CMSVtex_template = require(base_dir + 'libs/CMSVtex_template');
const CMSVtex_file = require(base_dir + 'libs/CMSVtex_file');
const CMSVtex_authentication = require(base_dir + 'libs/CMSVtex_authentication');

module.exports = function(){
	return {
		website : CMSVtex_website,
		template : CMSVtex_template,
		folder : CMSVtex_folder,
		layout : CMSVtex_layout,
		custom_elements : CMSVtex_custom_elements,
		file : CMSVtex_file,
		authentication : CMSVtex_authentication
	}
}()