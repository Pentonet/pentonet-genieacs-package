"use strict";

const now = Date.now();

const params = JSON.parse(ext("ext-sample", "getCommonConfigurationFileContents"));

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
