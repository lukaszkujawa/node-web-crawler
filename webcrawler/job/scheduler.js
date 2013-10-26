var UrlDoc = require( '../storage/doc/urldoc' );

exports = module.exports = Scheduler;

function Scheduler(options) {
	this.options = options;
}

Scheduler.prototype.execute = function(callback, data, env) {
	UrlDoc.pop(function( doc ) {
		env.agent.queue( doc.getUrl() );
		callback();
	});
}