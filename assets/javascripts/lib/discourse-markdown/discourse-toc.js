// TOC (Table of Contents) markdown processor for Discourse
// Automatically generates table of contents from headers in posts

function generateTocId(text, existingIds) {
  // Generate a URL-friendly ID from header text
  let id = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  
  // Handle duplicates by appending numbers
  let counter = 1;
  let originalId = id;
  while (existingIds.has(id)) {
    id = originalId + '-' + counter;
    counter++;
  }
  existingIds.add(id);
  
  return id;
}

function extractHeaders(tokens) {
  const headers = [];
  const existingIds = new Set();
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    
    if (token.type === 'heading_open') {
      const level = parseInt(token.tag.substring(1)); // h1 -> 1, h2 -> 2, etc.
      const contentToken = tokens[i + 1];
      
      if (contentToken && contentToken.type === 'inline') {
        const text = contentToken.content;
        const id = generateTocId(text, existingIds);
        
        // Add ID to the opening tag safely
        if (token.attrSet) {
          token.attrSet('id', id);
        } else {
          // Fallback for older markdown-it versions
          if (!token.attrs) token.attrs = [];
          token.attrs.push(['id', id]);
        }
        
        headers.push({
          level: level,
          text: text,
          id: id
        });
      }
    }
  }
  
  return headers;
}

function buildTocHtml(headers) {
  if (!headers || headers.length === 0) {
    return '';
  }
  
  try {
    let tocHtml = '<div class="discourse-toc">';
    tocHtml += '<div class="discourse-toc-title">Table of Contents</div>';
    tocHtml += '<ul class="discourse-toc-list">';
    
    let currentLevel = 0;
    
    for (const header of headers) {
      // Validate header object
      if (!header || !header.text || !header.id) {
        continue;
      }
      
      // Escape HTML in header text
      const escapedText = header.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      
      if (header.level > currentLevel) {
        // Open new nested levels
        for (let i = currentLevel; i < header.level - 1; i++) {
          tocHtml += '<li><ul>';
        }
        currentLevel = header.level;
      } else if (header.level < currentLevel) {
        // Close nested levels
        for (let i = currentLevel; i > header.level; i--) {
          tocHtml += '</ul></li>';
        }
        tocHtml += '</li>'; // Close current item
        currentLevel = header.level;
      } else {
        // Same level, close previous item
        tocHtml += '</li>';
      }
      
      tocHtml += `<li><a href="#${header.id}" class="discourse-toc-link">${escapedText}</a>`;
    }
    
    // Close remaining open items and lists
    tocHtml += '</li>';
    for (let i = currentLevel; i > 1; i--) {
      tocHtml += '</ul></li>';
    }
    
    tocHtml += '</ul></div>';
    
    return tocHtml;
  } catch (error) {
    console.error('Error building TOC HTML:', error);
    return '';
  }
}

function processToc(state) {
  try {
    if (!state || !state.tokens) {
      return;
    }
    
    const tokens = state.tokens;
    let tocInserted = false;
    
    // First pass: extract headers and add IDs
    const headers = extractHeaders(tokens);
    
    // Only generate TOC if we have at least 2 headers
    if (headers.length < 2) {
      return;
    }
    
    // Second pass: look for [toc] marker and insert TOC
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      
      if (token.type === 'paragraph_open') {
        const contentToken = tokens[i + 1];
        if (contentToken && 
            contentToken.type === 'inline' && 
            contentToken.content.trim() === '[toc]') {
          
          // Replace the [toc] paragraph with our TOC
          const tocHtml = buildTocHtml(headers);
          
          if (tocHtml) {
            // Replace the paragraph tokens with a single HTML token
            tokens.splice(i, 3, {
              type: 'html_raw',
              content: tocHtml,
              level: 0,
              block: true
            });
            
            tocInserted = true;
            break;
          }
        }
      }
    }
  } catch (error) {
    console.error('Error processing TOC:', error);
  }
}

export function setup(helper) {
  if (!helper.markdownIt) {
    return;
  }
  
  helper.registerOptions((opts, siteSettings) => {
    opts.features.toc = siteSettings.discourse_toc_enabled;
  });
  
  helper.registerPlugin((md) => {
    if (md.options.discourse.features.toc) {
      md.core.ruler.after('block', 'toc', processToc);
    }
  });
}