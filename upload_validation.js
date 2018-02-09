/* input: workbook Object parsed by node package xlsx
   output: a reporting JSON object
*/

// region GENE_MAP
// const mongoose = require("mongoose");
// const jsonfile = require("jsonfile-promised");
// mongoose.connect(
//     'mongodb://oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017/v2?authSource=admin', {
//     db: {
//         native_parser: true
//     },
//     server: {
//         poolSize: 5,
//         reconnectTries: Number.MAX_VALUE
//     },
//     replset: {
//         rs_name: 'rs0'
//     },
//     user: process.env.MONGO_USERNAME,
//     pass: process.env.MONGO_PASSWORD
// });
// var connection = mongoose.connection;
// var gene_map;
// connection.once('open', function(){
//     var db = connection.db; 
//     db.collection('z_lookup_genemap').find().toArray(function(err, data){
//         if(err) console.log(err);
//         gene_map = data;
//         jsonfile.writeFile('gene_map.json', gene_map, function (err) {
//             console.error(err);
//         });
//     });
// });
// regionend

var exports = module.exports = {};
const _ = require('underscore');
var gene_mapping = require('./gene_map.json');
var helpingFunctionFactory = {
    get_headers: function(sheet, headerLineNum){
        var loc = Object.keys(sheet).filter(k=>k[1]==headerLineNum&& k.length==2);
        return loc.map(l=>sheet[l].v);
    },
    check_uniqueness: function(arr){
        return arr.length == new Set(arr).size;
    },
    field_existence: function(header, requiredFieldArr){
        var error = {};
        var header2Upper = header.map(h=>h.toUpperCase());
        error['field_existence'] = {
            'missing_fields': requiredFieldArr.filter(fn=>header2Upper.indexOf(fn)==-1)
        };
        return error;
    },
    overlapping: function(array1, refArr){
        var a = new Set(array1);
        var b = new Set(refArr);
        var intersection = new Set([...a].filter(x => b.has(x)));
        var difference = new Set([...a].filter(x => !b.has(x)));
        return {'overlapped': intersection,
                'notInRef': difference};
    }
};

var requirements = {
    'PATIENT':{
        'required_fields':['PATIENTID'],
        'unique_fields':['PATIENTID'],
        'required': true
    },
    'SAMPLE':{
        'required_fields':['SAMPLEID', 'PATIENTID'],
        'unique_fields':['SAMPLEID'],
        'required': true
    },
    'EVENT':{
        'required_fields':['PATIENTID', 'CATEGORY', 'TYPE', 'STARTDATE', 'ENDDATE'],
        'unique_fields':['PATIENTID'],
        'required': false
    },
    'GENESETS':{
        'required_fields': null,
        'unique_fields': null,
        'required': false
    },
    'MUTATIONS':{
        'required_fields': null,
        'unique_fields': null,
        'required': false
    },
    'MATRIX':{
        'required_fields': null,
        'unique_fields': null,
        'required': false
    }
};

exports.preUploading_sheetLevel_checking = function(workbook) {
        var allSheetNames =  Object.keys(workbook.Sheets);
        allSheetNames.forEach(function(sheetName){
            var type = sheetName.split('-')[0].toUpperCase();
            if(type === 'PATIENT') {
                var header = helpingFunctionFactory.get_headers(wb.Sheets[sheetName], 1);
                var requiredFields = requirements['PATIENTID'];
                helpingFunctionFactory.field_existence(header, requiredFields);
                helpingFunctionFactory.check_uniqueness();
            } else if (type === 'SAMPLE') {

            } else if (type === 'EVENT') {

            } else if (type === 'GENESETS') {

            } else if (type === 'MUTATIONS') {

            } else if (type === 'MATRIX') {

            }
        });
};

exports.preUploading_allSheets_checking = {
    allSheets_existance: function(wb) {
        var obj = {};
        var required_sheetTypes = ['PATIENT', 'SAMPLE'];
        var permissible_sheetTypes = ['EVENT', 'GENESETS', 'MATRIX', 'MUTATION'];
        var sheetsSet = new Set(wb.SheetNames.map(n=>n.split('-')[0].toUpperCase()));
        obj['required_sheets'] = required_sheetTypes.map(s=>{
            var o = {};
            var sheetNames = wb.SheetNames.filter(n=>n.toUpperCase().indexOf(s)>-1);
            o[s] = {'exists': sheetsSet.has(s),
                    'sheetNames': sheetNames};
            return o;
        });
        obj['permissible_sheets'] = permissible_sheetTypes.map(s=> {
            var o = {};
            var sheetNames = wb.SheetNames.filter(n=>n.toUpperCase().indexOf(s)>-1);
            o[s] = {'exists': sheetsSet.has(s),
                    'sheetNames': sheetNames};
            return o;
        });
        return obj;
    },
    patientID_overlapping: function(jsonResult) {
        var evaluation = {};
        var pt_list = Object.keys(jsonResult.find(r=>r.type === 'PSMAP').res);
        var pt_related_sheets = jsonResult.filter(r=>['PATIENT', 'EVENT'].indexOf(r.type) > -1);
        pt_related_sheets.forEach(sheet=>{
            switch (sheet.type){
                case 'PATIENT':
                    evaluation[sheet.name] = helpingFunctionFactory.overlapping(sheet.res.ids, pt_list);
                    break;  
                case 'EVENT':
                    evaluation[sheet.name] = helpingFunctionFactory.overlapping(sheet.res.value.map(v=>v[0]), pt_list);
                    break;  
            }
        });
        return evaluation;
    },
    sampleID_overlapping: function(jsonResult) {
        var evaluation = {};
        var sample_list = _.values(jsonResult.find(r=>r.type === 'PSMAP').res).reduce((a, b) => a = a.concat(b));
        var sample_related_sheets = jsonResult.filter(r=>['MATRIX', 'MUTATION', 'SAMPLE'].indexOf(r.type) > -1);
        sample_related_sheets.forEach(sheet=>{
            console.log(sheet.name);
            switch(sheet.type){
                case 'MATRIX':
                    evaluation[sheet.name] = helpingFunctionFactory.overlapping(sheet.res.ids, sample_list);
                    break;
                case 'MUTATION':
                    evaluation[sheet.name] = helpingFunctionFactory.overlapping(sheet.res.ids, sample_list);
                    break;
                case 'SAMPLE':
                    evaluation[sheet.name] = helpingFunctionFactory.overlapping(sheet.res.ids, sample_list);
                    break;
            }
        });
        return evaluation;
    },
    geneIDs_overlapping: function(jsonResult) {
        var evaluation = {};
        var hugo_genes = gene_mapping.map(g=>g.s);
        var hugo_alias = gene_mapping.map(g=>g.a);
        // jsonResult.map(r=>Object.keys(r.res));
        var sheetTypes = jsonResult.map(j=>j.type);
        if (sheetTypes.indexOf('GENESETS') > -1){
            var eva = {};
            var genesets = jsonResult.find(r=>r.type === 'GENESETS').res;
            Object.keys(genesets).forEach((k)=> {
                eva[k] = helpingFunctionFactory.overlapping(genesets[k], hugo_genes);
            });
            evaluation['GENESETS'] = eva;
        } 
        if (sheetTypes.indexOf('MATRIX') > -1) {
            var eva = {};
            var matrices = jsonResult.filter(r=>r.type === 'MATRIX');
            matrices.forEach((mx)=>{
                eva[mx.name] = helpingFunctionFactory.overlapping(mx.res.genes, hugo_genes);
            });
            evaluation['MATRIX'] = eva;
        } 
        return evaluation;
    }
};

exports.postUploading_file_level_checking = {
    manifest_existance: function() {},
    file_existance_against_manifest: function() {}
};

exports.postUploading_authorization_checking = {
    /* require access to MongoDB, .env
    https://github.com/canaantt/compressors/blob/master/basic_tests.js
    */
};


