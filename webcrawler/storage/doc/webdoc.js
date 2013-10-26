var couchdb = require( '../couchdb' );

exports = module.exports = WebDoc;

function WebDoc( options ) {
	this.fields = {
		type: "text/html",
		lenght: 0,
		content: null,
		lastModified: new Date(),
		schema: "document",
		hostname: "",
		uri: "",
		port: 80,
		protocol: "http"
	};

	if( typeof( options )  == 'object' ) {
		this.initFromObject( options );
	}
}

WebDoc.prototype.initFromObject = function( object ) {
	for( i in object ) {
		this.fields[ i ] = object[ i ];
	}
}

WebDoc.prototype.insert = function( callback ) {
	couchdb.getDB().insert( 
		this.getFields(), this.getId(), function(err, body) {
			if( callback != undefined ) callback();
	});
}

WebDoc.prototype.getFields = function() {
	return this.fields;
}

WebDoc.prototype.getId = function() {
	var f = this.fields;
	
	return 'doc-' + '-' + f.protocol + ':' +  f.port + '-' + f.hostname + f.uri;
}