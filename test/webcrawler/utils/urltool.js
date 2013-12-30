var assert = require( "assert" );
var UrlTool = require('../../../webcrawler/utils/urltool'); 
var helper = require( "../../helper" );

describe('UrlDoc', function(){

	describe('#UrlDoc', function(){

		it('should handle ../ urls', function(){
			var env = helper.getEnv( 'http://www.example.com/foo' );

			var urls = [

				{ input: 'http://www.example.com/foo/../bar',
				  output: 'http://www.example.com/bar' },
	
				{ input: 'http://www.example.com/foo/../../../bar',
				  output: 'http://www.example.com/bar' },

				{ input: 'http://www.example.com/../',
				  output: 'http://www.example.com/' },

				{ input: 'http://www.example.com/foo/../../../bar/../',
				  output: 'http://www.example.com/' },
			]

			for( i in urls ) {
				var inputUrl = urls[i].input;
				var outputUrl = urls[i].output;
				
				_url = UrlTool.nomalise( inputUrl, env );
				assert.equal( _url, outputUrl );
			}
		});

	});

});