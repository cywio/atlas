#!/bin/bash

CURRENT_USER=$(whoami)
REPO_URL=$1

#Check if source repo argument exists
if ! [ -n "$REPO_URL" ]; then
  echo "!!!!!! Please provide the source repo URL."
  exit 1
fi

#Check if dokku exists and is root user
if ! which dokku >/dev/null ; then
    echo "!!!!!! You don't have dokku installed! Please use the install.sh script instead"
    exit 1
else
if [ $CURRENT_USER = "root" ] ; then
        echo "-----> Current User: ${CURRENT_USER}"
    else
        echo "!!!!!! You must run this as root"
        exit 1
    fi
fi

# Update application
dokku git:sync admin "https://github.com/${REPO_URL}" --build

# Cleanup
echo '-----> Cleaning up...'
rm -rf update.sh
dokku cleanup

echo '-----> Update complete!'
