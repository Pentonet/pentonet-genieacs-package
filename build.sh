#!/usr/bin/env bash

VERSION='1.0.0'
RELEASE='0.1.a'

fpm -s dir -t deb \
    --deb-user acs \
    --deb-group acs \
    --before-install hooks/before-install.sh \
    --after-install hooks/after-install.sh \
    --after-remove hooks/after-remove.sh \
    --depends 'nodejs (>= 8.4.0), nodejs (<= 9.0.0), mongodb-org (>= 3.4.0), mongodb-org (<= 3.5.0), redis-server, build-essential, libxml2-dev' \
    --description 'Auto Configuration Server - GenieACS' \
    -n acs \
    -v "${VERSION}" \
    --iteration "${RELEASE}" \
    --config-files /home/acs/fap-configurations/config.cfg \
    configs/config.cfg=/home/acs/fap-configurations/config.cfg \
    genieacs=/home/acs/ \
    configs/config.json=/home/acs/genieacs/config/config.json \
    systemd/genieacs-cwmp.service=/lib/systemd/system/genieacs-cwmp.service \
    systemd/genieacs-nbi.service=/lib/systemd/system/genieacs-nbi.service \
    configs/ext-config.js=/home/acs/genieacs/config/ext/ext-config.js \
    configs/provision.js=/home/acs/provision.js \
    scripts/set_fap_adminstate.py=/home/acs/set_fap_adminstate.py
