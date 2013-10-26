var async = require( 'async' );
var job = require('./webcrawler/job');
var couchdb = require( './webcrawler/storage/couchdb' );
var robot = require('./webcrawler/agent');

robot.init();
robot.use( new job.Logger() );
robot.use( new job.Saver() );
robot.use( new job.Driller( { domain: "social.local" } ) );
robot.use( new job.Scheduler() );

couchdb.init();

async.waterfall([
  function(callback){
    couchdb.destroy( callback );
  },
  function(callback){
    couchdb.create( callback );
  }
], function (err, result) {
    robot.queue( 'http://social.local/' );   
});


