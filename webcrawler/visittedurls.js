var VisittedUrls = exports = module.exports = {};

VisittedUrls.links = {};

VisittedUrls.add = function( url ) {
	/**
	 *	Hack to remove references to the parent objects 
	 *  and avoid memory leak
	 */
	url = url + 'x';
	url = url.substring(0, url.length - 1);

	VisittedUrls.links[ url ] = 1;
}

VisittedUrls.exists = function( url ) {
	return VisittedUrls.links[ url ] != undefined;
}

VisittedUrls.setLinks = function( links ) {
	VisittedUrls.links = links;
}