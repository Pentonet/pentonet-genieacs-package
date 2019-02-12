"use strict";

const now = Date.now();

const serialNumber = declare('DeviceID.SerialNumber', {value: 1}).value[0];
const { params, neighboursCount } = ext("ext-config", "getConfiguration", serialNumber);

ensureCorrectNumberOfNeighborCells();
refreshParams();
ensureCorrectParamValues();

function ensureCorrectNumberOfNeighborCells() {
  declare(
    "Device.Services.FAPService.1.CellConfig.UMTS.RAN.NeighborList.InterFreqCell.*",
    {path: now}, {path: neighboursCount});
}

function refreshParams() {
  params.forEach(function(param) {
    declare(param[0], {value: now});
  });
}

function ensureCorrectParamValues() {
  params.forEach(function(param) {
    declare(param[0], {value: now}, {value: [param[1], param[2]]});
  });
}
