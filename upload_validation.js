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
// connection.once('open', function() {
//     var db = connection.db; 
//     db.collection('z_lookup_genemap').find().toArray(function(err, data) {
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
    get_headers: function(sheet, headerLineNum) {
        var loc = Object.keys(sheet).filter(k=>k[1]==headerLineNum && k.length==2 && sheet[k].t !== 'z');
        return loc.map(l=>sheet[l].v);
    },
    get_fieldValues: function(sheet, headerLineNum, header) {
        var loc = Object.keys(sheet).filter(k=>k[1]==headerLineNum && k.length==2);
        var headers = loc.map(l=>sheet[l].v.toUpperCase());
        var re = /[A-Z]/gi;
        var header_loc = loc[headers.indexOf(header)].match(re)[0];
        var found = Object.keys(sheet).filter(k=>k.match(re)[0] === header_loc);
        var value = found.map(l=>sheet[l]).filter(f=>'v' in f).map(f=>f.v);
        value.splice(0, headerLineNum);
        return value;
    },
    check_uniqueness: function(arr) {
        return arr.length == new Set(arr).size;
    },
    field_existence: function(header, requiredFieldArr) {
        var error = {};
        var header2Upper = header.map(h=>h.toUpperCase());
        error['field_existence'] = {
            'missing_fields': requiredFieldArr.filter(fn=>header2Upper.indexOf(fn)==-1)
        };
        return error;
    },
    overlapping: function(array1, refArr) {
        var a = new Set(array1);
        var b = new Set(refArr);
        var intersection = new Set([...a].filter(x => b.has(x)));
        var difference = new Set([...a].filter(x => !b.has(x)));
        var intersectionPercentage = intersection.size/a.size * 100;
        var differencePercentage = difference.size/a.size * 100;
        return {'overlapped': intersectionPercentage,
                'notInRef': differencePercentage};
    },
    getAllIndexes: function(arr, val) {
        var indexes = [], i = -1;
        while ((i = arr.indexOf(val, i+1)) != -1){
            indexes.push(i);
        }
        return indexes;
    },
    Type_Category_inclusion: function(sheet) {
        var error = {};
        var subCategoryArr = this.get_fieldValues(sheet, 1, 'TYPE');
        var categoryArr = this.get_fieldValues(sheet, 1, 'CATEGORY');
        var err = {};
        _.uniq(subCategoryArr).forEach(sc=>{
            var cat =_.uniq(this.getAllIndexes(subCategoryArr, sc).map(ind=>categoryArr[ind]));
            if( cat.length > 1){
                err[sc] = cat; 
            }
        });
        error['subCategoryMatchMultipleCategory'] = err;
        return error;
    }
};

var requirements = {
    'PATIENT':{
        'required_fields':['PATIENTID'],
        'unique_fields':['PATIENTID'],
        'headerLineNum': 1,
        'required': true
    },
    'SAMPLE':{
        'required_fields':['SAMPLEID', 'PATIENTID'],
        'unique_fields':['SAMPLEID'],
        'headerLineNum': 1,
        'required': true
    },
    'EVENT':{
        'required_fields':['PATIENTID', 'CATEGORY', 'TYPE', 'STARTDATE', 'ENDDATE'],
        'headerLineNum': 1,
        'dependencies': ['PATIENT'],
        'sheet_specific_checking': ['Type_Category_inclusion'],
        'required': false
    },
    'GENESETS':{
        'headerLineNum': null,
        'required': false
    },
    'MUT':{
        'headerLineNum': 3,
        'dependencies': ['SAMPLE'],
        'required': false
    },
    'MATRIX':{
        'headerLineNum': 3,
        'dependencies': ['SAMPLE'],
        'required': false
    }
};

exports.preUploading_sheetLevel_checking = function(workbook) {
        var error = {};
        var allSheetNames =  workbook.SheetNames;
        var index = 0;
        allSheetNames.forEach(function(sheetName) {
            var err = {};
            var type = sheetName.split('-')[0].toUpperCase();
            if('required_fields' in requirements[type]){
                var header = helpingFunctionFactory.get_headers(workbook.Sheets[sheetName], 1);
                var requiredFields = requirements[type]['required_fields'];
                err['required_fields'] = helpingFunctionFactory.field_existence(header, requiredFields);
            }
            if('unique_fields' in requirements[type]){
                var uniqueFields = requirements[type]['unique_fields']; 
                var e = {};
                uniqueFields.forEach(uniqueField=>{
                    var headerLineNum = requirements[type]['headerLineNum'];
                    var unique_field_values = helpingFunctionFactory.get_fieldValues(workbook.Sheets[sheetName], headerLineNum, uniqueField);
                    e[uniqueField] = helpingFunctionFactory.check_uniqueness(unique_field_values);
                });
                err['unique_fields'] = e;
            }    
            /* Sheet-specific validation 
            [x] - Event - types and categories
            [ ] - Event - check the format of 'startDate' and 'endDate': ['timeStamp', 'number']
            [ ] - MATRIX & MUT - check the first three lines
            [x] - Sheet Dependencies
            */
            error[sheetName] = err;
        });
        return error;
};

exports.preUploading_allSheets_checking = {
    allSheets_existance: function(wb) {
        var obj = {};
        var required_sheetTypes = ['PATIENT', 'SAMPLE'];
        var permissible_sheetTypes = ['EVENT', 'GENESETS', 'MATRIX', 'MUT'];
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
        
        var error_dependencies = {};
        Object.keys(requirements).forEach(type=>{
            
            if('dependencies' in requirements[type]){
                error_dependencies[type] = requirements[type]['dependencies'].filter(s=>!sheetsSet.has(s));
            }
        });
        obj['error_dependencies'] = error_dependencies;
        return obj;
    },
    patientID_overlapping: function(jsonResult) {
        var evaluation = {};
        var pt_list = Object.keys(jsonResult.find(r=>r.type === 'PSMAP').res);
        var pt_related_sheets = jsonResult.filter(r=>['PATIENT', 'EVENT'].indexOf(r.type) > -1);
        pt_related_sheets.forEach(sheet=>{
            switch (sheet.type) {
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
        var sample_related_sheets = jsonResult.filter(r=>['MATRIX', 'MUT', 'SAMPLE'].indexOf(r.type) > -1);
        sample_related_sheets.forEach(sheet=>{
            evaluation[sheet.name] = helpingFunctionFactory.overlapping(sheet.res.ids, sample_list);
        });
        return evaluation;
    },
    geneIDs_overlapping: function(jsonResult) {
        var evaluation = {};
        var hugo_genes = gene_mapping.map(g=>g.s);
        var hugo_alias = gene_mapping.map(g=>g.a);
        // jsonResult.map(r=>Object.keys(r.res));
        var sample_related_sheets = jsonResult.filter(r=>['MATRIX', 'MUT', 'GENESETS'].indexOf(r.type) > -1);
        sample_related_sheets.forEach(sheet=>{
            if(sheet.type === 'GENESETS') {
                var eva = {};
                Object.keys(sheet.res).forEach((k)=> {
                    eva[k] = helpingFunctionFactory.overlapping(sheet.res[k], hugo_genes);
                });
                evaluation[sheet.name] = eva;
            } else {
                var eva = {};
                evaluation[sheet.name] = helpingFunctionFactory.overlapping(sheet.res.genes, hugo_genes);
            }
        });
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


