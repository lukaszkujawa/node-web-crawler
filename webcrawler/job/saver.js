exports = module.exports = Saver;
var WebDoc = require( '../storage/doc/webdoc' );


function Saver(options) {
	this.options = options;
}

Saver.prototype.execute = function(callback, data, env) {
	var webDoc = new WebDoc({
		contentType: env.res.headers['content-type'],
		length: env.res.headers['content-length'],
		hostname: env.task.host,
		uri: env.task.path,
		port: env.task.port == null ? 80 : env.task.port,
		protocol: env.task.protocol,
		source: env.task.source == undefined ? null : env.task.source
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

