exports = module.exports = Logger;

function Logger(options) {
	this.options = options;
}

Logger.prototype.execute = function(callback, data, env) {
	var url = env.task.hostname;
	if( env.task.port != null ) {
		url += ':' + env.task.port;
	}
	url +=  env.task.path;
	
	console.log( "Processing: " + url );
	callback();
}