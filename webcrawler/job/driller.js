var async = require( 'async' );
var UrlDoc = require( '../storage/doc/urldoc' );
var cheerio = require('cheerio');

exports = module.exports = Driller;

function Driller(options) {
	this.relativeDomain = new RegExp('^\/[^\/]');

	this.options = {
		domainRestriction: false,
		selector: "a",
		attribute: "href",
		overwrite: [],
		normalisers: [],
		filters: [],
		verbose: false
	};

	this._links = {};
	this.initOptions( options );
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
			var doc = new UrlDoc( url );
			doc.setOverwrite( self.getOverwrite( url ) );
			docs.push( self.getDocInsertFunction( doc ) );
		}
	});

	async.parallel( docs, callback );
}

Driller.prototype.addOverwriteRule = function( rule ) {
	this.options.overwrite.push( rule );
}

Driller.prototype.addNormaliser = function( rule, funct ) {
	rule = new RegExp( rule );
	this.options.normalisers.push( { rule: rule, process: funct } );
}

Driller.prototype.addFilter = function( filter ) {
	this.options.filters.push( filter );
}

Driller.prototype.initOptions = function( options ) {
	if( options ) {
		for( i in options ) {
			if( i == "domainRestriction" ) {
				this.setDomainRestriction( options[ i ] );
			}
			else {
				this.options[ i ] = options[ i ];
			}
		}
	}
}

Driller.prototype.setDomainRestriction = function( domain ) {
	var domain = domain.replace( /\./, '\.' );
	domain = '^http[s]{0,1}:\/\/([^\/]*?)' + domain + '(\/|$)'; 
	this.options[ "domain" ] = new RegExp( domain, 'i' );
}

Driller.prototype.getOverwrite = function( url ) {
	for( i in this.options.overwrite ) {
		var rule = this.options.overwrite[ i ];
		if( url.match( rule.pattern ) ) {
			return rule.timeDiff;
		}
	}

	return -1;
}

Driller.prototype.getDocInsertFunction = function( doc ) {
	return function( callback ) {
		doc.insert( callback );
	}
}

Driller.prototype.normaliseUrl = function( url, env ) {
	if( url.match( this.relativeDomain ) ) {
		url = env.task.protocol + '//' + env.task.hostname + url;
	}

	for( i in this.options.normalisers ) {
		var norm = this.options.normalisers[ i ];
		if( url.match( norm.rule ) ) {
			url = norm.process( url );
		}
	}

	return url;			
}

Driller.prototype.isValidUrl = function( url ) {
	/**
	 *	Ignore links like "mailto:" or "javascript:"
	 */
	var protocol = url.match( /^[\ ]*([a-zA-Z0-0]+):/ );
	if( protocol && protocol[1].toLowerCase() != 'http' && protocol[1].toLowerCase() != 'https' ) {
		return false;
	}

	if( this.options.domain && ! url.match( this.options.domain ) ) {
		return false;
	}

	/**
	 *	@todo: release some data to avoid memory leak
	 */
	if( this._links[ url ] == undefined ) {
		this._links[ url ] = 1;
		return true;
	}

	this._links[ url ] += 1;
	return false;
}