var Url = require('url');

module.exports.getEnv = function( url ) {

     return {
          task: Url.parse( url ),
          agent: {},
          res: {
               headers: {
                    "content-type": "text/html"
               }
          }
     }

}