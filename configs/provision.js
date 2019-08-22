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
    if (param[0] === "Device.FAP.X_000295_DiagMgmt.DiagTuning.1.TuningName") {
      declare(
        "Device.FAP.X_000295_DiagMgmt.DiagTuning.*",
        {path: now}, {path: 1});
    }

    declare(param[0], {value: now});
  });
}

function ensureCorrectParamValues() {
  params.forEach(function(param) {
    declare(param[0], {value: now}, {value: [param[1], param[2]]});
  });
}
