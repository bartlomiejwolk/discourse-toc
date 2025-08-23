# Discourse TOC Plugin - Development Guide

## Project Overview
This document outlines the complete development setup and workflow for the `discourse-toc` plugin - a Table of Contents plugin for Discourse posts that automatically generates TOCs for posts with headers.

## Environment Details
- **Platform**: Linux (WSL2) with Docker Desktop
- **Discourse Installation**: `/var/discourse` (Docker-based)
- **Development Directory**: `/root/ld-plugins/discourse-toc`
- **Container Plugin Path**: `/var/www/discourse/plugins/discourse-toc`

## Initial Setup Process

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
ssh-keygen -t ed25519 -C "bartlomiejwolk@github" -f ~/.ssh/id_ed25519 -N ""

# Added GitHub to known hosts
ssh-keyscan -t rsa github.com >> ~/.ssh/known_hosts

# Public key (added to GitHub SSH keys):
# Public key was added to GitHub SSH keys (not shown for security)
```

#### GitHub Repository Setup
```bash
# Connected to GitHub repository
git remote add origin git@github.com:bartlomiejwolk/discourse-toc.git
git branch -M main
git push -u origin main
```

#### Git Configuration
```bash
# Set global Git identity
git config --global user.email "your-email@example.com"
git config --global user.name "msns"
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
- **GitHub Repository**: https://github.com/bartlomiejwolk/discourse-toc
- **Clone URL**: git@github.com:bartlomiejwolk/discourse-toc.git
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