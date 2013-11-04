var exports = module.exports = Config;

function Config( options ) {
	this.defaults = {
		workers: 5,
		databaseName: 'web-crawler'
	};

	this.options = options;
}

Config.prototype.getWorkers = function() {
	return this.options.workers == undefined ? this.defaults.workers : this.options.workers;
}

Config.prototype.getDatabaseName = function() {
	return this.options.database.name == undefined ? this.defaults.databaseName : this.options.database.name;
}

Config.prototype.getDatabaseRebuild = function() {
	return this.options.database.rebuild == undefined ? false : this.options.database.rebuild;
}

Config.prototype.getJobs = function() {
	return this.options.jobs;
}

Config.prototype.getSeedUrl = function() {
	return this.options.seedUrl;
}
