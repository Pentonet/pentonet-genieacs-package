"use strict";

const now = Date.now();

const serialNumber = declare('DeviceID.SerialNumber', {value: 1}).value[0];
const params = ext("ext-config", "getConfiguration", serialNumber);

refreshParams();
ensureCorrectParamValues();

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
