var assert = require( "assert" )
var helper = require( "../../helper" );
var fs = require('fs');

describe('Driller', function(){

	var Driller = require( '../../../webcrawler/job/driller' );

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
				  env: 'https://www.testing.com/example/id/2', 
				  expect: 'https://www.testing.com/example/id/2/hello' },

				{ input: '//www.testing.com/hello', 
				  env: 'http://www.testing.com/example/id/3', 
				  expect: 'http://www.testing.com/hello' },

				{ input: '/', 
				  env: 'http://www.testing.com/example/id/3', 
				  expect: 'http://www.testing.com/' }

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
		var driller = new Driller({ domainRestriction: "example.com" });

		it('should drill urls only from http://*example.com/', function( done ) {
			var docs = [];

			/**
			 * Mock getDocInsertFunction()
			 */
			driller.getDocInsertFunction = function( doc ) {
				docs.push( doc );
				return function( callback ) { callback(); }
			}

			fs.readFile( __dirname + '/html/site01.html' , 'utf8', function (err, html) {
				if( err ) { throw new Exception( err ); }

				driller.execute( function(){
					assert.equal( docs.length, 6 );

					done();
				}, html, helper.getEnv( 'http://www.example.com/view/1' ) );

			});
			
		});


	});

});