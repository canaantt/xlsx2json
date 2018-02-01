xls_to_json = require("xls-to-json");
xls_to_json({
    input: "demo.xlsx",  // input xls 
    output: "output.json", // output json 
    sheet: "SAMPLE"  // specific sheetname 
    }, function(err, result) {
    if(err) {
        console.error(err);
    } else {
        console.log(result);
    }
});
const jsonfile = require("jsonfile");
const _ = require("underscore");
const asyncLoop = require('node-async-loop');
const XLSX =require("xlsx");
const fs = require('fs');

sheetjs