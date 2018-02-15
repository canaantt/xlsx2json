// Node Specific
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const zlib = require('zlib');

// Generic Functions
(function() {
    var Save = (() => {
   
      server = (sheet, projectId) => { 
        return 'url of file';
      }
      
      return {
        server: server
      };
    })();
  
    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
      module.exports = Save;
    else
      window.Save = Save;
  
  })();
  