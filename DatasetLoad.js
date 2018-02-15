const XLSX =require("xlsx");

// Generic Functions
(function() {
    var Load = (function() {
   
      xlsx = (excelFile) => { 
        const workbook = XLSX.readFile(excelFile, {sheetStubs: true});
        return workbook.SheetNames.map( name => ({ name: name, data: workbook.Sheets[name] }));
      }
      
      return {
          xlsx: xlsx
      };
    })();
  
    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
      module.exports = Load;
    else
      window.Load = Load;
  
  })();
  