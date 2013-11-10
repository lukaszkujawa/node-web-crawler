var VisittedUrls = exports = module.exports = {};

VisittedUrls.links = {};

VisittedUrls.add = function( url ) {
	VisittedUrls.links[ url ] = 1;
}

VisittedUrls.exists = function( url ) {
	return VisittedUrls.links[ url ] != undefined;
}

VisittedUrls.setLinks = function( links ) {
	VisittedUrls.links = links;
}