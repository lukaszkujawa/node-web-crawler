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
		,5 );
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

	res.setEncoding('utf8');

	res.on('data', function (chunk) {
		data += chunk;
	});

	res.on('end', function() {
		self.handleData( data, task, res, callback );
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

	async.series(chain,
				function(err, results){
					callback();
	});
}

agent.getJobFunction = function( job, data, env ) {
	return function( callback ) {
		job.execute( callback, data, env );
	}
}
