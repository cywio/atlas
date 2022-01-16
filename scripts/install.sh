#!/bin/bash

HOST_IP=$(curl -sS https://ipinfo.io/ip)
CURRENT_USER=$(whoami)
CURRENT_VERSION=$(curl -sS https://api.github.com/repos/dokku/dokku/releases/latest | grep -oP '(?<="tag_name": ")[^"]*')
SETUP_KEY=$(openssl rand -hex 16)
DOCKER_USER="a$(openssl rand -hex 8)"
REPO_URL=$1

# Check if source repo argument exists
if ! [ -n "$REPO_URL" ]; then
  echo "!!!!!! Please provide the source repo URL."
  exit 1
fi

# Check if dokku exists and is root user
if ! which dokku >/dev/null ; then
    if [ $CURRENT_USER = "root" ] ; then
        echo "-----> Server IP: ${HOST_IP}"
        echo "-----> Current User: ${CURRENT_USER}"
        echo "-----> Latest Dokku Version: ${CURRENT_VERSION}"

        # Install Dokku
        echo '-----> Installing Dokku'
        wget https://raw.githubusercontent.com/dokku/dokku/$CURRENT_VERSION/bootstrap.sh
        sudo DOKKU_TAG=$CURRENT_VERSION bash bootstrap.sh
        cat ~/.ssh/authorized_keys | dokku ssh-keys:add admin
    else
        echo '!!!!!! You must run this as root'
        exit 1
    fi
else
    echo '-----> You have Dokku installed already, skipping installation...'
fi

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
mkdir /var/lib/dokku/data/storage/admin-keys/
chown dokku:dokku /var/lib/dokku/data/storage/admin-keys/
dokku storage:mount admin /var/lib/dokku/data/storage/admin-keys/:/keys
dokku config:set admin SERVER_IP=$HOST_IP SETUP_KEY=$SETUP_KEY SECRET=$(openssl rand -hex 64) DOCKER_USER=$DOCKER_USER
dokku git:sync admin "https://github.com/${REPO_URL}" --build

# Create user specifically for direct Docker access
echo '-----> Creating Docker user'
adduser --disabled-password --gecos "" $DOCKER_USER
usermod -aG docker $DOCKER_USER

# Generate SSH keys for both new user and dokku
echo '-----> Generating SSH keys'
ssh-keygen -b 4096 -t rsa -f dokku_key -N ""
ssh-keygen -b 4096 -t rsa -f docker_key -N ""

# Add the public keys to both new user and dokku
echo '-----> Adding SSH keys to users and dokku'
mkdir /home/$DOCKER_USER/.ssh/
touch /home/$DOCKER_USER/.ssh/authorized_keys
cat docker_key.pub >> /home/$DOCKER_USER/.ssh/authorized_keys
cat dokku_key.pub | dokku ssh-keys:add _admin

# Add private keys to config
echo '-----> Adding SSH keys to admin'
touch /var/lib/dokku/data/storage/admin-keys/dokku
touch /var/lib/dokku/data/storage/admin-keys/docker
cat dokku_key >> /var/lib/dokku/data/storage/admin-keys/dokku
cat docker_key >> /var/lib/dokku/data/storage/admin-keys/docker
dokku ps:restart admin

# Cleanup
echo '-----> Cleaning up...'
rm -rf dokku_key dokku_key.pub docker_key docker_key.pub bootstrap.sh install.sh
dokku cleanup

echo '-----> Installation complete!'
echo "-----> Go to http://${HOST_IP}:3000/setup?key=${SETUP_KEY}"

unset DOCKER_USER
unset SETUP_KEY
unset HOST_IP
unset CURRENT_USER
unset CURRENT_VERSION