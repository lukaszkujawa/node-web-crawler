var assert = require( "assert" )
var helper = require( "../../helper" );
var fs = require('fs');
var Solr = require( '../../../webcrawler/job/solr' );
var cheerio = require('cheerio');

function solrExecute( testFile, options, env, callback ) {
	var solr = new Solr(options);

	fs.readFile( __dirname + testFile , 'utf8', function (err, html) {
		if( err ) { throw new Exception( err ); }

		solr.save = callback;

		solr.execute( function(){
			callback( docs );
		}, cheerio.load( html ), env );

	});

}

describe('Solr', function(){

	describe('#getRules', function(){

		var solr = new Solr({
			rules: [
				{ "selector": "div a", 
				  "attribute": false, 
				  "field": "title" }
			]
		});

		assert.equal( solr.getRules().length, 1 );



	});

});