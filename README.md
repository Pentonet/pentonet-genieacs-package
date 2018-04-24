# GenieACS configuration

GenieACS documentation can be found under the following [link](https://github.com/genieacs/genieacs/wiki). But as it is not complete this document has been created.

## GenieACS sample installation

### GenieACS requirements:

- nodejs 8.* https://nodejs.org/uk/download/package-manager/#debian-and-ubuntu-based-linux-distributions
- mongodb 3.4.* https://docs.mongodb.com/v3.4/tutorial/install-mongodb-on-ubuntu/
- redis-server `apt-get install redis-server`
- build-essential `apt-get install build-essential`

### Installation steps

The current working directory is assumed to be `/home/nariman`

- Download the archive in the format *tar.gz* `wget https://github.com/genieacs/genieacs/archive/v1.1.2.tar.gz` (other GenieACS versions: https://github.com/genieacs/genieacs/releases)

- Extract the archive and rename it

```bash
    tar -xvzf v1.1.2.tar.gz
    mv v1.1.2.tar.gz genieacs
```

- Install dependencies via npm

```bash
    cd genieacs
    npm i
    npm run configure
    npm run compile
```

- Copy the *config.json* file from this repository to */home/nariman/genieacs/config/config.json*. And modify it according to your needs

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


## Provisioning a FAP

Assuming genieacs-nbi is on localhost and listening to the port 7557.

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

If you want to **delete** a provision, a preset or untag the FAP:

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
