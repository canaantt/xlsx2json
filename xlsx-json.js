const jsonfile = require("jsonfile");
const _ = require("underscore");
const XLSX =require("xlsx");
const fs = require('fs');

var workbook = XLSX.readFile("demo.xlsx", {sheetStubs: true});

var xlsx2json = function(workbook){
    var allSheetNames =  Object.keys(workbook.Sheets);
    allSheetNames.forEach(function(sheetName){
        var sheet = {
            type : sheetName.split('-')[0].toUpperCase(),
            data : null,
            header: null
        };
        var data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], 
            { header:1, raw:true});
        if(sheet.type === 'PATIENT') {
            sheet.header = data[0];
            data.splice(0, 1);
            sheet.data = data;
            var obj = {};
            var ids = sheet.data.map(d=>d[0]);
            var fields = {};
            var loc = Object.keys(workbook.Sheets.PATIENT).filter(k=>k[1]=='1'&& k.length==2);
            var colTypes = loc.map(c=>{
                var row = 2;
                while (workbook.Sheets.PATIENT[c[0]+row].t === 'z') {
                    row++;
                }
                return workbook.Sheets.PATIENT[c[0]+row].t;
            });
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
                    if(v.indexOf(undefined) > -1) {
                        v.splice(v.indexOf(undefined), 1);
                    }
                }
                fields[sheet.header[i]] = v;
            });
            obj.ids = ids;
            obj.fields = _.omit(fields, 'patientID');
            obj.value = sheet.data.map(d=>{
                var arr = [];
                d.forEach(function(v, i){
                    if(colTypes[i] === 'n'){
                        if(d[i] !== undefined) {
                            arr[i] = parseFloat(d[i]);
                        }
                    } else {
                        if(d[i] !== undefined) {
                            arr[i] = fields[sheet.header[i]].indexOf(d[i]);
                        }
                    }
                }); 
                return arr;
            });
            console.log(obj);
            // jsonfile.writeFile('demo-patient.json', obj, function (err) {
            //     console.error(err)
            //   });
        } else if (sheet.type === 'SAMPLE') {
            sheet.header = data[0];
            data.splice(0, 1);
            sheet.data = data;
            var sampleIDLocation = sheet.header.map(n=>n.toUpperCase()).indexOf('SAMPLEID');
            var patientIDLocation = sheet.header.map(n=>n.toUpperCase()).indexOf('PATIENTID');
            var keys = _.uniq(data.map(d=>d[patientIDLocation]));
            var patientSampleMapping = {};
            keys.forEach(k=>{
                patientSampleMapping[k] = data.filter(d=>d[patientIDLocation]===k)
                                            .map(d=>d[sampleIDLocation]);
            });
            console.log(patientSampleMapping);
            // jsonfile.writeFile('demo-sample.json', data, function (err) {
            //     console.error(err)
            //   });
            // jsonfile.writeFile('demo-psmap.json', patientSampleMapping, function (err) {
            //     console.error(err)
            //   });
        } else if (sheet.type === 'PATIENTEVENT') {
            sheet.header = data[0];
            data.splice(0, 1);
            var obj = {};
            var map = {};
            var headerUpperCase = sheet.header.map(n=>n.toUpperCase());
            var patientIDLocation = headerUpperCase.indexOf('PATIENTID');
            var categoryLocation = headerUpperCase.indexOf('CATEGORY');
            var typeLocation = headerUpperCase.indexOf('TYPE');
            var startDateLocation = headerUpperCase.indexOf('STARTDATE');
            var endDateLocation = headerUpperCase.indexOf('ENDDATE');
            var reservedHeaderLocations = [patientIDLocation, categoryLocation, typeLocation, startDateLocation, endDateLocation];
            var customHeaders = sheet.header.filter((h, i)=>reservedHeaderLocations.indexOf(i) === -1);

            var uniqueTypes = _.uniq(data.map(d=>d[typeLocation]));
            uniqueTypes.forEach(t=>{
                map[t]=data.find(d=>d[typeLocation]===t)[categoryLocation];
            });
            var value = data.map(d=>{
                var arr = [];
                arr[0] = d[0];
                arr[1] = uniqueTypes.indexOf(d[typeLocation]);
                arr[2] = d[startDateLocation];
                arr[3] = d[endDateLocation];
                var o = {};
                customHeaders.forEach(h=>{
                    o[h] = d[sheet.header.indexOf(h)];
                });
                arr[4] = o;
                return arr;
            });
            obj.map = map;
            obj.value = value;
            console.log(obj);
            // jsonfile.writeFile('demo-events.json', obj, function (err) {
            //     console.error(err)
            //   });
        } else if (sheet.type === 'GENESETS') {
            var genesets = {};
            data.forEach(d=>{
                if(d.length !== 0){
                    var k = d[0];
                    d.splice(0, 1);
                    genesets[k] = _.uniq(d);
                }
            });
            console.log(genesets);
            // jsonfile.writeFile('demo-genesets.json', genesets, function (err) {
            //     console.error(err)
            //   });
        } else if (sheet.type === 'MUTATIONS') {

        } else if (sheet.type === 'MATRIX') {
            var obj = {};
            sheet.tableType = data[0][1];
            sheet.tableName = data[1][1];
            data[2].splice(0, 1);
            var ids = data[2];
            data.splice(0, 3);
            var genes = data.map(d=>d[0]);
            var values = data.map(d=>{
                d.splice(0, 1);
                return d.map(dd=>parseFloat(dd))
            });
            obj.ids = ids;
            obj.genes = genes;
            obj.values = values;
            console.log(obj);
            // jsonfile.writeFile('demo-'+sheet.tableType+'.json', obj, function (err) {
            //     console.error(err)
            //   });
        }
    });
};


