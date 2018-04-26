# nano3g ip.access FAP configuration

[GenieACS](https://genieacs.com/) will be used for the configuration of the FAP. (ACS - auto configuration server. [More](https://en.wikipedia.org/wiki/TR-069))

GenieACS documentation can be found under the following [link](https://github.com/genieacs/genieacs/wiki). (The documentation of the GenieACS is not complete, so you may want to browse its issues, pull requests and source code)

The process of the FAP configuration is scriptable (JavaScript). So, rather complex logic can be implemented.

## GenieACS sample installation process

The operating system is assumed to be Ubuntu 16.04 LTS.
The user `acs` is assumed to exist and have its home directory `/home/acs`.

#### GenieACS requirements:

- [nodejs 8.*](https://nodejs.org/uk/download/package-manager/#debian-and-ubuntu-based-linux-distributions)
- [mongodb 3.4.*](https://docs.mongodb.com/v3.4/tutorial/install-mongodb-on-ubuntu/)
- redis-server `sudo apt-get install redis-server`
- build-essential `sudo apt-get install build-essential`

#### Installation steps

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

## The FAP configuration process

It is assumed that the GenieACS was installed in the way shown above.

***To be continued***


---

# OLD PART GOES BELOW

## Files from this repository

- *Files from the systemd/ folder* - You can use them or write yours. Put them in the /lib/systemd/system folder.

- *config.json* - To be put in the config/ directory of the GenieACS.

- *ext-sample.js* - To be put in the config/ext/ directory of the GenieACS.

- *provision.js* - To be uploaded to the GenieACS database via the API. It calls `getCommonConfigurationFileContents()` function of *ext-sample.js* script to get the configuration file contents which are encoded as JSON.

```bash
# Example - uploading a provision to the GenieACS via its API - genieacs-nbi.
# Assuming genieacs-nbi is on localhost and listening to the port 7557.
# The provision with the name "common" will be created.

curl -i 'http://localhost:7557/provisions/common' \
  -X PUT \
  --data '@/path/to/js/provision.js'
```

- *fap-config-example.js* - Example of the FAP config file which is understood by the *provision.js* provisioning script (which works in pair with *ext-sample.js*).

## Provisioning a FAP

Assuming genieacs-nbi is on localhost and listening to the port 7557.

#### Example

If the FAP is configured to connect to the ACS, then you will see a message like this in the logs of the genieacs-cwmp:
```
Apr 24 16:15:58 ACS genieacs-cwmp[13045]: 2018-04-24T13:15:58.237Z [INFO] 200.200.200.5 000295-0000281819: Inform; cpeRequestId="10718" informEvent="4 VALUE CHANGE" informRetryCount=5
```
Where `000295-0000281819` is the ID of the FAP. In this case its in the form of <OUI>-<SerialNumber>.

In order to provision the FAP you need to create a **preset**
```bash
# Example - creating a preset.
# The preset with the name "inform" will be created.
# It instructs to run the provision with the name "common" against the FAP that was tagged with the tag "testing".

curl -i 'http://localhost:7557/presets/inform' \
  -X PUT \
  --data '{ "weight": 0, "precondition": "{\"_tags\":\"testing\"}", "configurations": [ { "type": "provision", "name": "common" } ] }'
```

In order to tag a FAP you can do the following:
```bash
# Example - tagging the FAP
# This will tag the FAP with the ID of "000295-0000281819" with the tag "testing"
curl -i 'http://localhost:7557/devices/000295-0000281819/tags/testing' -X POST
```

#### How it works now:

1. FAP sends cwmp:inform message to the ACS.
2. ACS sees that the device is tagged with the tag "testing" and there is a preset that instructs to run a provisioning script.
3. The provisioning script invokes *ext-sample.js* to get the parameters values from the configuration file.
4. After the provisioning script successfully parses configuration file contents ACS issues a GetParameterValues action to the FAP and refreshes the "cached" values in the database of the GenieACS. (function `refreshParams()` in *provision.js*).
5. After that it checks if the values from the FAP coincide with the values it has read from the configuration file. For the params that differ ACS issues a SetParameterValues action (function `ensureCorrectParamValues()` in *provision.js*).

#### If you want to **delete** a provision, a preset or untag the FAP:

- Deleting a provision with the name "common":
```bash
curl -i 'http://localhost:7557/provisions/common' -X DELETE
```
- Deleting a preset with the name "inform":
```bash
curl -i 'http://localhost:7557/presets/inform' -X DELETE
```
- Untag a FAP (Delete the tag "testing" from the FAP with the ID of "000295-0000281819"):
```bash
curl -i 'http://localhost:7557/devices/000295-0000281819/tags/testing' -X DELETE
```

#### More about provisions and extensions (scripting the provisioning flow):
https://github.com/genieacs/genieacs/wiki/Provisions
https://github.com/genieacs/genieacs/wiki/Extensions
https://github.com/genieacs/genieacs/wiki/Example-of-a-Provisioning-Flow

## Important notes

- `xsd:signedInt` type used in some ip.access CPEs is not standard and the type `xsd:int` should be used in configuration files (*fap-config-example.js* for example).

- `"XML_RECOVER": true` option was used in the `config.json` to enable parsing XML in the recovery mode. It means that even if there were some errors (`... Input is not proper UTF-8 ...`, etc.) the document would still be parsed to the end.
