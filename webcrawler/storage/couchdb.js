var couchdb = exports = module.exports = {};

couchdb.init = function(options) {
	this.options = { 
		host: "http://127.0.0.1:5984",
		dbname: "web-crawler" };

	for( i in options ) {
		this.options[ i ] = options[ i ];
	}

	this.nano = require('nano')( this.options.host );
	this.db = this.nano.use( this.options.dbname );
}

couchdb.getDB = function() {
	return this.db;
}

couchdb.getNano = function() {
	return this.nano;
}

couchdb.destroy = function( callback ) {
	this.nano.db.destroy( this.options.dbname, function(err, body) {
		if( err && err.status_code != 404 ) {
			console.log( err );
			throw new Exception( err.code );
		}

		callback();
	});
}

couchdb.create = function( callback ) {
	this.nano.db.create( this.options.dbname, function(err, body) {
		if( callback == undefined ) {
			return;
		}
		else if( err ) {
			callback();
		}
		else {
			couchdb.createDesignDoc( callback );
		}
	});
}

couchdb.createDesignDoc = function( callback ) {
	var desQueue = {
	   "_id": "_design/queue",
	   "language": "javascript",
	   "views": {
	       "url": {
	           "map": "function(doc) {\n  if( doc.schema && doc.schema == 'url' && doc.visited == 0 ) {\n    emit(null, doc);\n  }\n}"
	    	}
		}
	};

	var desDocument = {
	   "_id": "_design/documents",
	   "language": "javascript",
	   "views": {
	       "all": {
	           "map": "function(doc) {\n  if( doc.schema && doc.schema == 'document' ) {\n    emit(null, doc);\n  }\n}"
	    	}
		}
	};

	var db = this.db;

	db.insert( desQueue, desQueue._id, function(err, body) {
		if( err && err.code == 'ECONNREFUSED' ) {
			console.log( err );
			throw new Exception( err.code );
		}

		db.insert( desDocument, desDocument._id, function(err, body) {
        	callback();
    	});
	});
}