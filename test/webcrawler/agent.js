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

		/*
		it('should follow redirect on 301 and 302', function( done ) {
			var workerFunc = agent.worker;

		});
		*/

	});

});