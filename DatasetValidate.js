// Generic Functions
(function() {
  var Validator = (function() {
 
    validateSheet = (sheet, requirements, genemap, underscore) => { 

    }

    validateWorkbook = (sheets, requirements, genemap, underscore) => { 

    }
    
    return {
        sheet: validateSheet,
        workbook: validateWorkbook
    };
  })();

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = Validator;
  else
    window.Validator = Validator;

})();
