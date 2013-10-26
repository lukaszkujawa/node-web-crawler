exports = module.exports = Logger;

function Logger(options) {
	this.options = options;
}

Logger.prototype.execute = function(callback, data, env) {
	console.log( "Processing: " + env.task.hostname + env.task.path );
	callback();
}