var couchdb = require( '../couchdb' );
var async = require( 'async' );
var UrlDoc = require('./urldoc');

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

WebDoc.addSourceByUrl = function( url, source ) {
	var urlDoc = new UrlDoc( url );
	var id = WebDoc._getId( urlDoc.fields );

	console.log( urlDoc.fields );
	console.log( " add source: " + id );

	WebDoc.getById( id, function(doc) {
		if( ! doc ) {
			doc = new WebDoc({
				hostname: urlDoc.fields.hostname,
				uri: urlDoc.fields.uri,
				port: urlDoc.fields.port == null ? 80 : urlDoc.fields.port,
				protocol: urlDoc.fields.protocol,
				source: []
			});
		}

		if( doc.fields.source.indexOf( source ) > -1 ) {
			return;
		}

		doc.fields.source.push( source );
		doc._insertDocument();
	});
}

WebDoc.getById = function( id, callback ) {
	couchdb.getDB().get( id, function( err, body ) {
		if( err ) {
			callback( false );
		}
		else {
			callback( new WebDoc( body ) );
		}
	});
}

WebDoc.prototype.setData = function( data ) {
	this._data = data;
}

WebDoc.prototype.initFromObject = function( object ) {
	for( i in object ) {
		this.fields[ i ] = object[ i ];
	}
}

WebDoc.prototype.save = function( callback ) {
	var self = this;
	self._insertDocument(function(err, id, rev ){
		if( err ) {
			this.fields._rev = rev;
			self.save( callback );
		}
		else if( callback ) {
			callback();
		}
	});
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
		if( err && err.error == 'conflict' ) {
			WebDoc.getById( id, function(doc) {
			   	self.fields._rev = doc.fields._rev;
			   	self.mergeSources( doc );

				self._insertDocument( callback );
			});
		}
		else if( err ) {
			console.log( err );
		}
		else if( callback ) {
			callback( err, id, body != undefined ? body.rev : '1' );
		}
	});
}

WebDoc.prototype.mergeSources = function( doc ) {
   	for( var i = doc.fields.source.length  - 1 ; i >= 0 ; i-- ) {
   		if( this.fields.source.indexOf( doc.fields.source[ i ] ) ) {
   			return;
   		}

   		this.fields.source.push( doc.fields.source[ i ] );
   	}
}

WebDoc.prototype._insertAttachment = function( id, rev, callback ) {
	var self = this,
		db = couchdb.getDB(),
		contentType = self.fields.contentType;
	
	if( self._data == null || self._data.length == 0 ) {
		return callback();
	}
	
	if( contentType != undefined && contentType.match( /text/ ) ) {
		var buffer = new Buffer( self._data, "utf8" );
	}
	else {
		var buffer = new Buffer( self._data, "binary" );
	}

	db.attachment.insert( id, 'content', buffer, contentType, {rev: rev}, function(err, body) { 
		callback();
	});
}


WebDoc.prototype.getFields = function() {
	return this.fields;
}

WebDoc.prototype.getId = function() {
	return WebDoc._getId( this.fields );
}

WebDoc._getId = function( obj ) {
	return 'doc-' + obj.protocol + obj.port + '-' + obj.hostname + obj.uri;
}