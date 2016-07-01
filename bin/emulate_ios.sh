#!/bin/bash

#############################################################################
#
# emulate_ios.sh [ environment ]
#
#     Run the application using the IOS emulator.
#
#     We setup the application to use the given environment, which defaults to
#     "DEV" if no environment is specified.  We then call "ionic emulate ios"
#     to run the application in the IOS emulator.
#
#############################################################################

./bin/copy_config.sh ${1:-DEV}
if [ $? -ne 0 ]; then
    echo "Unknown environment!"
    exit 0
fi

ionic emulate ios
