var async = require('async');
var http = require('http');
var Url = require('url');

var agent = exports = module.exports = {};

agent.initFromConfig = function( config ) {
	var async = require( 'async' );
	var job = require('./job');
	
	agent.init({ workers: config.getWorkers() });

	var jobs = config.getJobs();
	for( i in jobs ) {
		var JobClass = require('./job/' + jobs[ i ].name );
		var job = new JobClass( jobs[ i ] );
		agent.use( job );
	}

	agent._run( config );
}

agent._run = function( config ) {
	var couchdb = require( './storage/couchdb' );
	couchdb.init({ dbname: config.getDatabaseName() });

	async.waterfall([
		function(callback){
			if( config.getDatabaseRebuild() ) {
				couchdb.destroy( callback );
			}
			else {
	    		callback();
	    	}
	  	},
	  	function(callback){
	    	couchdb.create( callback );
	  	}], 
	  	function (err, result) {
	  		var workersCount = config.getWorkers();
			for( var i = 0 ; i < workersCount ; i++ ) {
	    		setTimeout(function () {
	      			agent.queue( config.getSeedUrl() );
	    		}, 1000 * i );
	 		} 
	 	}  
	);
}

agent.init = function( options ) {
	var self = this;
	this.options =
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
	console.log('request error: ' + e.message + ' "' + task + '"');
	this.queue( task );
	callback();
}

agent.followRedirect = function( res, task, callback ) {
	if( ( res.statusCode == 301 || res.statusCode == 302 ) && res.headers['location'] ) {
		try {
			var source = task.source == undefined ? [] : task.source;
			source.push( task.href );
			task = Url.parse( res.headers['location'] );
			task.source = source;
			this.worker( task, callback );
		}
		catch( e ) {
			callback();
		}

		return true;
	}

	return false;
}

agent.onRequest = function( res, task, callback ) {
	var self = this,
		data = '';

	if( this.followRedirect( res, task, callback ) ) {
		return;
	}
	
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
