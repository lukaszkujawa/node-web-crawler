var UrlTool = exports = module.exports = {};

UrlTool.nomalise = function( url, env, plugins ) {
	/**
	 *	attach domain name to "/article/test"
	 */
	if( url.match( /^\/[^\/]+/ ) || url == '/' ) {
		url = env.task.protocol + '//' + env.task.hostname + url;
	}

	/**
	 *	attach url to relative link f.e. "hello/world"
	 */
	if( url.match( /^[^\/:]+(\/|$)/ ) ) {
		var base = env.task.href.replace( /\/[^\/]*$/, '/');
		url = base + '/' + url;
	}

	/**
	 *	attach protocol to "//example.com/"
	 */
	if( url.match( /^\/\// ) ) {
		url = env.task.protocol + url;
	}

	for( i in plugins ) {
		var plugin = plugins[ i ];
		if( url.match( plugin.rule ) ) {
			url = plugin.process( url );
		}
	}

	url = url.replace( /([^:])\/[\/]+/, '$1/' );

	return url;	
}