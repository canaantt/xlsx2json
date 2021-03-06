var _ = require('lodash');
var XLSX = require('XLSX');
var genemap = require('./public/Uploading_Modules/DatasetGenemap.json');
var requirements = require('./public/Uploading_Modules/DatasetRequirements.json');
var validate = require('./public/Uploading_Modules/DatasetValidate.js');
var serialize = require('./public/Uploading_Modules/DatasetSerialize.js');
var save = require('./public/Uploading_Modules/DatasetSave.js');
var load = require('./public/Uploading_Modules/DatasetLoad.js');
var helper = require('./public/Uploading_Modules/DatasetHelping.js');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const zlib = require('zlib');
// #region S3 config
var s3UploadConfig = {
    region: 'us-west-2',
    params: {Bucket:'oncoscape-users-data'}
}
s3.config.region = s3UploadConfig.region;



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
        sheetsSerialized = sheetsSerialized.concat(serialize.sheet(sheet, _, XLSX));
    }); 

    // Upload Sheets To S3 (Specific)
    uploadResults = sheetsSerialized.map(sheet => save.server(sheet, 'projectId', s3UploadConfig, AWS, s3, zlib));
    
    // Serialize Manifest (Generic)
    manifestSerialized = serialize.manifest(sheetsSerialized, uploadResults);

    // Upload Manifest To S3 (Specific)
    manifestURL = save.s3(manifestSerialized, 'projectId', s3UploadConfig, AWS, s3, zlib);
    console.log(manifestURL);
}