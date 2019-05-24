//Dependencies
const request = require('sync-request');
const cheerio = require('cheerio');
const entities = require('html-entities').XmlEntities;
const fs = require('fs');
const path = require('path')
const CMSVtex_general = require(path.join(__dirname,'libs/CMSVtex_general'));
const CMSVtex_website = require(path.join(__dirname,'libs/CMSVtex_website'));
const CMSVtex_folder = require(path.join(__dirname,'libs/CMSVtex_folder'));
const CMSVtex_layout = require(path.join(__dirname,'libs/CMSVtex_layout'));
const CMSVtex_custom_elements = require(path.join(__dirname,'libs/CMSVtex_custom_elements'));
const CMSVtex_template = require(path.join(__dirname,'libs/CMSVtex_template'));
const CMSVtex_file = require(path.join(__dirname,'libs/CMSVtex_file'));

const CMSVtex_login = require(path.join(__dirname,'libs/CMSVtex_login'));

module.exports = function(){
	return {
		website : CMSVtex_website,
		folder : CMSVtex_folder,
		layout : CMSVtex_layout,
		template : CMSVtex_template,
		login : CMSVtex_login,
		file : CMSVtex_file,
		custom_elements : CMSVtex_custom_elements,
		general : CMSVtex_general
	}
}()