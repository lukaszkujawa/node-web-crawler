var cheerio = require('cheerio');
var solr = require('solr-client');
var async = require( 'async' );

exports = module.exports = Solr;

function Solr(options) {
	for( i in options.rules ) {
		if( options.rules[ i ].filter != undefined ) {
			this.initFilters( options.rules[ i ] );
		}
	}

	if( options.urlPattern != undefined && options.urlPattern != false ) {
		options.urlPattern = new RegExp( options.urlPattern );
	}
	else {
		options.urlPattern = false;
	}

	this.options = options;
}

Solr.prototype.initFilters = function( rule ) {
	if( rule.filter[0] != undefined ) {
		for( y in rule.filter ) {
			this._initFilter( rule.filter[ y ] );
		}
	}
	else {
		this._initFilter( rule.filter );
	}
}

Solr.prototype._initFilter = function( filter ) {
	if( filter.pattern != undefined ) {
		filter.pattern = new RegExp( filter.pattern, 'g' );
		filter.run = function( str ) {
			return str.replace( this.pattern, this.replacement );
		}
	}
	else if( filter.module != undefined ) {
		console.log( filter.module );
		filter.run = require( filter.module ).run;
	}
	else {
		throw new Exception( "Incorrect filter configuration" );
	}
} 

Solr.prototype.getRules = function() {
	return this.options.rules;
}

Solr.prototype.eachRule = function(callback) {
	var rules = this.getRules();

	for( i in rules ) {
		callback( rules[ i ] );
	}
}

Solr.prototype.save = function(doc, callback) {
	var client = solr.createClient();

	client.add(doc, function(err, obj) {
		if( err ) {
			console.log( " --- Failed inserting document to Solr --- " );
			console.log( err );
			console.log( " --------- " );
			console.log( doc );
			console.log( " --------- " );
		}
		else {
			client.commit(function(err, res) {
				if( err ) {
					console.log( " --- Failed commiting document to Solr --- " );
					console.log( err );
					console.log( " --------- " );
					console.log( doc );
					console.log( " --------- " );
				}
			});
		}

		callback();
	});
}

Solr.prototype.applyFilter = function( str, rule ) {
	if( rule.filter == undefined ) {
		return str;
	}

	if( rule.filter[ 0 ] == undefined ) {
		return rule.filter.run( str );
		//return str.replace( rule.filter.pattern, rule.filter.replacement );
	}
	
	for( i in rule.filter ) {
		str = rule.filter[ i ].run( str );
		//str = str.replace( rule.filter[ i ].pattern, rule.filter[ i ].replacement );
	}

	return str;
}

Solr.prototype.execute = function(callback, $, env) {
	if( typeof( $ ) != 'function' || 
		( this.options.urlPattern && ! env.task.href.match( this.options.urlPattern ) ) ) {
		return callback();
	}

	var self = this;

	if( this.options.each != undefined ) {
		/**
		 *	Create multiple Solr document from one HTML page
		 */
		var docs = [];
		$( this.options.each ).each(function(i, el) {
			docs.push(function(callback){
				var doc = {};
				self.parseAndInsert( $, doc, el, callback );
			});
		});

		async.parallel( docs, callback );
	}
	else {
		var doc = {
			id: env.task.href
		};

		this.parseAndInsert( $, doc, false, callback );
	}
}

Solr.prototype.parseAndInsert = function( $, doc, el, callback ) {
	var self = this,
		saveDoc = false;

	this.eachRule( function( rule ) {
		if( el ) {
			var obj = $(el).find( rule.selector );
		}
		else {
			var obj = $( rule.selector );
		}

		obj.each( function() {
			if( rule.attribute == false ) {
				var content = $(this).html();
			}
			else {
				var content = $(this).attr( rule.attribute );
			}

			content = self.applyFilter( content, rule );

			if( doc[ rule.field ] == undefined ) {
				doc[ rule.field ] = content;
			}
			else if( typeof( doc[ rule.field ] ) == 'string' ) {
				doc[ rule.field ] = [ doc[ rule.field ], content ];
			}
			else {
				doc[ rule.field ].push( content );
			}

			saveDoc = true;
		});
	});

	/**
	 *	Save only if there is at least one positive match
	 */
	if( saveDoc ) {
		console.log( doc );
		//this.save( doc, callback );
	}
	else {
		callback();
	}
}
