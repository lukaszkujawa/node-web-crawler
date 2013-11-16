var async = require( 'async' );
var UrlDoc = require( '../storage/doc/urldoc' );
var cheerio = require('cheerio');
var UrlTool = require('../utils/urltool');
var VisittedUrls = require('../visittedurls');

exports = module.exports = Driller;

function Driller(options) {
	this.options = {
		domainRestriction: false,
		selector: "a",
		attribute: "href",
		overwrite: [],
		normalisers: [],
		filters: [],
		patterns: [],
		verbose: false,
		maxDepth: false
	};

	this.initOptions( options );
}

Driller.prototype.execute = function(callback, $, env) {
	if( typeof( $ ) != 'function' ) {
		return callback();
	}

	if( env.res.headers['content-type'] == undefined || ! env.res.headers['content-type'].match( /text\/html/) ) {
		return callback();
	}
	
	if( this.options.maxDepth !== false && env.task.data != undefined && env.task.data.source != undefined) {
		if( env.task.data.source.length >= this.options.maxDepth ) {
			return callback();
		}
	}

	var self = this,
		docs = [];

	$( self.options.selector ).each( function( i, el ) {
		var url = $(this).attr( self.options.attribute );

		if( url == undefined ) {
			return;
		}

		url = self.normaliseUrl( url, env );
		
		if( self.isValidUrl( url ) ) {
			var doc = new UrlDoc( url );
			
			doc.setSourceFromEnv( env );
			//ßdoc.setOverwrite( self.getOverwrite( url ) );
			docs.push( self.getDocInsertFunction( doc ) );
		}
	});
	
	env.agent.log( "before inserting " + docs.length + " links", self );

	async.parallel( docs, function(){
		env.agent.log( "after inserting links", self );
		callback();
	});

	docs = null;
	$ = null;
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
			else if( i == "patterns" ) {
				this.setPatterns( options[ i ] );
			}
			else {
				this.options[ i ] = options[ i ];
			}
		}
	}
}

Driller.prototype.setDomainRestriction = function( domain ) {
	var domain = domain.replace( /\./, '\.' );
	domain = '^http[s]{0,1}:\/\/(([^\/]+?\\.)|())' + domain + '(\/|$)'; 
	this.options[ "domain" ] = new RegExp( domain, 'i' );
}

Driller.prototype.setPatterns = function( patterns ) {
	for( i in patterns ) {
		this.options.patterns.push( new RegExp( patterns[ i ] ) );
	}
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
	return UrlTool.nomalise( url, env, this.options.normalisers );		
}

Driller.prototype.isValidUrl = function( url ) {
	/**
	 *	Ignore links like "mailto:" or "javascript:"
	 */
	if( ! url.match( /^http[s]{0,1}:\/\//i ) ) {
		return false;
	}

	if( this.options.domain && ! url.match( this.options.domain ) ) {
		return false;
	}

	if( this.options.patterns.length > 0 ) {
		var match = false;
		var patterns = this.options.patterns;
		for( i in patterns ) {
			if( url.match( patterns[ i ] ) ) {
				match = true;
				break;
			}
		}

		if( ! match ) {
			return false;
		}
	}

	
	if( VisittedUrls.exists( url ) ) {	
		return false;
	}
	
	VisittedUrls.add( url );
	
	return true;
}