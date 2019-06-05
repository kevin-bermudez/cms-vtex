//Dependencies
const request = require('sync-request');
const cheerio = require('cheerio');
const entities = require('html-entities').XmlEntities;
const fs = require('fs');
const path = require('path')
const CMSVtex_website = require(path.join(__dirname,'libs/CMSVtex_website'));
const CMSVtex_folder = require(path.join(__dirname,'libs/CMSVtex_folder'));
const CMSVtex_layout = require(path.join(__dirname,'libs/CMSVtex_layout'));
const CMSVtex_custom_elements = require(path.join(__dirname,'libs/CMSVtex_custom_elements'));
const CMSVtex_template = require(path.join(__dirname,'libs/CMSVtex_template'));
const CMSVtex_file = require(path.join(__dirname,'libs/CMSVtex_file'));

const CMSVtex_login = require(path.join(__dirname,'libs/CMSVtex_login'));

module.exports = function( general_account,config_account ){
	const CMSVtex_general = require('./libs/CMSVtex_general')( exports,general_account,config_account );

	let template = function(){
		return CMSVtex_template( CMSVtex_general );
	}()

	let website = function(){
		return CMSVtex_website( CMSVtex_general );
	}()
	
	let folder = function(){
		return CMSVtex_folder( CMSVtex_general );
	}()

	let layout = function(){
		return CMSVtex_layout( CMSVtex_general );
	}()

	let file = function(){
		return CMSVtex_file( CMSVtex_general );
	}()

	let custom_elements = function(){
		return CMSVtex_custom_elements( CMSVtex_general );
	}()

	return {
		folder,
		layout,
		template,
		website,
		file,
		custom_elements,
		general : CMSVtex_general,
		login : () => {
			CMSVtex_login( general_account,config_account )
		},
		is_logged : () => {
			return CMSVtex_login.is_logged( general_account,config_account )
		}
	}
}