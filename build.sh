#!/usr/bin/env bash

VERSION='1.0.0'
RELEASE='0.1.a'

fpm -s dir -t deb \
    --deb-user acs \
    --deb-group acs \
    --before-install scripts/before-install.sh \
    --after-install scripts/after-install.sh \
    --after-remove scripts/after-remove.sh \
    --depends 'nodejs (>= 8.4.0), nodejs (<= 9.0.0), mongodb-org (>= 3.4.0), mongodb-org (<= 3.5.0), redis-server, build-essential, libxml2-dev' \
    --description 'Auto Configuration Server - GenieACS' \
    -n acs \
    -v "${VERSION}" \
    --iteration "${RELEASE}" \
    --config-files /home/acs/fap-configurations/config.cfg \
    example.cfg=/home/acs/fap-configurations/config.cfg \
    genieacs=/home/acs/ \
    config.json=/home/acs/genieacs/config/config.json \
    systemd/genieacs-cwmp.service=/lib/systemd/system/genieacs-cwmp.service \
    systemd/genieacs-nbi.service=/lib/systemd/system/genieacs-nbi.service \
    ext-config.js=/home/acs/genieacs/config/ext/ext-config.js \
    provision.js=/home/acs/provision.js
