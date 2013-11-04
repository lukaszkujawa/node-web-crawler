var couchdb = require( '../couchdb' );
var async = require( 'async' );

exports = module.exports = WebDoc;

function WebDoc( options ) {
	this.fields = {
		contentType: "",
		lastModified: new Date(),
		schema: "document",
		hostname: "",
		uri: "",
		port: 80,
		protocol: "http",
		source: null
	};

	this._data = null;

	if( typeof( options ) == 'object' ) {
		this.initFromObject( options );
	}
}

WebDoc.prototype.setData = function( data ) {
	this._data = data;
}

WebDoc.prototype.initFromObject = function( object ) {
	for( i in object ) {
		this.fields[ i ] = object[ i ];
	}
}

WebDoc.prototype.insert = function( callback ) {
	var self = this,
		db = couchdb.getDB();

	async.waterfall([
	    function(callback){
	        self._insertDocument( callback );
	    },
	    function(id, rev, callback){
	        self._insertAttachment( id, rev, callback );
	    }
	], function() {
	   callback();
	});
}

WebDoc.prototype._insertDocument = function( callback ) {
	var self = this,
		db = couchdb.getDB(),
		id = self.getId();

	db.insert( self.getFields(), id, function(err, body) {
		callback( err, id, body != undefined ? body.rev : '1' );
	});
}

WebDoc.prototype._insertAttachment = function( id, rev, callback ) {
	var self = this,
		db = couchdb.getDB(),
		contentType = self.fields.contentType;
	
	if( self._data == null || self._data.length == 0 ) {
		return callback();
	}
	
	db.attachment.insert( id, 'content', new Buffer( self._data, "binary" ), contentType, {rev: rev}, function(err, body) { 
		callback();
	});
}


WebDoc.prototype.getFields = function() {
	return this.fields;
}

WebDoc.prototype.getId = function() {
	var f = this.fields;
	
	return 'doc-' + f.protocol +  f.port + '-' + f.hostname + f.uri;
}