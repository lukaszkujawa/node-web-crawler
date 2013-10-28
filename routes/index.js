var couchdb = require('./../webcrawler/storage/couchdb');

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};