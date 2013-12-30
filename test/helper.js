var Url = require('url');

module.exports.getEnv = function( url ) {

     return {
          task: Url.parse( url ),
          agent: {
          	log: function(){}
          },
          res: {
               headers: {
                    "content-type": "text/html"
               }
          }
     }

}