# Discourse Table of Contents (TOC) Plugin - Design Document

## Overview

The Discourse TOC plugin automatically generates navigable table of contents for posts with multiple headers. It provides users with quick navigation within long posts and improves content discoverability.

## 1. Requirements

### 1.1 Functional Requirements

**FR-1: TOC Generation**
- Generate TOC from markdown headers (h1-h6) in posts
- Support nested header structures with proper indentation
- Create unique, URL-friendly anchor IDs for each header
- Handle duplicate header text by appending numeric suffixes

**FR-2: User Control**
- Only generate TOC when user explicitly includes `[toc]` marker
- Require minimum 2 headers to generate TOC
- Allow collapse/expand functionality for TOC

**FR-3: Navigation**
- Provide clickable links that scroll to corresponding headers
- Implement smooth scrolling behavior
- Ensure header targets are properly positioned

**FR-4: Integration**
- Integrate seamlessly with Discourse's markdown processing pipeline
- Support both posts and chat messages
- Respect Discourse's theme system and styling

### 1.2 Non-Functional Requirements

**NFR-1: Performance**
- Minimal impact on post rendering performance
- Efficient DOM manipulation
- No blocking operations during page load

**NFR-2: Compatibility**
- Work with all standard Discourse themes
- Support both desktop and mobile layouts
- Maintain compatibility with other plugins

**NFR-3: Security**
- Prevent XSS attacks through proper HTML escaping
- Validate all user input
- Follow Discourse security best practices

**NFR-4: Accessibility**
- Provide semantic HTML structure
- Support keyboard navigation
- Work with screen readers

## 2. Architecture

### 2.1 System Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Markdown      │    │   TOC Markdown   │    │   Rendered      │
│   Content       │───▶│   Processor      │───▶│   HTML with     │
│   with [toc]    │    │   (Server-side)  │    │   TOC           │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client-side   │    │   DOM Event      │    │   TOC           │
│   JavaScript    │◀───│   Listeners      │◀───│   Interaction   │
│   Initializer   │    │   (Click/etc)    │    │   Events        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 2.2 Component Architecture

**2.2.1 Server-Side Components**

- **Plugin Definition (`plugin.rb`)**
  - Registers assets and site settings
  - Integrates with Discourse plugin system

- **Markdown Processor (`discourse-toc.js`)**
  - Parses markdown tokens for headers
  - Generates TOC HTML structure
  - Handles `[toc]` marker replacement

**2.2.2 Client-Side Components**

- **Initializer (`discourse-toc.js`)**
  - Attaches event listeners for navigation
  - Implements collapse/expand functionality
  - Manages smooth scrolling behavior

- **Stylesheet (`discourse-toc.scss`)**
  - Defines TOC visual appearance
  - Provides responsive design
  - Integrates with Discourse theme variables

### 2.3 Data Flow

1. **Content Processing Pipeline**
   ```
   Raw Markdown → Markdown-it Tokenization → TOC Processing → HTML Generation
   ```

2. **TOC Processing Steps**
   ```
   1. Scan tokens for header elements
   2. Generate unique IDs for each header
   3. Build hierarchical TOC structure
   4. Replace [toc] marker with generated HTML
   5. Add IDs to header elements
   ```

3. **Client-Side Enhancement**
   ```
   Page Load → Find TOC Elements → Attach Event Listeners → Enable Interactions
   ```

## 3. Detailed Design

### 3.1 Markdown Processing

**Algorithm: Header Extraction**
```javascript
function extractHeaders(tokens) {
  1. Initialize: headers = [], existingIds = Set()
  2. For each token in tokens:
     a. If token.type === 'heading_open':
        - Extract level from tag (h1→1, h2→2, etc.)
        - Get text content from next inline token
        - Generate unique ID from text
        - Store header info and add ID to token
  3. Return headers array
}
```

**Algorithm: ID Generation**
```javascript
function generateTocId(text, existingIds) {
  1. Convert to lowercase
  2. Remove special characters (keep alphanumeric, spaces, hyphens)
  3. Replace spaces with hyphens
  4. Remove leading/trailing hyphens
  5. Handle duplicates by appending counter
  6. Add to existingIds set
  7. Return unique ID
}
```

**Algorithm: HTML Generation**
```javascript
function buildTocHtml(headers) {
  1. Start with container div
  2. Add title section
  3. Initialize nested list structure
  4. For each header:
     a. Manage nesting levels (open/close <ul> tags)
     b. Create list item with anchor link
     c. Escape HTML in text content
  5. Close remaining nested structures
  6. Return complete HTML
}
```

### 3.2 Client-Side Interactions

**Smooth Scrolling Implementation**
```javascript
// Event listener for TOC links
link.addEventListener('click', function(e) {
  e.preventDefault();
  const target = document.getElementById(targetId);
  target.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
});
```

**Collapse/Expand Functionality**
```javascript
// Toggle TOC visibility
title.addEventListener('click', function() {
  const list = toc.querySelector('.discourse-toc-list');
  list.style.display = (list.style.display === 'none') ? 'block' : 'none';
  toc.classList.toggle('collapsed');
});
```

### 3.3 Styling Architecture

**CSS Class Hierarchy**
```scss
.discourse-toc {
  .discourse-toc-title { /* Clickable title */ }
  .discourse-toc-list {
    ul { /* Nested lists */ }
    li { /* List items */ }
    .discourse-toc-link { /* Navigation links */ }
  }
  &.collapsed { /* Collapsed state */ }
}
```

**Theme Integration**
- Uses Discourse CSS custom properties (`var(--primary)`, etc.)
- Responsive breakpoints align with Discourse standards
- Print styles for documentation use cases

## 4. Implementation Details

### 4.1 File Structure
```
discourse-toc/
├── plugin.rb                              # Main plugin definition
├── config/
│   └── settings.yml                       # Site setting configuration
├── assets/
│   ├── javascripts/
│   │   ├── lib/discourse-markdown/
│   │   │   └── discourse-toc.js          # Markdown processor
│   │   └── initializers/
│   │       └── discourse-toc.js          # Client-side functionality
│   └── stylesheets/
│       └── discourse-toc.scss            # Styling
├── DESIGN_DOC.md                         # This document
├── TEST_CONTENT.md                       # Testing instructions
└── README.md                             # User documentation
```

### 4.2 Key Algorithms

**4.2.1 Nesting Level Management**
```javascript
// Handle header level transitions
if (header.level > currentLevel) {
  // Open new nested levels
  for (let i = currentLevel; i < header.level - 1; i++) {
    tocHtml += '<li><ul>';
  }
} else if (header.level < currentLevel) {
  // Close nested levels
  for (let i = currentLevel; i > header.level; i--) {
    tocHtml += '</ul></li>';
  }
}
```

**4.2.2 Error Handling Strategy**
- Try-catch blocks around all processing functions
- Validation of input parameters
- Graceful degradation when errors occur
- Console logging for debugging

### 4.3 Security Considerations

**HTML Escaping**
```javascript
const escapedText = header.text
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');
```

**Input Validation**
- Validate header objects before processing
- Check for required properties (text, id, level)
- Sanitize generated HTML content

## 5. Configuration

### 5.1 Site Settings

**discourse_toc_enabled**
- Type: Boolean
- Default: true
- Client-side: true
- Description: "Enable automatic Table of Contents generation for posts with headers"

### 5.2 Plugin Registration

```ruby
enabled_site_setting :discourse_toc_enabled
register_asset "stylesheets/discourse-toc.scss"
```

## 6. Testing Strategy

### 6.1 Test Scenarios

**Functional Tests**
1. TOC generation with [toc] marker and 2+ headers
2. No TOC generation without [toc] marker
3. No TOC generation with <2 headers
4. Proper nesting with mixed header levels
5. Duplicate header text handling
6. Special characters in header text

**Integration Tests**
1. Compatibility with other markdown features
2. Theme integration across different themes
3. Mobile responsiveness
4. Chat message compatibility

**Performance Tests**
1. Large posts with many headers
2. Multiple TOCs on same page
3. Memory usage monitoring

### 6.2 Browser Compatibility

**Supported Browsers**
- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

**Mobile Support**
- iOS Safari 12+
- Chrome Mobile 70+
- Android WebView 70+

## 7. Deployment

### 7.1 Installation Process

1. Clone plugin to `plugins/discourse-toc` directory
2. Run `./launcher rebuild app`
3. Enable plugin in admin settings
4. Configure site settings as needed

### 7.2 Rollback Strategy

1. Disable site setting `discourse_toc_enabled`
2. Remove plugin directory
3. Run `./launcher rebuild app`

## 8. Monitoring and Maintenance

### 8.1 Error Monitoring

- JavaScript console errors for client-side issues
- Server logs for processing errors
- Performance metrics for rendering time

### 8.2 Maintenance Tasks

- Regular testing with Discourse updates
- Plugin dependency updates
- Performance optimization reviews

## 9. Future Enhancements

### 9.1 Potential Features

**Enhanced Customization**
- Configurable minimum header count
- Custom TOC titles
- Position preferences (top/bottom/sidebar)

**Advanced Navigation**
- "Back to TOC" links on headers
- Highlighting current section while scrolling
- Keyboard shortcuts for navigation

**Export Features**
- Print-friendly TOC formatting
- PDF export with linked TOC
- Standalone TOC extraction

### 9.2 Plugin API Extensions

**Hooks for Customization**
```javascript
// Allow other plugins to customize TOC generation
api.decorateTocGeneration((headers) => {
  // Custom processing
  return modifiedHeaders;
});
```

## 10. Appendices

### 10.1 CSS Custom Properties Used

- `--primary`: Main text color
- `--primary-high`: Hover state color
- `--primary-low`: Border colors
- `--primary-very-low`: Background colors
- `--primary-medium`: Secondary text

### 10.2 Discourse Plugin API Usage

- `withPluginApi()`: Client-side plugin initialization
- `decorateCookedElement()`: DOM enhancement after rendering
- `enabled_site_setting`: Conditional plugin activation
- `register_asset`: Asset registration for compilation

### 10.3 Performance Considerations

**Optimization Techniques**
- Minimal DOM queries using cached selectors
- Event delegation for dynamic content
- CSS transitions for smooth animations
- Lazy loading of TOC interactions until needed

**Memory Management**
- Proper cleanup of event listeners
- Avoiding circular references
- Efficient string concatenation for HTML generation

---

**Document Version**: 1.0  
**Last Updated**: 2025-08-23  
**Author**: Bartlomiej Wolk  
**Review Status**: Initial Draft