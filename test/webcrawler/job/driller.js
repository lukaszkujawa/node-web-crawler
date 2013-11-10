var assert = require( "assert" )
var helper = require( "../../helper" );
var fs = require('fs');
var Driller = require( '../../../webcrawler/job/driller' );
var cheerio = require('cheerio');

function drillerExecute( testFile, domainRestriction, env, callback ) {
	var driller = new Driller({ domainRestriction: domainRestriction });
	var docs = [];

	driller.getDocInsertFunction = function( doc ) {
		docs.push( doc );
		return function( _callback ) { _callback(); }
	}

	fs.readFile( __dirname + testFile , 'utf8', function (err, html) {
		if( err ) { throw new Exception( err ); }

		driller.execute( function(){
			callback( docs );
		}, cheerio.load( html ), env );

	});
	

}

describe('Driller', function(){

	describe('#isValidUrl()', function(){
		var driller = new Driller({
			domainRestriction: "testing.com"
		});

		it('should return true when URL in the restricted domain', function() {
			assert( driller.isValidUrl( 'http://testing.com/hello' ) );
			assert( driller.isValidUrl( 'http://subdomain.testing.com/hello' ) );
			assert( driller.isValidUrl( 'https://testing.com/hello' ) );
			assert( driller.isValidUrl( 'https://testing.com' ) );
		});

		it('should return false when URL not in the restricted domain', function() {
			assert( false == driller.isValidUrl( 'http://example.com/hello' ) );
			assert( false == driller.isValidUrl( 'http://testing.example.com' ) );
			assert( false == driller.isValidUrl( 'http://xxxxx-testing.com/' ) );
		});

		it('should return false for non HTTP protocols', function() {
			var driller = new Driller();

			assert( ! driller.isValidUrl( 'mailto:admin@example.com' ) );
			assert( ! driller.isValidUrl( ' JavaScript:admin@example.com' ) );
		});

		it('should return true only if URL match a pattern', function() {
			var driller = new Driller({patterns: [
				/\/page\/[0-9]+\//,
				/\/view\/id\/[0-9]+\//
			]});

			assert( ! driller.isValidUrl( 'https://testing.com/100/' ) );
			assert( driller.isValidUrl( 'https://www.testing.com/view/id/232/' ) );
			assert( driller.isValidUrl( 'https://testing.com/page/0/1' ) );
			assert( ! driller.isValidUrl( 'https://testing.com/page/' ) );
		});
	});

	describe('#normaliseUrl()', function(){
		var driller = new Driller({
			domainRestriction: "testing.com"
		});

		it('should return full URL for relative path', function(){
			var tests = [
				{ input: '/hello/id/5?_a=1', 
				  env: 'http://www.testing.com/example/id/1', 
				  expect: 'http://www.testing.com/hello/id/5?_a=1' },
				
				{ input: 'hello', 
				  env: 'https://www.testing.com/example/id/2?a=123', 
				  expect: 'https://www.testing.com/example/id/hello' },

				{ input: '//www.testing.com/hello', 
				  env: 'http://www.testing.com/example/id/3', 
				  expect: 'http://www.testing.com/hello' },

				{ input: '/', 
				  env: 'http://www.testing.com/example/id/3', 
				  expect: 'http://www.testing.com/' },

				{ input: 'privacy.php', 
				  env: 'http://www.testing.com/download.php?a=10', 
				  expect: 'http://www.testing.com/privacy.php' },

				{ input: '/hello/id/5?_a=1#comment=1023', 
				  env: 'http://www.testing.com/example/id/1', 
				  expect: 'http://www.testing.com/hello/id/5?_a=1' },

			];

			for( i in tests ) {
				var test = tests[i];
				var url = driller.normaliseUrl( test.input, helper.getEnv( test.env ) );
				assert.equal( url, test.expect );
			}
		});
	});

	describe('#getOverwrite()', function(){
		var driller = new Driller({
			overwrite: [
				{ pattern: /example\.com\/article\/[0-9]+\//, timeDiff: 100 },
				{ pattern: /\/view\//, timeDiff: 200 } ]
		});

		it('should return 100 for http://subdomain.example.com/article/1/', function(){
			assert.equal( driller.getOverwrite( 'http://subdomain.example.com/article/1/' ), 100 );
		});

		it('should return 200 for /view/', function(){
			assert.equal( driller.getOverwrite( 'http://subdomain.example.com/view/10' ), 200 );
		});

	});

	describe('#execute()', function(){
		var VisittedUrls = require('../../../webcrawler/visittedurls');

		it('should drill urls only from http://*example.com/', function( done ) {
			VisittedUrls.setLinks( [] );
			var env = helper.getEnv( 'http://www.example.com/view/1' );
			drillerExecute( '/html/site01.html', 'example.com', env, function(docs){
				assert.equal( docs.length, 6 );
				done();
			});

		});

		it('should attach url source to all documents', function(done){
			VisittedUrls.setLinks( [] );
			var env = helper.getEnv( 'http://www.example.com/view/1' );
			
			env.task.data = { source: [ 'http://www.example.com/1', 'http://www.example.com/2'] };
			drillerExecute( '/html/site01.html', 'example.com', env, function(docs){
				assert.equal( docs.length, 6 );
				done();
			});
			
		});

	});

});