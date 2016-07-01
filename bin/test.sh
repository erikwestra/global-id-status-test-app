#!/bin/bash

#############################################################################
#
# test.sh [ environment ]
#
#     Test the application in a web browser.
#
#     We setup the application to use the given environment, which defaults to
#     "DEV" if no environment is specified.  We then call "ionic serve" to run
#     the application in a web browser for testing.
#
#############################################################################

./bin/copy_config.sh ${1:-DEV}
if [ $? -ne 0 ]; then
    echo "Unknown environment!"
    exit 0
fi

ionic serve
