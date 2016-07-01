#!/bin/bash

#############################################################################
#
# copy_config.sh [ ENVIRONMENT ]
#
#     Copy the configuration settings for the given environment into the
#     application.
#
#     We look for a file named "config_ENVIRONMENT.js" in the "configurations"
#     directory, and copy that file into the "www/app/lib/config.js" file.
#
#############################################################################

echo "Using ${1} environment for config.js"

rm -f www/app/lib/config.js
cp configurations/config_${1}.js www/app/lib/config.js

