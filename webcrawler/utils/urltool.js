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

	/**
	 * handle go back "/../" 
	 */
	if( url.match(/\/\.\.\//)  ) {
		var tmp = url.split('/');
		for( var x = 3 ; x < tmp.length ; x++ ) {
			if( tmp[x] == '..' ) {
				delete tmp[x];
			}
			else if( tmp[ x + 1 ] != undefined && tmp[ x + 1 ] == '..' ) {
				delete tmp[x];
				delete tmp[x+1];
				x += 1;	
			}
		}
		url = tmp.join('/');
		/*
		while( url.match(/\/\.\.\//) ) {
			url = url.replace( /[^\/]+\/\.\.\//, '' );
		}
		*/
	}

	for( i in plugins ) {
		var plugin = plugins[ i ];
		if( plugin.replacement != undefined ) {
			url = url.replace( plugin.pattern, plugin.replacement );
		}
		else if( url.match( plugin.rule ) ) {
			url = plugin.process( url );
		}
	}

	url = url.replace( /([^:])\/[\/]+/, '$1/' );
	url = url.replace( /#.*$/, '' );

	return url;	
}