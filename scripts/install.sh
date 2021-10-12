#!/bin/bash

HOST_IP=$(curl -sS https://ipinfo.io/ip)
CURRENT_USER=$(whoami)
CURRENT_VERSION=$(curl -sS https://api.github.com/repos/dokku/dokku/releases/latest | grep -oP '(?<="tag_name": ")[^"]*')
SETUP_KEY=$(openssl rand -hex 16)
REPO_URL=$1

#Check if source repo argument exists
if ! [ -n "$REPO_URL" ]; then
  echo "!!!!!! Please provide the source repo URL."
  exit 1
fi

#Check if dokku exists and is root user
if ! which dokku >/dev/null ; then
    if [ $CURRENT_USER = "root" ] ; then
        echo "-----> Server IP: ${HOST_IP}"
        echo "-----> Current User: ${CURRENT_USER}"
        echo "-----> Latest Dokku Version: ${CURRENT_VERSION}"
    else
        echo '!!!!!! You must run this as root'
        exit 1
    fi
else
    echo '!!!!!! You have Dokku installed already, skipping installation...'
    exit 1
fi

# Install Dokku
echo '-----> Installing Dokku'
wget https://raw.githubusercontent.com/dokku/dokku/$CURRENT_VERSION/bootstrap.sh
sudo DOKKU_TAG=$CURRENT_VERSION bash bootstrap.sh
cat ~/.ssh/authorized_keys | dokku ssh-keys:add admin

# Install database and extra plugins
echo '-----> Installing plugins'
sudo dokku plugin:install https://github.com/dokku/dokku-letsencrypt.git
sudo dokku plugin:install https://github.com/dokku/dokku-postgres.git postgres
sudo dokku plugin:install https://github.com/dokku/dokku-mysql.git mysql
sudo dokku plugin:install https://github.com/dokku/dokku-mongo.git mongo
sudo dokku plugin:install https://github.com/dokku/dokku-redis.git redis
sudo dokku plugin:install https://github.com/dokku/dokku-mariadb.git mariadb
sudo dokku plugin:install https://github.com/dokku/dokku-maintenance.git maintenance

# Install the dashboard
echo '-----> Installing dashboard'
dokku apps:create admin
dokku postgres:create admin
dokku postgres:link admin admin
dokku config:set admin SERVER_IP=$HOST_IP SETUP_KEY=$SETUP_KEY SECRET=$(openssl rand -hex 64)
dokku git:sync admin "https://github.com/${REPO_URL}" --build

echo '-----> Installation complete!'
echo "-----> Go to http://${HOST_IP}:3000/setup?key=${SETUP_KEY}"
