var cheerio = require('cheerio');
var solr = require('solr-client');

exports = module.exports = Solr;

function Solr(options) {
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

Solr.prototype.execute = function(callback, data, env) {
	if( env.res.headers['content-type'] == undefined || ! env.res.headers['content-type'].match( /^text\/html/) ) {
		return callback();
	}

	var $ = cheerio.load( data ),
		self = this,
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

			if( doc[ rule.field ] == undefined ) {
				doc[ rule.field ] = content;
			}
			else if( typeof( doc ) == 'string' ) {
				doc[ rule.field ] = [ doc[ rule.field ], content ];
			}
			else {
				doc[ rule.field ].push( content );
			}
		});
	});

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

