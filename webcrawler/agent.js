var async = require('async');
var http = require('http');
var Url = require('url');

var agent = exports = module.exports = {};

agent.init = function( options ) {
	var self = this;
	this.options = options;
	this.middleware = [];
	this._queue = async.queue( function(task, callback) { 
		self.worker(task, callback) }
		,( options.workers == undefined ? 1 : options.workers ) );
}

agent.queue = function( url ) {
	var self = this;
	process.nextTick(function(){
		self._queue.push( Url.parse( url ) );
	});
}

agent.use = function( job ) {
	var self = this;
	this.middleware.push( job );
}

agent.worker = function(task, callback) {
	var self = this;

	var req = http.request(task, function(res) {
		self.onRequest( res, task, callback );
	});

	req.on('error', function(e) {
		self.onError( e, task, callback );
	});

	req.end();
}

agent.onError = function( e, task, callback ) {
	console.log('problem with request: ' + e.message);
	this.queue( task.url );
	callback();
}

agent.onRequest = function( res, task, callback ) {
	var self = this,
		data = '';

	if( res.headers['content-type'] != undefined && res.headers['content-type'].match( /^text/ ) ) {
		res.setEncoding('utf8');
	}
	else {
		res.setEncoding( 'binary' );
	}

	res.on('data', function (chunk) {
		data += chunk;
	});

	res.on('end', function() {
		self.handleData( data, task, res, callback );
		data = null;
	});
}

agent.handleData = function( data, task, res, callback ) {
	var self = this,
		chain = [],
		env = {
			agent: this,
			task: task,
			res: res
		};

	for( i in this.middleware ) {
		var job = self.middleware[ i ];
		chain.push( self.getJobFunction( job, data, env ) );
	}

	async.series( chain, callback );

	chain = null;
	data = null;
}

agent.getJobFunction = function( job, data, env ) {
	return function( callback ) {
		job.execute( callback, data, env );
	}
}
