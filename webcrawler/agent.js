var async = require('async');
var http = require('http');
var https = require('https');
var Url = require('url');
var UrlTool = require('./utils/urltool');
var Scheduler = require( './job/scheduler' );
var agent = exports = module.exports = {};
var cheerio = require('cheerio');

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
	var couchdb = require( './storage/couchdb' ),
		self = this;

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
	  		var seedUrl = config.getSeedUrl();
	  		if( ! seedUrl ) {
	  			var scheduler = new Scheduler();
	  			var env = { agent: self };
	  		}
			for( var i = 0 ; i < workersCount ; i++ ) {
	    		setTimeout(function () {
	    			if( seedUrl ) {
	      				agent.queue( seedUrl );
	      			}
	      			else {
	      				scheduler.execute( false, false, env );
	      			}
	    		}, 500 * i );
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

agent.queue = function( url, data ) {
	var self = this;
	
	process.nextTick(function(){
		var task = Url.parse( url );
		if( data != undefined ) {
			task.data = data;
		}
		
		self._queue.push( task );
	});
}

agent.use = function( job ) {
	var self = this;
	this.middleware.push( job );
}

agent.worker = function(task, callback) {
	var self = this;
	var reqHandler = http;

	if( task.protocol.match( /^https/ ) ) {
		reqHandler = https;
		task.requestCert = false;
    	task.rejectUnauthorized = false;
	}

	var req = reqHandler.request(task, function(res) {
		self.onRequest( res, task, callback );
	});

	req.on('error', function(e) {
		self.onError( e, task, callback );
	});

	req.end();
}

agent.onError = function( e, task, callback ) {
	console.log(' * request error: ' + e.message + ' "' + task.href + '"');
	var scheduler = new Scheduler();
	var env = { agent: this };
	
	scheduler.execute( callback, null, env );
}

agent.followRedirect = function( res, task, callback ) {
	if( ( res.statusCode == 301 || res.statusCode == 302 ) && res.headers['location'] ) {

		try {
			var source = task.source == undefined ? [] : task.source;
			var env = {task: task};

			source.push( task.href );
			task = Url.parse( UrlTool.nomalise( res.headers['location'], env ) );
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

	if( env.res.headers['content-type'] != undefined && env.res.headers['content-type'].match( /^text\/html/) ) {
		data = cheerio.load( data );
	}

	for( i in this.middleware ) {
		var job = self.middleware[ i ];
		chain.push( self.getJobFunction( job, data, env ) );
	}

	async.series( chain, callback );
}

agent.getJobFunction = function( job, data, env ) {
	return function( callback ) {
		job.execute( callback, data, env );
	}
}
