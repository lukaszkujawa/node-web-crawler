exports = module.exports = Wait;

function Wait(options) {
	this.options = options;

	this.delay = this.options.seconds * 1000;
}

Wait.prototype.execute = function(callback, data, env) {
	env.agent.log( "wait for " + this.delay, this );

	setTimeout(callback, this.delay);
}