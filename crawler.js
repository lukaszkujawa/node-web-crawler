var argv = require('optimist').argv;
var fs = require('fs');

var agent = require('./webcrawler/agent');
var Config = require( './webcrawler/config' );

console.log( "" );

if( argv._[0] == undefined ) {
  console.log( "Usage: node crawler.js [config.json]" );
  console.log( "" );
  console.log( "Example: node crawler.js conf.example.json" );
  console.log( "" );
  process.exit(1);
}

var file = __dirname + '/' + argv._[0];

fs.readFile(file, 'utf8', function (err, data) {

  if (err) {
    console.log( 'Unable to load "%s"', file );
    console.log( '' );
    console.log( 'Error message:' );
    console.log( err );
    console.log( '' );
    process.exit(1);
  }

  try {
    data = JSON.parse(data);
  }
  catch( e ) {
    console.log( 'Unable to parse config file "%s"', file );
    console.log( '' );
    console.log( 'Error message:' );
    console.log( e );
    console.log( '' );
    process.exit(1);
  }

  agent.initFromConfig( new Config( data ) );

});
