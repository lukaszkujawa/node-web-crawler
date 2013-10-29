/*
var heapdump = require('heapdump')
var http = require('http');
http.createServer(function (req, res) {
  heapdump.writeSnapshot();
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end("Dumped!");
}).listen(9999);
*/

var async = require( 'async' );
var job = require('./webcrawler/job');
var couchdb = require( './webcrawler/storage/couchdb' );
var robot = require('./webcrawler/agent');
var WORKERS_COUNT = 20;

robot.init({workers: WORKERS_COUNT});
robot.use( new job.Logger() );
robot.use( new job.Saver() );
robot.use( new job.Driller( { domain: "flickr.com" } ) );
robot.use( new job.Driller( { selector: "img", attribute: "src" } ) );
robot.use( new job.Scheduler() );

couchdb.init();

async.waterfall([
  function(callback){
    callback();
    //couchdb.destroy( callback );
  },
  function(callback){
    couchdb.create( callback );
  }
], function (err, result) {
	for( var i = 0 ; i < WORKERS_COUNT ; i++ ) {
    setTimeout(function () {
      robot.queue( 'http://www.flickr.com/explore' );
    }, 500 * i );
  }   
});


