var couchdb = require( '../couchdb' );
var UrlDoc = require('./urldoc');
var WebDoc = require('./webdoc');

exports = module.exports = SourceDoc;

function SourceDoc( options ) {
	this.fields = {
		schema: "source",
		targetDoc: null,
		sourceDoc: null,
		source: "",
		refersTo: ''
	}

	for( i in options ) {
		this.fields[ i ] = options[ i ];
	}
}

SourceDoc.addSourceByUrl = function(url, source) {
	var targetUrl = new UrlDoc( url );
	var sourceUrl = new UrlDoc( source );

	var targetId = WebDoc._getId( targetUrl.fields );
	var sourceId = WebDoc._getId( sourceUrl.fields );

	var sourceDoc = new SourceDoc({
		targetDoc: targetId,
		sourceDoc: sourceId,
		refersTo: url,
		source: source
	});

	sourceDoc.insert();
}


SourceDoc.prototype.getFields = function() {
	return this.fields;
}

SourceDoc.prototype.getId = function() {
	return this.fields.targetDoc + '??' + this.fields.sourceDoc;
}

SourceDoc.prototype.insert = function(callback) {
	var self = this;

	couchdb.getDB().insert( this.getFields(), this.getId(), function(err, body) {
		if( callback ) {
			callback();
		}
	});
}