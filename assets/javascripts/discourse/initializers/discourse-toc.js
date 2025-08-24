import { withPluginApi } from "discourse/lib/plugin-api";

function buildTopicTocHtml(headers) {
  if (!headers || headers.length < 2) {
    return '';
  }
  
  // Get current topic URL to build proper post URLs
  const currentUrl = window.location.pathname;
  const topicMatch = currentUrl.match(/^(\/t\/[^\/]+\/\d+)/);
  const topicBase = topicMatch ? topicMatch[1] : null;
  
  let tocHtml = '<div class="discourse-toc discourse-topic-toc">';
  tocHtml += '<div class="discourse-toc-title">Table of Contents (v0.1.2)</div>';
  tocHtml += '<ul class="discourse-toc-list">';
  
  let currentLevel = 0;
  
  for (const header of headers) {
    if (!header || !header.text || !header.id) {
      continue;
    }
    
    // Escape HTML in header text
    const escapedText = header.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const postIndicator = header.post_number > 1 ? ` (Post #${header.post_number})` : '';
    
    // Generate proper Discourse post URL
    let postUrl;
    if (header.post_number === 1) {
      // First post, just use topic URL
      postUrl = topicBase || '#';
    } else {
      // Other posts, use post-specific URL
      postUrl = topicBase ? `${topicBase}/${header.post_number}` : '#';
    }
    
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
    
    tocHtml += `<li><a href="${postUrl}" class="discourse-toc-link" data-post-number="${header.post_number}" data-header-id="${header.id}">${escapedText}${postIndicator}</a>`;
  }
  
  // Close remaining open items and lists
  tocHtml += '</li>';
  for (let i = currentLevel; i > 1; i--) {
    tocHtml += '</ul></li>';
  }
  
  tocHtml += '</ul></div>';
  
  return tocHtml;
}


function initializeToc(api) {
  // Add IDs to headers in ALL posts for cross-post navigation
  api.decorateCookedElement(
    function (element, helper) {
      if (!helper || !helper.getModel) return;
      
      const post = helper.getModel();
      if (!post || !post.topic_headers) return;
      
      // Find headers in this post and add the corresponding IDs from topic_headers
      const headers = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
      headers.forEach(header => {
        const headerText = header.textContent.trim();
        const level = parseInt(header.tagName.substring(1));
        
        // Find matching header in topic_headers to get the correct ID
        const matchingHeader = post.topic_headers.find(h => 
          h.text === headerText && 
          h.level === level && 
          h.post_number === post.post_number
        );
        
        if (matchingHeader && matchingHeader.id && !header.id) {
          header.id = matchingHeader.id;
        }
      });
    },
    { id: "discourse-header-ids" }
  );

  // Generate topic-wide TOC for first post if it has [toc] marker
  api.decorateCookedElement(
    function (element, helper) {
      if (!helper || !helper.getModel) return;
      
      const post = helper.getModel();
      if (!post || post.post_number !== 1) return;
      
      console.log('TOC: Decorator running for post #' + post.post_number);
      console.log('TOC: topic_headers available:', !!post.topic_headers, post.topic_headers?.length);
      
      // Check if this post has [toc] marker (handle both escaped and unescaped)
      const tocMarker = element.textContent.includes('[toc]') || element.textContent.includes('\\[toc\\]');
      console.log('TOC: marker found:', tocMarker);
      
      if (!tocMarker || !post.topic_headers || post.topic_headers.length < 2) {
        console.log('TOC: Conditions not met');
        return;
      }
      
      console.log('TOC: Proceeding to generate TOC');
      
      // Find [toc] marker paragraph and replace it
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let textNode;
      while (textNode = walker.nextNode()) {
        const text = textNode.textContent.trim();
        if (text === '[toc]' || text === '\\[toc\\]') {
          const paragraph = textNode.parentElement;
          if (paragraph && paragraph.tagName === 'P') {
            // Replace paragraph with TOC
            const tocHtml = buildTopicTocHtml(post.topic_headers);
            if (tocHtml) {
              const tocContainer = document.createElement('div');
              tocContainer.innerHTML = tocHtml;
              paragraph.parentNode.replaceChild(tocContainer.firstChild, paragraph);
              break;
            }
          }
        }
      }
    },
    { id: "discourse-topic-toc" }
  );
  
  // Handle TOC interactions
  api.decorateCookedElement(
    function (element) {
      const toc = element.querySelector('.discourse-toc');
      if (toc) {
        // Add navigation behavior to TOC links
        const links = toc.querySelectorAll('.discourse-toc-link');
        links.forEach(link => {
          link.addEventListener('click', function(e) {
            const postNumber = parseInt(this.getAttribute('data-post-number')) || 1;
            const headerId = this.getAttribute('data-header-id');
            
            // For same post (post 1), scroll to header if it exists
            if (postNumber === 1 && headerId) {
              const headerElement = document.getElementById(headerId);
              if (headerElement) {
                e.preventDefault();
                headerElement.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start'
                });
                return;
              }
            }
            
            // For other posts or if header not found, let Discourse handle URL navigation
            // The href will navigate to the proper post, and then we can try to scroll to header
            if (postNumber > 1 && headerId) {
              // After navigation, try to scroll to the specific header
              setTimeout(() => {
                const targetHeader = document.getElementById(headerId);
                if (targetHeader) {
                  targetHeader.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                  });
                }
              }, 500); // Wait for post to load
            }
          });
        });
        
        // Add collapse/expand functionality
        const title = toc.querySelector('.discourse-toc-title');
        if (title) {
          title.style.cursor = 'pointer';
          title.addEventListener('click', function() {
            const list = toc.querySelector('.discourse-toc-list');
            if (list) {
              if (list.style.display === 'none') {
                list.style.display = 'block';
                toc.classList.remove('collapsed');
              } else {
                list.style.display = 'none';
                toc.classList.add('collapsed');
              }
            }
          });
        }
      }
    },
    { id: "discourse-toc" }
  );
  
  if (api.decorateChatMessage) {
    api.decorateChatMessage(
      (element) => {
        // Apply same TOC processing to chat messages if needed
        const toc = element.querySelector('.discourse-toc');
        if (toc) {
          // Add same functionality as in main decorator
          const links = toc.querySelectorAll('.discourse-toc-link');
          links.forEach(link => {
            link.addEventListener('click', function(e) {
              const postNumber = parseInt(this.getAttribute('data-post-number')) || 1;
              const headerId = this.getAttribute('data-header-id');
              
              // For same post (post 1), scroll to header if it exists
              if (postNumber === 1 && headerId) {
                const headerElement = document.getElementById(headerId);
                if (headerElement) {
                  e.preventDefault();
                  headerElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                  });
                }
              }
              // For other posts, let normal navigation handle it
            });
          });
        }
      },
      { id: "discourse-toc-chat" }
    );
  }
}

export default {
  name: "apply-discourse-toc",
  initialize(container) {
    const siteSettings = container.lookup("service:site-settings");
    console.log('TOC: Initializer running, setting enabled:', siteSettings.discourse_toc_enabled);
    if (siteSettings.discourse_toc_enabled) {
      withPluginApi("0.8.31", initializeToc);
    } else {
      console.log('TOC: Plugin disabled via site setting');
    }
  },
};