var _ = require('lodash');
var genemap = require('./DatasetGenemap.json');
var requirements = require('./DatasetRequirements.json');
var validate = require('./DatasetValidate.js');
var serialize = require('./DatasetSerialize.js');
var save = require('./DatasetSave.js');
var load = require('./DatasetLoad.js');
var helper = require('./DatasetHelping.js');

exports.run = () => {

    var errors = [];

    // Load Excel (Specific)
    var sheets = load.xlsx('demo.xlsx'); // Array of sheets [ {name:'xxx', data:data}, {name:'xxx', data:data} ]

    // Validate Sheets (Generic)
    errors = sheets.map(sheet => validate.validateSheet(sheet, requirements, _, helper));
    
    // Validate Workbook (Generic)
    errors.push(validate.validateWorkbookExistence(sheets, requirements, genemap, _, helper));
    errors.push(validate.validateWorkbookPatientIDOverlapping(sheets, requirements, genemap, _, helper));
    errors.push(validate.validateWorkbookSampleIDOverlapping(sheets, requirements, genemap, _, helper));
    errors.push(validate.validateWorkbookGeneIDsOverlapping(sheets, requirements, genemap, _, helper));
    

    // Serialize Sheets (Generic)
    sheetsSerialized = sheets.map(serialize.sheet);

    // Upload Sheets To S3 (Specific)
    errors = sheets.map( sheet => save.server(sheet, 'projectId'));
    
    // Serialize Manifest (Generic)
    manifestSerialized = serialize.manifest(sheets)

    // Upload Manifest To S3 (Specific)
    errors =save.s3(manifestSerialized, 'projectId');
    
}