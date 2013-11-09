var UrlDoc = require( '../storage/doc/urldoc' );

exports = module.exports = Scheduler;

function Scheduler(options) {
	this.options = options;
}

Scheduler.prototype.execute = function(callback, data, env) {
	var self = this;
	UrlDoc.pop(function( doc ) {
		if( self.retry( doc, callback, data, env ) ) {
			return;
		}
		
		var data = {
			source: doc.getSource()
		};

		env.agent.queue( doc.getUrl(), data );
		if( callback ) {
			try{
				callback();
			}
			catch(e){
				console.log( " * error: Scheduler callback already called" );
			}
		}
	});
}

Scheduler.prototype.retry = function( doc, callback, data, env ) {
	var self = this;

	if( doc == null ) {
		env._attempt = env._attempt == undefined ? 1 : env._attempt + 1;
		var wait = 5 * env._attempt;

		console.log( " * nothing to crawl going to sleep for %dsec", wait );

		setTimeout(function(){
			self.execute( callback, data, env );
		}, wait * 1000);

		return true;
	}

	return false;
}
