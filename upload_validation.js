/* input: workbook Object parsed by node package xlsx
   output: a reporting JSON object
*/

var exports = module.exports = {};
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
        'unique_fields':['PATIENTID'],
        'required': true
    },
    'EVENT':{
        'required_fields':['PATIENTID'],
        'unique_fields':['PATIENTID'],
        'required': false
    },
    'GENESETS':{
        'required_fields':['PATIENTID'],
        'unique_fields':['PATIENTID'],
        'required': false
    },
    'MUTATIONS':{
        'required_fields':['PATIENTID'],
        'unique_fields':['PATIENTID'],
        'required': false
    },
    'MATRIX':{
        'required_fields':['PATIENTID'],
        'unique_fields':['PATIENTID'],
        'required': false
    }
};

exports.preUploading_sheetLevel_checking = function(workbook) {
        var allSheetNames =  Object.keys(workbook.Sheets);
        allSheetNames.forEach(function(sheetName){
            var type = sheetName.split('-')[0].toUpperCase();
            if(type === 'PATIENT') {
                var header = helpingFunctionFactory.get_headers(wb.Sheets[sheetName]);
                var requiredFields = ['PATIENTID'];
                helpingFunctionFactory.field_existence(header,['PATIENTID']);
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
    allSheets_existance = function(wb) {
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
    patientID_overlapping = function(jsonResult) {
        
        Object.keys(jsonFromXlsx.PSMAP).length;
    },
    sampleID_overlapping = function() {},
    geneIDs_overlapping = function() {}
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


