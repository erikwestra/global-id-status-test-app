#!/bin/bash

#############################################################################
#
# build_ipa.sh [environment]
#
#     Build an IPA file for this application.
#
#     We setup the application to use the given environment, which defaults to
#     "DEPLOY" if no environment is specified.  We then construct an IPA file
#     from the Ionic application.
#
#############################################################################

# Edit the following settings as required.

PROJECT="Status API Test"
SCHEME="Status API Test"
#PROFILE="Erik Westra (ewestra@gmail.com)"
PROFILE="Status API Test App Provisioning Profile"

# Prepare to build the IPA file:

CUR_DIR=`pwd`
cd $CUR_DIR/platforms/ios
rm $PROJECT.ipa 2> /dev/null

# Force a complete rebuild from scratch:

xcodebuild clean -project "$PROJECT.xcodeproj" -configuration Release -alltargets

# Build and archive the app:

xcodebuild archive -project "$PROJECT.xcodeproj" -scheme "$SCHEME" -archivePath "$PROJECT.xcarchive"

# Finally, export the archive to an IPA file:

xcodebuild -exportArchive -archivePath "$PROJECT.xcarchiv"e -exportPath "$PROJECT" -exportFormat ipa -exportProvisioningProfile "$PROFILE"

