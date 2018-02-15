// Generic Functions
(function() {
    var Serializer = (function() {
   
      serializeSheet = (sheet, underscore) => { 
  
      }
  
      serializeManifest = (urls, dataTypes, dexieSchema) => { 
  
      }
      
      return {
          sheet: serializeSheet,
          manifest: serializeManifest
      };
    })();
  
    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
      module.exports = Serializer;
    else
      window.Serializer = Serializer;
  
  })();
  