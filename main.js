var _ = require('lodash');
var genemap = require('./DatasetGenemap.json');
var requirements = require('./DatasetRequirements.json');
var validate = require('./DatasetValidate.js');
var serialize = require('./DatasetSerialize.js');
var save = require('./DatasetSave.js');
var load = require('./DatasetLoad.js');


exports.run = () => {

    var errors;

    // Load Excel (Specific)
    var sheets = load.xlsx('demo.xlsx'); // Array of sheets [ {name:'xxx', value:data}, {name:'xxx', value:data} ]

    // Validate Sheets (Generic)
    errors = sheets.map(sheet => validate.sheet(sheet, requirements, genemap, _) );
    
    // Validate Workbook (Generic)
    errors = validate.workbook(sheets);

    // Serialize Sheets (Generic)
    sheetsSerialized = sheets.map(serialize.sheet);

    // Upload Sheets To S3 (Specific)
    errors = sheets.map( sheet => save.server(sheet, 'projectId'));
    
    // Serialize Manifest (Generic)
    manifestSerialized = serialize.manifest(sheets)

    // Upload Manifest To S3 (Specific)
    errors =save.s3(manifestSerialized, 'projectId');
    
}