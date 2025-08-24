# Discourse TOC Plugin - Development Guide

## Project Overview
This document outlines the complete development setup and workflow for the `discourse-toc` plugin - a Table of Contents plugin for Discourse posts that automatically generates TOCs for posts with headers.

## Modern Development Approach (Recommended)

### Fast Development with boot_dev

For rapid development with hot reload capabilities, use Discourse's official boot_dev environment:

**Benefits:**
- JavaScript hot reload in ~100ms
- No manual syncing required
- Full Rails + Ember development stack
- Live development with immediate feedback
- Same environment used by Discourse core developers

**Setup:**
```bash
# One-time setup
mkdir -p ~/src && cd ~/src
git clone https://github.com/discourse/discourse.git
git clone https://github.com/bartlomiejwolk/discourse-toc.git plugins/discourse-toc
cd ~/src/discourse
d/boot_dev --init

# Start development servers
docker exec discourse_dev bash -c "cd /src && bundle exec rails server -b 0.0.0.0 -p 3000" &
docker exec discourse_dev bash -c "cd /src && pnpm ember serve --host 0.0.0.0 --port 4200 --proxy http://localhost:3000" &
```

**Development Workflow:**
1. Edit files in `~/src/discourse/plugins/discourse-toc/`
2. View changes immediately at http://localhost:4200 
3. JavaScript changes auto-rebuild in ~100ms
4. Test complete functionality with hot reload
5. Commit and push when ready

**Access Points:**
- **Ember Development**: http://localhost:4200 (with hot reload)
- **Rails API**: http://localhost:3000
- **Production**: Use rebuild method when ready to deploy

### Admin Account Creation

When first accessing http://localhost:4200, you'll need to create an admin account:

```bash
# Create admin user script
cat > /tmp/create_admin.rb << 'EOF'
User.create!(
  username: "admin",
  email: "admin@localhost.dev", 
  password: "adminpassword123",
  active: true,
  approved: true,
  admin: true
)
puts "Admin user created successfully!"
EOF

# Copy script to container and execute
docker cp /tmp/create_admin.rb discourse_dev:/tmp/create_admin.rb
docker exec discourse_dev bash -c "cd /src && bundle exec rails runner /tmp/create_admin.rb"
```

**Login Credentials:**
- **Username**: `admin`
- **Password**: `adminpassword123`
- **Access**: http://localhost:4200

This modern approach replaces the complex sync script method described in the legacy sections below.

## Environment Details
- **Platform**: Linux (WSL2) with Docker Desktop
- **OS**: Ubuntu 20.04 LTS (WSL2)
- **Docker**: Docker Desktop for Windows with WSL2 backend
- **Production Discourse**: `/var/discourse` (Docker-based)
- **Development Environment**: `~/src/discourse` (boot_dev with hot reload)
- **Plugin Development**: `~/src/discourse/plugins/discourse-toc`
- **Production Plugin Path**: `/var/www/discourse/plugins/discourse-toc`

## Complete Environment Recreation Guide

### 1. WSL2 Setup

#### Install WSL2 on Windows
```powershell
# Run in PowerShell as Administrator
wsl --install -d Ubuntu-20.04
# Reboot when prompted
```

#### Initial WSL2 Configuration
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y git curl wget vim nano build-essential

# Set up user as root (optional, for development environment)
# This matches the development setup used
sudo passwd root
su root
cd /root
```

### 2. Docker Desktop Installation

#### Windows Host Setup
1. **Install Docker Desktop**
   - Download from https://www.docker.com/products/docker-desktop
   - Enable WSL2 integration during installation
   - Enable WSL2 integration for Ubuntu-20.04 distribution

#### WSL2 Docker Configuration
```bash
# Verify Docker is accessible from WSL2
docker --version
docker-compose --version

# Test Docker functionality
docker run hello-world
```

### 3. Discourse Installation

#### Clone Discourse Docker Repository
```bash
cd /var
sudo mkdir discourse
cd discourse
sudo git clone https://github.com/discourse/discourse_docker.git .
sudo chmod +x launcher
```

#### Configure Discourse
```bash
# Copy sample configuration
sudo cp samples/standalone.yml containers/app.yml

# Edit configuration (replace with your values)
sudo nano containers/app.yml
# Set DISCOURSE_HOSTNAME, DISCOURSE_DEVELOPER_EMAILS, etc.

# Fix world-readable permissions
sudo chmod o-rwx containers/app.yml
```

#### Build and Start Discourse
```bash
# Initial build (takes 15-30 minutes)
sudo ./launcher bootstrap app

# Start the container
sudo ./launcher start app

# Verify installation
docker ps  # Should show 'app' container running
```

### 4. Development Tools Setup

#### Claude Code Installation
```bash
# Install Claude Code (AI assistant for development)
# Follow installation instructions from https://claude.ai/code
# or use package manager if available

# Set up Claude Code for Discourse development
# Create CLAUDE.md in /var/discourse for context
```

#### Essential Development Commands
```bash
# Common Docker commands for development
alias app-logs='docker exec app tail -f /var/www/discourse/log/production.log'
alias app-enter='docker exec -it app bash'
alias app-restart='docker exec app sv restart unicorn'
alias app-rebuild='cd /var/discourse && ./launcher rebuild app'

# Add to ~/.bashrc for persistence
echo "alias app-logs='docker exec app tail -f /var/www/discourse/log/production.log'" >> ~/.bashrc
echo "alias app-enter='docker exec -it app bash'" >> ~/.bashrc
echo "alias app-restart='docker exec app sv restart unicorn'" >> ~/.bashrc
echo "alias app-rebuild='cd /var/discourse && ./launcher rebuild app'" >> ~/.bashrc
```

### 5. Plugin Development Environment

#### Create Plugin Development Directory
```bash
# Create development directory outside Discourse installation
mkdir -p /root/ld-plugins
cd /root/ld-plugins

# This directory will hold all plugin development projects
# and survive container rebuilds
```

#### Set Up Git Configuration
```bash
# Configure Git globally (replace with your details)
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
git config --global init.defaultBranch main
```

#### SSH Key Setup for GitHub
```bash
# Generate SSH key for GitHub (replace email)
ssh-keygen -t ed25519 -C "your-email@example.com" -f ~/.ssh/id_ed25519 -N ""

# Add GitHub to known hosts
ssh-keyscan -t rsa github.com >> ~/.ssh/known_hosts

# Display public key to add to GitHub
cat ~/.ssh/id_ed25519.pub
# Copy this key to GitHub Settings > SSH Keys

# Test SSH connection
ssh -T git@github.com
```

### 6. Development Workflow Setup

#### Create Plugin Sync Script
```bash
# Create sync script for plugin development
cat > /root/ld-plugins/sync-plugin.sh << 'EOF'
#!/bin/bash
PLUGIN_NAME="discourse-toc"
DEV_DIR="/root/ld-plugins/$PLUGIN_NAME"
SHARED_DIR="/var/discourse/shared/standalone/ld-plugins/$PLUGIN_NAME"

echo "Syncing $PLUGIN_NAME plugin..."
rsync -av --delete "$DEV_DIR/" "$SHARED_DIR/"
echo "Plugin synced successfully!"
EOF

# Make script executable
chmod +x /root/ld-plugins/sync-plugin.sh
```

#### Set Up Container Plugin Symlink
```bash
# Create shared directory
mkdir -p /var/discourse/shared/standalone/ld-plugins/discourse-toc

# Inside container, create symlink
docker exec app ln -sf /shared/ld-plugins/discourse-toc /var/www/discourse/plugins/discourse-toc
```

### 7. TOC Plugin Specific Setup

#### Clone TOC Plugin Repository
```bash
cd /root/ld-plugins
git clone git@github.com:bartlomiejwolk/discourse-toc.git
cd discourse-toc
```

#### Set Up Git Post-Commit Hook
```bash
# Create automated sync hook
cat > .git/hooks/post-commit << 'EOF'
#!/bin/bash
# Git post-commit hook to automatically sync plugin to Discourse

echo "Running post-commit hook: syncing plugin to Discourse..."

# Run the sync script
/root/ld-plugins/sync-plugin.sh

echo "Plugin synced to Discourse successfully!"
EOF

# Make hook executable
chmod +x .git/hooks/post-commit
```

#### Test Plugin Setup
```bash
# Sync plugin to container
/root/ld-plugins/sync-plugin.sh

# Restart Discourse to load plugin
docker exec app sv restart unicorn

# Verify plugin is loaded
docker exec app bash -c "cd /var/www/discourse && RAILS_ENV=production rails runner 'puts Discourse.plugins.map(&:name)'" | grep discourse-toc
```

### 8. Environment Verification

#### System Requirements Check
```bash
# Verify all components are working
echo "=== Environment Verification ==="

echo "1. WSL2 Version:"
wsl --version

echo "2. Docker Status:"
docker --version
docker ps

echo "3. Discourse Status:"
docker exec app bash -c "cd /var/www/discourse && RAILS_ENV=production rails runner 'puts Rails.application.class'"

echo "4. Plugin Status:"
docker exec app bash -c "cd /var/www/discourse && RAILS_ENV=production rails runner 'puts \"TOC Plugin: #{Discourse.plugins.any? { |p| p.name == \"discourse-toc\" }}\"'"

echo "5. Git Configuration:"
git config --global --list

echo "6. SSH GitHub Connection:"
ssh -T git@github.com
```

### 9. Common Issues and Solutions

#### WSL2 Docker Issues
```bash
# If Docker commands fail:
# 1. Restart Docker Desktop on Windows
# 2. Restart WSL2: wsl --shutdown, then restart WSL2
# 3. Verify WSL2 integration is enabled in Docker Desktop settings
```

#### Discourse Container Issues
```bash
# If Discourse won't start:
cd /var/discourse
./launcher logs app  # Check for errors
./launcher rebuild app  # Nuclear option - rebuilds everything
```

#### Plugin Development Issues
```bash
# If plugin doesn't load:
# 1. Check plugin syntax: docker exec app ls -la /var/www/discourse/plugins/discourse-toc/
# 2. Check logs: docker exec app tail -f /var/www/discourse/log/production.log
# 3. Restart unicorn: docker exec app sv restart unicorn
# 4. Check site setting: discourse_toc_enabled should be true
```

### 10. Quick Start Summary

For experienced developers who need to recreate this environment:

```bash
# 1. Install WSL2 Ubuntu 20.04
wsl --install -d Ubuntu-20.04

# 2. Install Docker Desktop with WSL2 integration

# 3. Set up Discourse
cd /var && sudo mkdir discourse && cd discourse
sudo git clone https://github.com/discourse/discourse_docker.git .
sudo cp samples/standalone.yml containers/app.yml
# Edit app.yml with your config
sudo ./launcher bootstrap app && sudo ./launcher start app

# 4. Set up plugin development
mkdir -p /root/ld-plugins
cd /root/ld-plugins
git clone git@github.com:bartlomiejwolk/discourse-toc.git
./sync-plugin.sh
docker exec app ln -sf /shared/ld-plugins/discourse-toc /var/www/discourse/plugins/discourse-toc
docker exec app sv restart unicorn
```

## Historical Setup Process (Original Development)

### 1. Development Environment Setup

#### Plugin Directory Structure
```bash
# Created development directory outside Discourse installation
mkdir -p ~/ld-plugins
cd ~/ld-plugins
mkdir discourse-toc
```

#### Initial Plugin Files
Created base plugin structure:
- `plugin.rb` - Main plugin definition file
- `README.md` - Project documentation
- `GITHUB_SETUP.md` - GitHub setup instructions

### 2. Version Control Setup

#### Git Repository Initialization
```bash
cd ~/ld-plugins/discourse-toc
git init
git add .
git commit -m "Initial plugin structure"
```

#### SSH Key Generation for GitHub
```bash
# Generated SSH key for GitHub authentication
ssh-keygen -t ed25519 -C "your-email@example.com" -f ~/.ssh/id_ed25519 -N ""

# Added GitHub to known hosts
ssh-keyscan -t rsa github.com >> ~/.ssh/known_hosts

# Public key was added to GitHub SSH keys (not shown for security)
```

#### GitHub Repository Setup
```bash
# Connected to GitHub repository
git remote add origin git@github.com:username/repository-name.git
git branch -M main
git push -u origin main
```

#### Git Configuration
```bash
# Set global Git identity
git config --global user.email "your-email@example.com"
git config --global user.name "your-username"
```

### 3. Discourse Integration

#### Plugin Deployment Strategy
Due to container isolation, implemented a sync-based approach instead of direct symlinks:

1. **Development Location**: `/root/ld-plugins/discourse-toc/` (version controlled)
2. **Shared Directory**: `/var/discourse/shared/standalone/ld-plugins/discourse-toc/` (accessible to container)
3. **Container Path**: `/var/www/discourse/plugins/discourse-toc` (symlinked to shared directory)

#### Sync Script Creation
Created `/root/ld-plugins/sync-plugin.sh`:
```bash
#!/bin/bash
PLUGIN_NAME="discourse-toc"
DEV_DIR="/root/ld-plugins/$PLUGIN_NAME"
SHARED_DIR="/var/discourse/shared/standalone/ld-plugins/$PLUGIN_NAME"

echo "Syncing $PLUGIN_NAME plugin..."
rsync -av --delete "$DEV_DIR/" "$SHARED_DIR/"
echo "Plugin synced successfully!"
```

#### Container Symlink Setup
```bash
# Inside container, created symlink to shared directory
docker exec app ln -sf /shared/ld-plugins/discourse-toc /var/www/discourse/plugins/discourse-toc
```

### 4. Automated Development Workflow

#### Git Post-Commit Hook
Created `.git/hooks/post-commit` to automatically sync plugin after each commit:
```bash
#!/bin/bash
echo "Running post-commit hook: syncing plugin to Discourse..."
/root/ld-plugins/sync-plugin.sh
echo "Plugin synced to Discourse successfully!"
```

## Current Plugin Structure

### File Organization
```
~/ld-plugins/discourse-toc/
├── .git/                          # Git repository
│   └── hooks/
│       └── post-commit           # Auto-sync hook
├── plugin.rb                     # Main plugin definition
├── README.md                     # Project overview
├── GITHUB_SETUP.md              # GitHub setup instructions
├── DEVELOPMENT_GUIDE.md         # This documentation
└── app/                         # (Future: Models, controllers, serializers)
    ├── controllers/
    ├── models/
    └── serializers/
└── assets/                      # (Future: CSS, JavaScript files)
    ├── javascripts/
    └── stylesheets/
└── lib/                         # (Future: Ruby libraries)
└── spec/                        # (Future: Tests)
```

### Plugin Metadata (plugin.rb)
```ruby
# frozen_string_literal: true

# name: discourse-toc
# about: Table of Contents plugin for Discourse posts
# version: 0.1.0
# authors: Bartlomiej Wolk
# url: https://github.com/bartlomiejwolk/discourse-toc

after_initialize do
  # Plugin initialization code will go here
end
```

## Development Workflow

### Daily Development Process
1. **Edit Files**: Make changes in `~/ld-plugins/discourse-toc/`
2. **Commit Changes**: `git add . && git commit -m "Feature description"`
   - Git hook automatically syncs to Discourse
   - Changes immediately available for testing
3. **Push to GitHub**: `git push` (when ready to share)
4. **Test in Discourse**: Changes are live in container at `/var/www/discourse/plugins/discourse-toc`

### Manual Sync (if needed)
```bash
~/ld-plugins/sync-plugin.sh
```

### Discourse Container Commands
```bash
# List all plugins
docker exec app ls -la /var/www/discourse/plugins/

# Check plugin files
docker exec app ls -la /var/www/discourse/plugins/discourse-toc/

# View plugin content
docker exec app cat /var/www/discourse/plugins/discourse-toc/plugin.rb

# Restart Discourse (for major changes)
docker exec app sv restart unicorn
# Or for full rebuild: ./launcher rebuild app
```

## Technical Notes

### Docker/Container Considerations
- **TTY Issues**: Use `docker exec app <command>` instead of `./launcher enter app` in non-interactive environments
- **Docker Desktop**: Uses different networking than native Docker (docker0 interface doesn't exist)
- **Shared Volumes**: Plugin files must be in `/var/discourse/shared/standalone/` to persist across container rebuilds

### Security Considerations
- Fixed world-readable warning: `chmod o-rwx containers/app.yml`
- SSH keys stored securely in `~/.ssh/`
- Plugin files have appropriate permissions

## Repository Information
- **GitHub Repository**: https://github.com/username/repository-name
- **Clone URL**: git@github.com:username/repository-name.git
- **Development Branch**: main
- **Auto-sync**: Enabled via Git post-commit hook

## Next Development Steps
1. Implement core TOC generation logic
2. Add JavaScript for client-side TOC rendering
3. Create CSS styling for TOC appearance
4. Add configuration options
5. Implement tests
6. Add documentation for end users

## Troubleshooting

### Common Issues
- **Permission denied**: Ensure sync script is executable (`chmod +x`)
- **Plugin not loading**: Check Discourse logs via `docker exec app tail -f /var/log/unicorn.log`
- **Git push fails**: Verify SSH key is added to GitHub account
- **Container access issues**: Use `docker exec app` commands instead of `./launcher enter`

### Useful Commands
```bash
# Check Git status
cd ~/ld-plugins/discourse-toc && git status

# View recent commits
cd ~/ld-plugins/discourse-toc && git log --oneline -5

# Test SSH connection to GitHub
ssh -T git@github.com

# Check if plugin is recognized by Discourse
docker exec app grep -r "discourse-toc" /var/www/discourse/plugins/
```

## Documentation History
- **Initial Setup**: 2025-08-23 - Complete development environment and workflow established
- **Next Update**: Will include plugin feature implementation details