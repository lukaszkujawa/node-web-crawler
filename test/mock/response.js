exports = module.exports = Response;

function Response() {
	this.headers = {
		'content-type': 'text/html'
	}
}

Response.prototype.setEncoding = function( encoding ) {
	this.encoding = encoding;
}

Response.prototype.getEncoding = function() {
	return this.encoding;
}

Response.prototype.on = function() {

}

