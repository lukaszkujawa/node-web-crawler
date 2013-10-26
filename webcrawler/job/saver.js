exports = module.exports = Saver;
var WebDoc = require( '../storage/doc/webdoc' );


function Saver(options) {
	this.options = options;
}

Saver.prototype.execute = function(callback, data, env) {
	var webDoc = new WebDoc({
		content: data,
		type: env.res.headers['content-type'],
		length: env.res.headers['content-length'],
		hostname: env.task.host,
		uri: env.task.path,
		port: env.task.port == null ? 80 : env.task.port,
		protocol: env.task.protocol
	});

	webDoc.insert(function(){
		callback();
	});
}