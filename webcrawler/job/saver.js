exports = module.exports = Saver;
var WebDoc = require( '../storage/doc/webdoc' );


function Saver(options) {
	this.options = options;
}

Saver.prototype.execute = function(callback, data, env) {
	var task = env.task;
	var source = [];
	if( task.data != undefined && task.data.urlDoc != undefined ) {
		source = [ task.data.urlDoc.getLastSource() ];
	}

	var webDoc = new WebDoc({
		contentType: env.res.headers['content-type'],
		length: env.res.headers['content-length'],
		hostname: task.hostname,
		uri: task.path,
		port: task.port == null ? 80 : task.port,
		protocol: task.protocol,
		source: source
	});

	if( typeof( data ) == 'function' ) {
		webDoc.setData( data.html() );
	}
	else {
		webDoc.setData( data );
	}

	webDoc.insert(function(){
		callback();
	});
}

