var $ = require( 'jquery' );
var async = require( 'async' );
var UrlDoc = require( '../storage/doc/urldoc' );

exports = module.exports = Driller;

function Driller(options) {
	this.options = {
		domain: false,
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
	domain = '^http[s]{0,1}:\/\/(.*?)' + domain + '(\/|$)'; 
	this.options[ "domain" ] = new RegExp( domain, 'i' );
}

Driller.prototype.execute = function(callback, data, env) {
	var self = this;
	var docs = [];

	$( data ).find( 'a' ).each(function() {
		var url = self.normaliseUrl( $(this).attr('href'), env );

		if( self.isValidUrl( url ) ) {
			var doc = new UrlDoc( $(this).attr('href') );
			docs.push( self.getDocInsertFunction( doc ) );
		}
	});

	async.parallel( docs, callback );
}

Driller.prototype.getDocInsertFunction = function( doc ) {
	return function( callback ) {
		doc.insert( callback );
	}
}

Driller.prototype.normaliseUrl = function( url, env ) {
	if( url.match( this.relativeDomain ) ) {
		return 'http://' + env.task.hostname + url;
	}

	return url;			
}

Driller.prototype.isValidUrl = function( url ) {
	if( this.options.domain ) {
		return url.match( this.options.domain );
	}

	return true;
}