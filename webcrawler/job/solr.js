var cheerio = require('cheerio');
var solr = require('solr-client');

exports = module.exports = Solr;

function Solr(options) {
	for( i in options.rules ) {
		if( options.rules[ i ].filter != undefined ) {
			if( options.rules[ i ].filter[0] != undefined ) {
				for( y in options.rules[ i ].filter ) {
					options.rules[ i ].filter[ y ].pattern = new RegExp( options.rules[ i ].filter[ y ].pattern, 'g' );
				}
			}
			else {
				options.rules[ i ].filter.pattern = new RegExp( options.rules[ i ].filter.pattern, 'g' );	
			}
		}
	}

	if( options.urlPattern != undefined ) {
		options.urlPattern = new RegExp( options.urlPattern );
	}
	else {
		options.urlPattern = false;
	}

	this.options = options;
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
		return str.replace( rule.filter.pattern, rule.filter.replacement );
	}
	
	for( i in rule.filter ) {
		str = str.replace( rule.filter[ i ].pattern, rule.filter[ i ].replacement );
	}

	return str;
}

Solr.prototype.execute = function(callback, data, env) {
	return callback();
	
	if( env.res.headers['content-type'] == undefined || ! env.res.headers['content-type'].match( /^text\/html/) ) {
		return callback();
	}

	if( this.options.urlPattern && ! env.task.href.match( this.options.urlPattern ) ) {
		return callback();
	}

	var $ = cheerio.load( data ),
		self = this,
		saveDoc = false,
		doc = {
			id: env.task.href
		};

	this.eachRule( function( rule ) {
		$( rule.selector ).each( function() {
			if( rule.attribute == false ) {
				var content = $(this).text();
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

	if( saveDoc ) {
		this.save( doc, callback );
	}
	else {
		callback();
	}

}

