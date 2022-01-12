# Bullet
Bullet is an all-in-one web UI to self-host your own PaaS. Bullet is built on top of Dokku and supports most of the Dokku ecosystem. You can see a [demo video here](https://cyw.io/bullet) Some features you can manage via the UI are:

- 😸 Automatic deployments from GitHub
- 🚀 Deploy from Docker Hub, Remote Git URLs, GitHub, GitLab, etc
- 🔒 Automatic SSL certificates and renewal
- 📀 Database provisioning and backup management
- 🌐 Manage domains, NGINX, environment variables, and more
- 🔧 Maintenance mode, log viewing, and docker container stats
- ⏰ Deployment rollbacks to any previous commit
- 📖 Documented and accessible REST API
- 👀 Full audit logs and per-account 2FA
- ✨ and more...

# Installation
Please [go here](https://cyw.io/bullet) for manual install instructions.

### Prerequisites
Bullet is currently designed to work best on a fresh install of Ubuntu 20.04+ with at least 2GB of memory. Make sure you are logged in as the root user via SSH.

### Step 1
Download then run the script
```
wget https://raw.githubusercontent.com/cywio/bullet/master/scripts/install.sh
sh ./install.sh cywio/bullet
```
This can take anywhere from 10-15 minutes depending on your VPS.

### Step 2
Visit the URL given at the end of the installation, it should look something like this:
```
https://0.0.0.0:3000/setup?key=a_very_random_string
```

# Contributing
Contributions are welcome and greatly appreciated! If you can, please:
- Use the prettier config file provided
- Use SVGs from [Remix Icon](https://remixicon.com/), don't add any images (PNG, JPEG, etc)
- Use snake_case for API responses 🐍, camelCase for variables 🐪

Setting up a local environment is as simple as filling in the `.env` file, installing packages, then create a `keys` directory in the root of the project and add a file called `dokku` and insert your private key into it. Ensure you do not have a passphrase for the key. Create a local Postgres database and run `yarn migrate` to run migrations and initialize the local database. You should be able to run the project with `yarn dev` afterward.

# License
This project is licensed under the [MIT License](https://choosealicense.com/licenses/mit/)
