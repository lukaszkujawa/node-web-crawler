var assert = require("assert");
var Response = require("../mock/response");
var agent = require("../../webcrawler/agent");
var Url = require('url');


describe('Agent', function(){

	describe( '#onRequest', function() {

		it('should set encoding to utf8 for text content type', function() {
			var res = new Response();
			var task = Url.parse( 'http://www.example.com/test' );
			agent.onRequest( res, task );
			assert.equal( res.getEncoding(), 'utf8' );
		});

		it('should set encoding to binary for non text content type', function() {
			var res = new Response();
			res.headers['content-type'] = 'image/png';
			var task = Url.parse( 'http://www.example.com/test' );
			agent.onRequest( res, task );
			assert.equal( res.getEncoding(), 'binary' );
		});

		
		it('should follow redirect on 301', function( done ) {
			var workerFunc = agent.worker;
			var task = Url.parse( 'http://www.example.com/test' );
			var res = new Response();
			res.statusCode = 301;
			res.headers['location'] = 'http://redirect.example.com/';

			agent.worker = function( callback ) {
				agent.worker = workerFunc;
				done();
			}

			agent.onRequest( res, task, function(){
				assert( false, 'Redirection failed' );
				agent.worker = workerFunc;
				done();
			});
		});

	});

	describe( '#followRedirect', function(){

		it('should return true for 302', function() {
			var workerFunc = agent.worker;
			var task = Url.parse( 'http://www.example.com/test' );
			var res = new Response();
			res.statusCode = 302;
			res.headers['location'] = 'http://redirect.example.com/';

			agent.worker = function( callback ) {
				agent.worker = workerFunc;
			}

			assert( agent.followRedirect( res, task, function(){}));
		});

		it('should return false for 200', function() {
			var task = Url.parse( 'http://www.example.com/test' );
			var res = new Response();
			assert( ! agent.followRedirect( res, task, function(){}));
		});

	});

});