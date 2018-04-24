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

- Copy the *config.json* file from this repository to `/home/nariman/genieacs/config/config.json`. And modify it according to your needs

## Files from this repository

- *Files from the systemd/ folder* - You can use them or write yours. Put them in the /lib/systemd/system folder.

- *config.json* - To be put in the config/ directory of the GenieACS.

- *ext-sample.js* - To be put in the config/ext/ directory of the GenieACS.

- *provision.js* - To be uploaded to the GenieACS database via the API.
