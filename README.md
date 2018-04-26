# nano3g ip.access FAP configuration with ACS

[GenieACS](https://genieacs.com/) will be used for the configuration of the FAP. (ACS - auto configuration server. [More](https://en.wikipedia.org/wiki/TR-069))

GenieACS documentation can be found under the following [link](https://github.com/genieacs/genieacs/wiki). (The documentation of the GenieACS is not complete, so you may want to browse its issues, pull requests and source code)

The process of the FAP configuration is scriptable (JavaScript). So, rather complex logic can be implemented.

**Note that you should have the documentation for your FAP and you should know which parameters to set and which values these parameters should have.**

## 1 GenieACS sample installation process

The operating system is assumed to be Ubuntu 16.04 LTS.
The user `acs` is assumed to exist and have its home directory `/home/acs`.

#### 1.1 GenieACS requirements:

- [nodejs 8.*](https://nodejs.org/uk/download/package-manager/#debian-and-ubuntu-based-linux-distributions)
- [mongodb 3.4.*](https://docs.mongodb.com/v3.4/tutorial/install-mongodb-on-ubuntu/)
- redis-server `sudo apt-get install redis-server`
- build-essential `sudo apt-get install build-essential`

#### 1.2 Installation steps

- Download the archive in the format *tar.gz* (other GenieACS versions: [link](https://github.com/genieacs/genieacs/releases))

```bash
cd /home/acs
wget https://github.com/genieacs/genieacs/archive/v1.1.2.tar.gz
```

- Extract the archive and rename it

```bash
cd /home/acs
tar -xvzf v1.1.2.tar.gz
mv v1.1.2.tar.gz genieacs
```

- Install dependencies via npm

```bash
cd /home/acs/genieacs
npm i
npm run configure
npm run compile
```

- Modify configuration file */home/acs/genieacs/config/config.json* according to your needs. Example is shown below. Note that `"XML_RECOVER": true` tells the XML parser to parse XML in the recovery mode. It means that it will continue parsing the XML content to the end even if there were errors encountered. (Sometimes some ip.access FAPs send not properly encoded symbols which XML parser fails to understand).

```
{
    "MONGODB_CONNECTION_URL" : "mongodb://127.0.0.1:27017/genieacs",
    "CWMP_INTERFACE" : "0.0.0.0",
    "CWMP_PORT" : 7547,
    "CWMP_SSL" : false,
    "NBI_INTERFACE" : "0.0.0.0",
    "NBI_PORT" : 7557,
    "FS_INTERFACE" : "0.0.0.0",
    "FS_PORT" : 7567,
    "FS_HOSTNAME" : "acs.example.com",
    "DEBUG" : false,
    "XML_RECOVER": true
}
```

- **(optional)** Create systemd units for genieacs-cwmp (ACS) and for genieacs-nbi (API for managing the ACS).

/lib/systemd/system/genieacs-cwmp.service:
```
[Unit]
Description=GenieACS CWMP server
After=mongod.service
Requires=mongod.service

[Service]
Type=simple
ExecStart=/home/acs/genieacs/bin/genieacs-cwmp
StandardOutput=syslog
Restart=always
RestartSec=5
User=acs
Group=acs

[Install]
WantedBy=multi-user.target
```

/lib/systemd/system/genieacs-nbi.service:
```
[Unit]
Description=GenieACS API
PartOf=genieacs-cwmp.service
After=genieacs-cwmp.service

[Service]
Type=simple
ExecStart=/home/acs/genieacs/bin/genieacs-nbi
StandardOutput=syslog
Restart=always
RestartSec=5
User=acs
Group=acs

[Install]
WantedBy=genieacs-cwmp.service
```

Then start the servers (redis-server might be already started just after its installation):
```bash
#sudo systemctl start redis-server.service
sudo systemctl start mongod.service
sudo systemctl start genieacs-cwmp.service
sudo systemctl start genieacs-nbi.service
```

## 2 The FAP configuration process

It is assumed that the GenieACS was installed in the way shown above.

There are two ways of doing the configuration presented here:

- Just tell the ACS to set the parameters on the FAP once (see 2.1).

- Create a scripted workflow for FAP provisioning (in this example - reading params from a configuration file) (see 2.2).

#### 2.1 Just tell the ACS to set the parameters on the FAP once

In this example we will set `Device.Services.FAPService.1.CellConfig.UMTS.CN.PLMNID` to `90198` and `Device.Services.FAPService.1.CellConfig.UMTS.CN.LACRAC` to `10422:99`:

##### 2.1.1 Know the ID of your FAP

If you have configured the FAP to point to the ACS server, then you will be able to see messages like this in the logs of the GenieACS:
```
Apr 24 16:15:58 ACS genieacs-cwmp[13045]: 2018-04-24T13:15:58.237Z [INFO] 200.200.200.5 000295-0000281819: Inform; cpeRequestId="10718" informEvent="4 VALUE CHANGE" informRetryCount=5
```
Where `000295-0000281819` is the device id. In this case it is in the form of `OUI-SerialNumber`, but the form may differ for you.

##### 2.1.2 Let the ACS get the parameter names, types and values from the FAP

```bash
curl -i 'http://localhost:7557/devices/000295-0000281819/tasks?connection_request' \
-X POST \
--data '{ "name": "getParameterValues", "parameterValues": ["Device.Services.FAPService.1.CellConfig.UMTS.CN.PLMNID", "Device.Services.FAPService.1.CellConfig.UMTS.CN.LACRAC"] }'
```

##### 2.1.3 Update the parameter values on the FAP

```bash
curl -i 'http://localhost:7557/devices/000295-0000281819/tasks?connection_request' \
    -X POST \
    --data '{ "name": "setParameterValues", "parameterValues": [["Device.Services.FAPService.1.CellConfig.UMTS.CN.PLMNID", "90198"], ["Device.Services.FAPService.1.CellConfig.UMTS.CN.LACRAC", "10422:99"]] }'
```

#### 2.2 Configuring GenieACS to use a specific configuration file

Our configuration will be straightforward:

1. Read the config file from the filesystem.

2. Parse it.

3. Update the parameters on the FAP if they differ from ones of configuration file.

For that we need to do the following:

1. Create a script that will do the configuration.

2. Create a preset that will instruct the ACS to run a provision for FAP that matches a specific precondition (In our case, if device is tagged).

3. Create a configuration file for the script to read.

4. Configure the FAP to point to the ACS server. Instructions on how to do it are in the documentation of the FAP.

5. Tag our FAP, so that the configuration will take place.

It is important to do the tagging as the last step, so that all the configuration scripts/files will be ready by the time. The order of the other steps is not important.

##### 2.2.1 Create a provision script and upload it to the GenieACS via its api (genieacs-nbi)

Create the external script /home/acs/genieacs/config/ext/ext-config.js which will be used by /home/acs/provision.js
```javascript
"use strict";

const fs = require("fs");

const PATH_TO_CONFIGURATION_FILE = '/home/acs/fap-config.json';

function readConfigurationFile(args, callback) {
fs.readFile(PATH_TO_CONFIGURATION_FILE, 'utf8', callback);
}

exports.readConfigurationFile = readConfigurationFile;
```

Create a file /home/acs/provision.js
```javascript
"use strict";

const now = Date.now();

// Call to the function "readConfigurationFile" of the external script /home/acs/genieacs/config/ext/ext-config.js
const configurationFileContents = ext("ext-config", "readConfigurationFile");

const params = JSON.parse();

refreshParams();
ensureCorrectParamValues();

// Reads param values from the FAP and stores them in database of GenieACS
function refreshParams() {
    params.forEach(function(param) {
        const name = param[0];
        declare(name, {value: now});
    });
}

// Updates param values on the FAP if necessary
function ensureCorrectParamValues() {
    params.forEach(function(param) {
        const [name, value, type] = param;
        declare(name, {value: now}, {value: [value, type]});
    });
}
```

Upload /home/acs/provision.js to the ACS
```bash
# Example - uploading a provision to the GenieACS via its API - genieacs-nbi.
# Assuming genieacs-nbi is on localhost and listening to the port 7557.
# The provision with the name "myprovision" will be created.

curl -i 'http://localhost:7557/provisions/myprovision' \
    -X PUT \
    --data '@/home/acs/provision.js'
```

##### 2.2.2 Create a preset

```bash
# Example - creating a preset.
# The preset with the name "mypreset" will be created.
# It instructs to run the provision with the name "myprovision" against the FAP that was tagged with the tag "mytag".

curl -i 'http://localhost:7557/presets/mypreset' \
    -X PUT \
    --data '{ "weight": 0, "precondition": "{\"_tags\":\"mytag\"}", "configurations": [ { "type": "provision", "name": "myprovision" } ] }'
```

##### 2.2.3 Create a configuration file with FAP parameters

Create a file /home/acs/fap-config.json. Full example of its content is at the end of this page.

##### 2.2.4 Tag the FAP

If you have configured the FAP to point to the ACS server, then you will be able to see messages like this in the logs of the GenieACS:
```
Apr 24 16:15:58 ACS genieacs-cwmp[13045]: 2018-04-24T13:15:58.237Z [INFO] 200.200.200.5 000295-0000281819: Inform; cpeRequestId="10718" informEvent="4 VALUE CHANGE" informRetryCount=5
```
Where `000295-0000281819` is the device id. In this case it is in the form of <OUI>-<SerialNumber>, but the form may differ for you.

```bash
# Example - tagging the FAP
# This will tag the FAP with the ID of "000295-0000281819" with the tag "mytag"
curl -i 'http://localhost:7557/devices/000295-0000281819/tags/mytag' -X POST
```

##### 2.2.5 How it works now:

1. FAP sends cwmp:inform message to the ACS.


2. ACS sees that the device is tagged with the tag "mytag" and there is a preset that instructs to run a provisioning script with the name "myprovision".

3. The provisioning script invokes ext-config.js to get the parameters values from the configuration file /home/acs/fap-config.json.

4. After the provisioning script successfully parses configuration file contents ACS issues a GetParameterValues action to the FAP and refreshes the "cached" values in the database of the GenieACS. (function `refreshParams()` in provision "myprovision").

5. After that it checks if the values from the FAP coincide with the values it has read from the configuration file. For the params that differ ACS issues a SetParameterValues action (function `ensureCorrectParamValues()` in provision "myprovision").

#### 2.3 If you want to **delete** a provision, a preset or untag the FAP:

- Deleting a provision with the name "common":
```bash
curl -i 'http://localhost:7557/provisions/myprovision' -X DELETE
```
- Deleting a preset with the name "inform":
```bash
curl -i 'http://localhost:7557/presets/mypreset' -X DELETE
```
- Untag a FAP (Delete the tag "testing" from the FAP with the ID of "000295-0000281819"):
```bash
curl -i 'http://localhost:7557/devices/000295-0000281819/tags/mytag' -X DELETE
```

#### 2.4 More about provisions and extensions (scripting the provisioning flow):
- https://github.com/genieacs/genieacs/wiki/Provisions
- https://github.com/genieacs/genieacs/wiki/Extensions
- https://github.com/genieacs/genieacs/wiki/Example-of-a-Provisioning-Flow


---

## 3 Full configuration file example (/home/acs/fap-config.json)

```json
[
  [
    "Device.IPsec.Enable",
    false,
    "xsd:boolean"
  ],
  [
    "Device.ManagementServer.PeriodicInformEnable",
    true,
    "xsd:boolean"
  ],
  [
    "Device.ManagementServer.PeriodicInformInterval",
    60,
    "xsd:unsignedInt"
  ],
  [
    "Device.ManagementServer.URL",
    "http://192.168.16.103:7547",
    "xsd:string"
  ],
  [
    "Device.Services.FAPService.1.AccessMgmt.UMTS.AccessMode",
    "Open Access",
    "xsd:string"
  ],
  [
    "Device.Services.FAPService.1.AccessMgmt.UMTS.HNBName",
    "000295-0000281819@ipaccess.com",
    "xsd:string"
  ],
  [
    "Device.Services.FAPService.1.AccessMgmt.UMTS.NonCSGUEAccessDecision",
    "Local",
    "xsd:string"
  ],
  [
    "Device.Services.FAPService.1.AccessMgmt.UMTS.X_000295_AccessDecisionMode",
    "Legacy Mode",
    "xsd:string"
  ],
  [
    "Device.Services.FAPService.1.AccessMgmt.UMTS.X_000295_DefaultUERejectCause",
    "Roaming not allowed in this location area",
    "xsd:string"
  ],
  [
    "Device.Services.FAPService.1.AccessMgmt.UMTS.X_000295_DefaultUERejectMethod",
    "AUTO",
    "xsd:string"
  ],
  [
    "Device.Services.FAPService.1.AccessMgmt.UMTS.X_000295_ZonalAP",
    "Zonal AP",
    "xsd:string"
  ],
  [
    "Device.Services.FAPService.1.CellConfig.UMTS.CN.CSDomain.IMSIAttachDetachEnable",
    true,
    "xsd:boolean"
  ],
  [
    "Device.Services.FAPService.1.CellConfig.UMTS.CN.LACRAC",
    "10422:99",
    "xsd:string"
  ],
  [
    "Device.Services.FAPService.1.CellConfig.UMTS.CN.PLMNID",
    "90198",
    "xsd:string"
  ],
  [
    "Device.Services.FAPService.1.CellConfig.UMTS.CN.PSDomain.NetworkModeOperationCombined",
    true,
    "xsd:boolean"
  ],
  [
    "Device.Services.FAPService.1.CellConfig.UMTS.CN.SAC",
    10,
    "xsd:unsignedInt"
  ],
  [
    "Device.Services.FAPService.1.CellConfig.UMTS.CN.X_000295_IuUpInitNoDataSupported",
    true,
    "xsd:boolean"
  ],
  [
    "Device.Services.FAPService.1.CellConfig.UMTS.RAN.CellID",
    10,
    "xsd:unsignedInt"
  ],
  [
    "Device.Services.FAPService.1.CellConfig.UMTS.RAN.CellRestriction.CellBarred",
    false,
    "xsd:boolean"
  ],
  [
    "Device.Services.FAPService.1.CellConfig.UMTS.RAN.CellRestriction.CellReservedForOperatorUse",
    false,
    "xsd:boolean"
  ],
  [
    "Device.Services.FAPService.1.CellConfig.UMTS.RAN.CellRestriction.IntraFreqCellReselectionIndicator",
    true,
    "xsd:boolean"
  ],
  [
    "Device.Services.FAPService.1.CellConfig.UMTS.RAN.RF.MaxFAPTxPowerExpanded",
    "50",
    "xsd:string"
  ],
  [
    "Device.Services.FAPService.1.CellConfig.UMTS.RAN.RF.MaxULTxPower",
    "24",
    "xsd:string"
  ],
  [
    "Device.Services.FAPService.1.CellConfig.UMTS.RAN.RF.PCPICHPower",
    "10.0",
    "xsd:string"
  ],
  [
    "Device.Services.FAPService.1.CellConfig.UMTS.RAN.RF.PrimaryScramblingCode",
    "401",
    "xsd:string"
  ],
  [
    "Device.Services.FAPService.1.CellConfig.UMTS.RAN.RF.UARFCNDL",
    "9800",
    "xsd:string"
  ],
  [
    "Device.Services.FAPService.1.CellConfig.UMTS.RAN.X_000295_CellBroadcastDefaultMessage",
    "",
    "xsd:string"
  ],
  [
    "Device.Services.FAPService.1.CellConfig.UMTS.RAN.X_000295_CellBroadcastEnable",
    true,
    "xsd:boolean"
  ],
  [
    "Device.Services.FAPService.1.CellConfig.UMTS.RAN.X_000295_CellBroadcastMode",
    "CB_MODE_DEFAULT_MESSAGE",
    "xsd:string"
  ],
  [
    "Device.Services.FAPService.1.CellConfig.UMTS.RAN.X_000295_HandoverEnabled",
    true,
    "xsd:boolean"
  ],
  [
    "Device.Services.FAPService.1.CellConfig.UMTS.RAN.X_000295_IntraFrequencyHandoutEnabled",
    true,
    "xsd:boolean"
  ],
  [
    "Device.Services.FAPService.1.CellConfig.UMTS.RAN.X_000295_PSHandoverEnabled",
    true,
    "xsd:boolean"
  ],
  [
    "Device.Services.FAPService.1.CellConfig.UMTS.RAN.X_000295_PSInactivityTimeout",
    30,
    "xsd:unsignedInt"
  ],
  [
    "Device.Services.FAPService.1.FAPControl.UMTS.AdminState",
    true,
    "xsd:boolean"
  ],
  [
    "Device.Services.FAPService.1.FAPControl.UMTS.Gateway.FAPGWServer1",
    "192.168.16.100",
    "xsd:string"
  ],
  [
    "Device.Services.FAPService.1.REM.UMTS.WCDMA.ScanOnBoot",
    false,
    "xsd:boolean"
  ],
  [
    "Device.Services.FAPService.1.REM.UMTS.WCDMA.ScanPeriodically",
    false,
    "xsd:boolean"
  ],
  [
    "Device.Services.FAPService.1.REM.UMTS.WCDMA.ScanTimeout",
    0,
    "xsd:unsignedInt"
  ],
  [
    "Device.Services.FAPService.1.REM.X_000295_CellParameterSelectionMethod",
    "CONFIGURED",
    "xsd:string"
  ],
  [
    "Device.Services.FAPService.1.REM.X_000295_ExternalPaGain",
    0,
    "xsd:int"
  ],
  [
    "Device.Services.FAPService.1.REM.X_000295_NeighbourListPopulation",
    2,
    "xsd:unsignedInt"
  ],
  [
    "Device.Services.FAPService.1.REM.X_000295_RFParamsCandidateList",
    "9800-401",
    "xsd:string"
  ],
  [
    "Device.Services.FAPService.1.REM.X_000295_ScanBands",
    "",
    "xsd:string"
  ],
  [
    "Device.Time.LocalTimeZone",
    "GMT",
    "xsd:string"
  ],
  [
    "Device.Time.NTPServer1",
    "192.168.14.11",
    "xsd:string"
  ],
  [
    "Device.Time.NTPServer2",
    "1.ipaccess.pool.ntp.org",
    "xsd:string"
  ],
  [
    "Device.Time.NTPServer3",
    "2.ipaccess.pool.ntp.org",
    "xsd:string"
  ],
  [
    "Device.Time.NTPServer4",
    "3.ipaccess.pool.ntp.org",
    "xsd:string"
  ],
  [
    "Device.Time.X_000295_NTPFrequencyDisciplineEnabled",
    false,
    "xsd:boolean"
  ],
  [
    "Device.Services.FAPService.1.CellConfig.UMTS.RAN.CellSelection.HCSPrio",
    0,
    "xsd:unsignedInt"
  ],
  [
    "Device.Services.FAPService.1.CellConfig.UMTS.RAN.CellSelection.QHCS",
    0,
    "xsd:unsignedInt"
  ],
  [
    "Device.Services.FAPService.1.CellConfig.UMTS.RAN.CellSelection.SHCSRAT",
    -105,
    "xsd:int"
  ],
  [
    "Device.Services.FAPService.1.CellConfig.UMTS.RAN.CellSelection.SIntersearch",
    8,
    "xsd:int"
  ],
  [
    "Device.Services.FAPService.1.CellConfig.UMTS.RAN.CellSelection.SIntrasearch",
    10,
    "xsd:int"
  ],
  [
    "Device.Services.FAPService.1.CellConfig.UMTS.RAN.CellSelection.SLimitSearchRAT",
    0,
    "xsd:int"
  ],
  [
    "Device.Services.FAPService.1.CellConfig.UMTS.RAN.CellSelection.SSearchHCS",
    -100,
    "xsd:int"
  ],
  [
    "Device.Services.FAPService.1.CellConfig.UMTS.RAN.CellSelection.SSearchRAT",
    8,
    "xsd:int"
  ],
  [
    "Device.Services.FAPService.1.CellConfig.UMTS.RAN.CellSelection.UseOfHCS",
    "",
    "xsd:boolean"
  ],
  [
    "Device.Services.FAPService.1.CellConfig.UMTS.RAN.RNCID",
    23,
    "xsd:unsignedInt"
  ]
]
```
