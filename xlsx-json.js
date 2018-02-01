const jsonfile = require("jsonfile");
const _ = require("underscore");
const asyncLoop = require('node-async-loop');
const XLSX =require("xlsx");
const fs = require('fs');
_.uniq(Object.keys(workbook.Sheets['PATIENTEVENT-CHEMO']).map(k=>workbook.Sheets['PATIENTEVENT-CHEMO'][k].t));
Object.keys(workbook.Sheets['PATIENTEVENT-CHEMO']).filter(k=>workbook.Sheets['PATIENTEVENT-CHEMO'][k].t == 'undefined');
