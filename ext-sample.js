"use strict";

const fs = require("fs");

const CONFIG_DIRECTORY = '/home/nariman/fap-configurations';

function getCommonConfigurationFileContents(args, callback) {
  fs.readFile(`${CONFIG_DIRECTORY}/common.json`, 'utf8', callback);
}

function getSpecificConfigurationFileContents(args, callback) {
  const id = args[0];
  fs.readFile(`${CONFIG_DIRECTORY}/${id}.json`, 'utf8', callback);
}


exports.getCommonConfigurationFileContents = getCommonConfigurationFileContents;
exports.getSpecificConfigurationFileContents = getSpecificConfigurationFileContents;
