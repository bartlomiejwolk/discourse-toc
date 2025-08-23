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

1. **Clone the plugin**
   ```bash
   cd /var/discourse
   git clone https://github.com/bartlomiejwolk/discourse-toc.git plugins/discourse-toc
   ```

2. **Rebuild Discourse**
   ```bash
   ./launcher rebuild app
   ```

3. **Enable in Admin** (optional - enabled by default)
   - Go to Admin → Settings → Plugins
   - Find "discourse toc enabled" and ensure it's checked

### Usage

Simply add `[toc]` to any post with multiple headers:

```markdown
[toc]

# Introduction
Welcome to my tutorial!

## Getting Started
Let's begin with the basics.

### Prerequisites
You'll need these items.

### Installation Steps
Follow these steps.

## Advanced Topics
More complex information here.
```

**Result:** The `[toc]` marker gets replaced with a clickable table of contents showing all your headers.

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

### Setup
```bash
# Clone for development
git clone git@github.com:bartlomiejwolk/discourse-toc.git ~/ld-plugins/discourse-toc

# Set up development environment (see DEVELOPMENT_GUIDE.md for full instructions)
cd ~/ld-plugins/discourse-toc
./sync-plugin.sh
```

### Development Workflow
1. Edit files in `~/ld-plugins/discourse-toc/`
2. Commit changes - auto-sync runs via Git hook
3. Test in Discourse container
4. Push to GitHub when ready

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