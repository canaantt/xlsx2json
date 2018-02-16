var _ = require('lodash');
var XLSX = require('XLSX');
var genemap = require('./DatasetGenemap.json');
var requirements = require('./DatasetRequirements.json');
var validate = require('./DatasetValidate.js');
var serialize = require('./DatasetSerialize.js');
var save = require('./DatasetSave.js');
var load = require('./DatasetLoad.js');
var helper = require('./DatasetHelping.js');

exports.run = () => {

    var errors = {};

    // Load Excel (Specific)
    var sheets = load.xlsx('demo.xlsx', XLSX); // Array of sheets [ {name:'xxx', data:data}, {name:'xxx', data:data} ]

    // Validate Sheets (Generic)
    errors['sheet_level'] = sheets.map(sheet => validate.validateSheet(sheet, requirements, _, helper));
    
    // Validate Workbook (Generic)
    errors['sheets_existence'] = validate.validateWorkbookExistence(sheets, requirements, genemap, _, helper);
    errors['patientID_overlapping'] = validate.validateWorkbookPatientIDOverlapping(sheets, requirements, genemap, _, helper);
    errors['sampleID_overlapping'] = validate.validateWorkbookSampleIDOverlapping(sheets, requirements, genemap, _, helper);
    errors['geneID_overlapping'] = validate.validateWorkbookGeneIDsOverlapping(sheets, requirements, genemap, _, helper);
    

    // Serialize Sheets (Generic)
    sheetsSerialized = [];
    sheets.forEach(sheet => {
        console.log(sheet.name);
        sheetsSerialized = sheetsSerialized.concat(serialize.sheet(sheet, _, XLSX));
    }); 

    // Upload Sheets To S3 (Specific)
    errors = sheets.map( sheet => save.server(sheet, 'projectId'));
    
    // Serialize Manifest (Generic)
    manifestSerialized = serialize.manifest(sheets)

    // Upload Manifest To S3 (Specific)
    errors =save.s3(manifestSerialized, 'projectId');
    
}