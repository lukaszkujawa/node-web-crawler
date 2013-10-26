var couchdb = require( '../couchdb' );

exports = module.exports = UrlDoc;

function UrlDoc( options ) {
	this.fields = {
		hostname: null,
		protocol: "http",
		port: 80,
		uri: "/",
		schema: "url",
		lastModified: new Date(),
		visited: 0
	}

	if( typeof( options )  == 'string' ) {
		this.initFromUrl( options );
	}
	else if( typeof( options )  == 'object' ) {
		this.initFromObject( options );
	}
}

UrlDoc.pop = function( callback ) {
	couchdb.getDB().view('queue', 'url', { limit: 1 }, function( err, body ) {
		var doc = new UrlDoc( body.rows[0].value );
		doc.fields.visited = 1;
		doc.fields.lastModified = new Date();

		doc.insert( function() {
			callback( doc );
		});	
	});
}

UrlDoc.prototype.getUrl = function() {
	var f = this.fields;
	return f.protocol + '://' + f.hostname + f.uri;
}

UrlDoc.prototype.getId = function() {
	return 'url-' + this.fields.hostname + this.fields.uri;
}

UrlDoc.prototype.insert = function( callback ) {
	couchdb.getDB().insert( 
		this.getFields(), this.getId(), function(err, body) {
			if( callback != undefined ) callback();
	});
}

UrlDoc.prototype.initFromObject = function( object ) {
	for( i in object ) {
		this.fields[ i ] = object[ i ];
	}
}

UrlDoc.prototype.initFromUrl = function( url ) {
	var parts = url.match( /(http[s]{0,1}):\/\/([^\/]+)($|\/.*)/ );

	if( parts ) {
		this.fields.protocol = parts[1];
		this.fields.hostname = parts[2];
		this.fields.uri = parts[3];
	}
}

UrlDoc.prototype.getFields = function() {
	return this.fields;
}
