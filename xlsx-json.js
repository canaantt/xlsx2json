const jsonfile = require("jsonfile");
const _ = require("underscore");
const XLSX =require("xlsx");
const fs = require('fs');

var workbook = XLSX.readFile("demo.xlsx");
_.uniq(Object.keys(workbook.Sheets['PATIENTEVENT-CHEMO']).map(k=>workbook.Sheets['PATIENTEVENT-CHEMO'][k].t));
Object.keys(workbook.Sheets['PATIENTEVENT-CHEMO']).filter(k=>workbook.Sheets['PATIENTEVENT-CHEMO'][k].t == 'undefined');
var allSheetNames =  Object.keys(workbook.Sheets);
allSheetNames.forEach(function(sheetname){
    var sheet = {
        type : sheetname.split('-')[0].toUpperCase(),
        data : null,
        header: null
    };
    if(sheet.type === 'PATIENT') {
        var data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetname], 
            { header:1, skipUndefined: false, defval: null});
        sheet.header = data[0];
        data.splice(0, 1);
        sheet.data = data;
        var obj = {};
        var ids = sheet.data.map(d=>d[0]);
        var fields = {};
        var loc = Object.keys(workbook.Sheets.PATIENT).filter(k=>k[1]=='2'&& k.length==2);
        var colTypes = loc.map(c=>workbook.Sheets.PATIENT[c].t);
        loc.forEach(function(l, i){
            var v;
            if(colTypes[i] === 'n') {
                var string2float = sheet.data.map(d=>parseFloat(d[i]));
                v = {
                    'min' : _.min(string2float),
                    'max' : _.max(string2float)
                }
            } else {
                v = _.uniq(sheet.data.map(d=>d[i]));
            }
            fields[sheet.header[i]] = v;
        });
        obj.ids = ids;
        obj.fields = fields;
        obj.value = sheet.data.map(d=>{
            var arr = [];
            console.log(d);
            d.map(function(v, i){
                console.log(i);
                if(colTypes[i] === 'n'){
                    arr.push(parseFloat(d[i]));
                } else {
                    if(d[i] === 'undefined'){
                        console.log('***');
                        console.log(d);
                    }
                    arr.push(fields[sheet.header[i]].indexOf(d[i]));
                }
            }); 
            return arr;
        });

    } else if (sheet.type === 'SAMPLE') {

    } else if (sheet.type === 'GENESETS') {

    } else if (sheet.type === 'MUTATIONS') {

    } else if (sheet.type === 'MATRIX') {

    }
});