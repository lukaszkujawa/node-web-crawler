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
		visited: 0,
		source: []
	}

	this.overwriteTimeDiff = -1;

	if( typeof( options )  == 'string' ) {
		this.initFromUrl( options );
	}
	else if( typeof( options )  == 'object' ) {
		this.initFromObject( options );
	}
}

UrlDoc.pop = function( callback ) {
	couchdb.getDB().view('queue', 'url', { limit: 1 }, function( err, body ) {
		if( err || body.rows == undefined || body.rows.length == 0 ) {
			return callback( null );
		}
		
		var doc = new UrlDoc( body.rows[0].value );
		doc.fields.visited = 1;
		doc.fields.lastModified = new Date();

		doc.insert( function( status, err ) {
			if( err ) {
				UrlDoc.pop( callback );
			}
			else {
				callback( doc );
			}
		});	
	});
}

UrlDoc.getById = function( id, callback ) {
	couchdb.getDB().get( id, function( err, body ) {
		if( err ) {
			throw new Exception( "Unable to load a url document: " + id );
		}

		var doc = new UrlDoc( body );
		callback( doc );
	});
}

UrlDoc.prototype.getSource = function() {
	return this.fields.source;
}

UrlDoc.prototype.setSource = function( source ) {
	this.fields.source = source;
}

UrlDoc.prototype.setSourceFromEnv = function( env ) {
	if( env.task.data != undefined && env.task.data.source != undefined ) {
		this.setSource( env.task.data.source.slice( 0 ) );
	}

	this.fields.source.push( env.task.href );
}

UrlDoc.prototype.setOverwrite = function( timeDiff ) {
	this.overwriteTimeDiff = timeDiff;
}

UrlDoc.prototype.getUrl = function() {
	var f = this.fields;
	return f.protocol + '//' + f.hostname + f.uri;
}

UrlDoc.prototype.getId = function() {
	return 'url-' + this.fields.hostname + this.fields.uri;
}

UrlDoc.prototype.insert = function( callback ) {
	var self = this;
	couchdb.getDB().insert( 
		this.getFields(), this.getId(), function(err, body) {
			if( err && self.overwriteTimeDiff > -1 && err.status_code == 409 ) {
				if( self.fields._rev != undefined ) {
					callback( null, err );
				}
				else {
					self.reinsert( callback );
				}
			}
			else if( callback != undefined ) { 
				callback( null, err );
			}
	});
}

UrlDoc.prototype.reinsert = function( callback ) {
	var self = this;
	UrlDoc.getById( this.getId(), function( doc ) { 
		var timeDiff = new Date().getTime() - new Date( doc.fields.lastModified ).getTime();

		if( timeDiff > self.overwriteTimeDiff ) {
			self.fields._rev = doc.fields._rev;
			self.insert( callback );
		}
		else {
			callback();
		}
	});
}

UrlDoc.prototype.initFromObject = function( object ) {
	for( i in object ) {
		this.fields[ i ] = object[ i ];
	}
}

UrlDoc.prototype.initFromUrl = function( url ) {
	var parts = url.match( /(http[s]{0,1}:)\/\/([^\/]+)($|\/.*)/ );

	if( parts ) {
		this.fields.protocol = parts[1];
		this.fields.hostname = parts[2];
		this.fields.uri = parts[3];
	}
}

UrlDoc.prototype.getFields = function() {
	return this.fields;
}

UrlDoc.prototype.getLastSource = function() {
	return this.fields.source[this.fields.source.length - 1];
}
