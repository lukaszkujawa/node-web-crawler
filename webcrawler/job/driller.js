var async = require( 'async' );
var UrlDoc = require( '../storage/doc/urldoc' );
var cheerio = require('cheerio');

exports = module.exports = Driller;

function Driller(options) {
	this.options = {
		domain: false,
		selector: "a",
		attribute: "href"
	};

	this.relativeDomain = new RegExp('^\/[^\/]');

	this.initOptions( options );
}

Driller.prototype.initOptions = function( options ) {
	if( options ) {
		for( i in options ) {
			if( i == "domain" ) {
				this.setDomain( options[ i ] );
			}
			else {
				this.options[ i ] = options[ i ];
			}
		}
	}
}

Driller.prototype.setDomain = function( domain ) {
	var domain = domain.replace( /\./, '\.' );
	domain = '^http[s]{0,1}:\/\/([^\/]*?)' + domain + '(\/|$)'; 
	this.options[ "domain" ] = new RegExp( domain, 'i' );
}

Driller.prototype.execute = function(callback, data, env) {
	if( env.res.headers['content-type'] == undefined || ! env.res.headers['content-type'].match( /^text\/html/) ) {
		return callback();
	}

	var $ = cheerio.load( data ),
		self = this,
		docs = [];


	$( self.options.selector ).each( function( i, el ) {
		var url = $(this).attr( self.options.attribute );

		if( url == undefined ) {
			return;
		}

		url = self.normaliseUrl( url, env );

		if( self.isValidUrl( url ) ) {
			docs.push( 
				self.getDocInsertFunction( 
					new UrlDoc( url ) ) );
		}
	});

	async.parallel( docs, callback );
	$ = null;
	docs = null;
}

Driller.prototype.getDocInsertFunction = function( doc ) {
	return function( callback ) {
		doc.insert( callback );
	}
}

Driller.prototype.normaliseUrl = function( url, env ) {
	if( url.match( this.relativeDomain ) ) {
		return env.task.protocol + '//' + env.task.hostname + url;
	}

	return url;			
}

Driller.prototype.isValidUrl = function( url ) {
	if( this.options.domain ) {
		return url.match( this.options.domain );
	}

	return true;
}