# Discourse TOC Plugin

[![Status](https://img.shields.io/badge/status-production--ready-green)](https://github.com/bartlomiejwolk/discourse-toc)
[![License](https://img.shields.io/badge/license-MIT-blue)](https://github.com/bartlomiejwolk/discourse-toc/blob/main/LICENSE)

A powerful Table of Contents plugin for Discourse that automatically generates navigable TOCs from post headers with smooth scrolling and responsive design.

## Features

- **Automatic TOC Generation** - Scans posts for headers (h1-h6) and creates linked navigation
- **Simple Usage** - Just add `[toc]` to any post with 2+ headers
- **Smart Targeting** - Only processes posts where `[toc]` marker is explicitly added
- **Responsive Design** - Works seamlessly on desktop and mobile
- **Theme Integration** - Automatically matches your Discourse theme colors
- **Smooth Scrolling** - Animated navigation to header sections
- **Collapsible TOC** - Click title to expand/collapse TOC content
- **Security First** - Proper HTML escaping and input validation
- **Nested Headers** - Supports proper hierarchical structure (h1 > h2 > h3)
- **Unique Anchors** - Generates URL-friendly IDs with duplicate handling

## Quick Start

### Installation

1. **Add plugin to app.yml**
   ```bash
   cd /var/discourse
   # Edit containers/app.yml and add under hooks: after_code:
   ```
   
   Add this to `/var/discourse/containers/app.yml`:
   ```yaml
   hooks:
     after_code:
       - exec:
           cmd:
             - git clone https://github.com/bartlomiejwolk/discourse-toc.git /var/www/discourse/plugins/discourse-toc
   ```

2. **Rebuild Discourse**
   ```bash
   ./launcher rebuild app
   ```

3. **Plugin Auto-Enabled** 
   - Plugin is enabled by default via `discourse_toc_enabled` site setting
   - Can be disabled in Admin → Settings → Plugins if needed

### Usage

Add `[toc]` to the **first post** of a topic to generate a table of contents from **all posts** in that topic:

```markdown
[toc]

# Introduction (Post 1)
Welcome to my tutorial!
```

In later posts:
```markdown
## Getting Started (Post 2)
Let's begin with the basics.

### Prerequisites (Post 3)  
You'll need these items.

## Advanced Topics (Post 4)
More complex information here.
```

**Result:** The `[toc]` marker in the first post gets replaced with a clickable table of contents showing headers from all posts, with "(Post #N)" indicators for cross-post navigation.

## Examples

### Basic TOC
```markdown
[toc]

# Main Section
Content here...

## Subsection A
More content...

## Subsection B
Even more content...
```

### No TOC Generated
```markdown
# Single Header
Only one header - no TOC will be generated even with [toc] marker.
```

## Configuration

### Site Settings

- **`discourse_toc_enabled`** (default: `true`)
  - Controls whether the plugin processes `[toc]` markers
  - Can be disabled globally via Admin → Settings

### Customization

The plugin uses standard Discourse theme variables for styling:
- `--primary` - Text colors
- `--primary-low` - Borders
- `--primary-very-low` - Backgrounds

## Documentation

- **[Design Document](DESIGN_DOC.md)** - Complete technical architecture and implementation details
- **[Development Guide](DEVELOPMENT_GUIDE.md)** - Environment setup and development workflow
- **[Test Content](TEST_CONTENT.md)** - Testing examples and expected behavior

## Development

### Requirements
- WSL2 Ubuntu 20.04 (or similar Linux environment)
- Docker Desktop with WSL2 integration
- Discourse Docker installation
- Git with SSH access to GitHub

### Fast Development Setup (Recommended)

Use Discourse's boot_dev environment for rapid development with hot reload:

```bash
# One-time setup
mkdir -p ~/src && cd ~/src
git clone https://github.com/discourse/discourse.git
git clone https://github.com/bartlomiejwolk/discourse-toc.git plugins/discourse-toc
cd ~/src/discourse
d/boot_dev --init

# Start development servers (in separate terminals or background)
docker exec discourse_dev bash -c "cd /src && bundle exec rails server -b 0.0.0.0 -p 3000" &
docker exec discourse_dev bash -c "cd /src && pnpm ember serve --host 0.0.0.0 --port 4200 --proxy http://localhost:3000" &
```

**Benefits:**
- **Hot Reload**: JavaScript changes rebuild in ~100ms
- **Live Development**: Edit files in `~/src/discourse/plugins/discourse-toc/` and see changes immediately
- **Full Stack**: Rails API server (port 3000) + Ember frontend (port 4200)
- **Fast Iteration**: No Docker rebuilds needed for code changes

**Access Points:**
- **Ember Development**: http://localhost:4200 (with hot reload)
- **Rails API**: http://localhost:3000

### Production Testing

For final testing before deployment:

```bash
# Commit and push changes
cd ~/src/discourse/plugins/discourse-toc
git add . && git commit -m "your changes" && git push

# Deploy to production Discourse
cd /var/discourse
./launcher rebuild app
```

### Development Workflows

#### Fast Development Cycle
1. **Edit**: Files in `~/src/discourse/plugins/discourse-toc/`
2. **Test**: Changes immediately available at http://localhost:4200
3. **Iterate**: JavaScript hot reload in ~100ms, Ruby changes available immediately
4. **Commit**: When ready, commit and push to GitHub

#### Legacy Workflow (Deprecated)
The old sync script method with symlinks is no longer recommended due to complexity and rebuild issues. Use boot_dev for development instead.

## Testing

Test the plugin with different scenarios:

1. **Basic TOC** - Post with `[toc]` and 2+ headers
2. **No TOC** - Post without `[toc]` marker (no TOC should appear)
3. **Insufficient headers** - Post with `[toc]` but <2 headers (no TOC)
4. **Nested headers** - Mixed h1, h2, h3 levels for proper nesting
5. **Special characters** - Headers with punctuation and Unicode
6. **Duplicates** - Multiple headers with same text

## Troubleshooting

### Plugin Not Loading
```bash
# Check if plugin is recognized
docker exec app bash -c "cd /var/www/discourse && RAILS_ENV=production rails runner 'puts Discourse.plugins.map(&:name)'"

# Restart Discourse
docker exec app sv restart unicorn
```

### TOC Not Appearing
1. Ensure post has 2+ headers (`#`, `##`, `###`, etc.)
2. Verify `[toc]` marker is on its own line
3. Check that `discourse_toc_enabled` setting is true
4. Look for JavaScript errors in browser console

### Debugging
```bash
# Check Discourse logs
docker exec app tail -f /var/www/discourse/log/production.log

# Check for plugin-specific errors
docker exec app grep -r "discourse-toc" /var/www/discourse/log/
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/bartlomiejwolk/discourse-toc/issues)
- **Documentation**: [Design Document](DESIGN_DOC.md) and [Development Guide](DEVELOPMENT_GUIDE.md)
- **Discourse Meta**: Search for "TOC plugin" topics

---

**Made for the Discourse community**