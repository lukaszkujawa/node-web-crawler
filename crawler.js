/*
var heapdump = require('heapdump')
var http = require('http');
http.createServer(function (req, res) {
  heapdump.writeSnapshot();
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end("Dumped!");
}).listen(9999);
*/

var argv = require('optimist').argv;
var fs = require('fs');

var agent = require('./webcrawler/agent');
var Config = require( './webcrawler/config' );

console.log( "" );

if( argv.c == undefined ) {
  console.log( "Usage: node crawler.js -c [config.json]" );
  console.log( "" );
  console.log( "Example: node crawler.js -c [conf.example.json]" );
  console.log( "" );
  process.exit(1);
}

var file = __dirname + '/' + argv.c;

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
