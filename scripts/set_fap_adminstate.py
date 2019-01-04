#!/usr/bin/env python3

from configparser import ConfigParser
from sys import argv

config = ConfigParser()
config.optionxform = str

config_path = '/home/acs/fap-configurations/config.cfg'

property_name = 'Device.Services.FAPService.1.FAPControl.UMTS.AdminState'
unlocked_value = 'true|xsd:boolean'
locked_value = 'false|xsd:boolean'


def set_property(config, name, value):
    for section in config.sections():
        if section != 'Common':
            config[section][name] = value


help = \
"""\
{bold}NAME{end}
        set_fap_adminstate.py - tool to lock or unlock all femtocells

{bold}SYNOPSIS{end}
        {bold}set_fap_adminstate.py{end} {underline}state{end}

{bold}DESCRIPTION{end}
        {bold}set_fap_adminstate.py{end} changes the configuration file for GenieACS.

        When the {underline}state{end} is {underline}lock{end} then it sets AdminState of all femtocells to false which prohibits transmission.

        When the {underline}state{end} is {underline}unlock{end} then it sets AdminState of all femtocells to true which allows transmission. (In some cases femtocell will not transmit even when AdminState is true: for example, in case when a femtocell is not connected to a NTP server).
""".format(bold='\033[1m', underline='\033[4m', end='\033[0m')


def main(args):
    if len(args) != 1 or args[0] not in ['lock', 'unlock']:
        print(help)
        return

    config.read(config_path)

    set_property(config, property_name, unlocked_value if args[0] == 'unlock' else locked_value)

    with open(config_path, 'w') as config_file:
        config.write(config_file)


if __name__ == '__main__':
    main(argv[1:])
