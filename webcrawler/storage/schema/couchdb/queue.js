var designDoc = {
   _id: "_design/queue",
   language: "javascript",
   views: {
       queue: {
           map: "function(doc) {\n  if( doc.schema && doc.schema == 'queue' && \n      doc.lastUpdate == null ) {\n \n    emit(doc._id, doc);\n  }\n}"
       }
   }
};