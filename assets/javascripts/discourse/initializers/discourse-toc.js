import { withPluginApi } from "discourse/lib/plugin-api";

function buildTopicTocHtml(headers) {
  if (!headers) {
    headers = [];
  }
  
  // Get current topic URL to build proper post URLs
  const currentUrl = window.location.pathname;
  const topicMatch = currentUrl.match(/^(\/t\/[^\/]+\/\d+)/);
  const topicBase = topicMatch ? topicMatch[1] : null;
  
  let tocHtml = '<div class="discourse-toc discourse-toc--topic">';
  tocHtml += '<div class="discourse-toc__title">TOC</div>';
  
  if (headers.length === 0) {
    tocHtml += '<div class="discourse-toc__empty">No headers found in this topic.</div>';
    tocHtml += '</div>';
    return tocHtml;
  }
  
  tocHtml += '<ul class="discourse-toc__list">';
  
  let currentLevel = 0;
  
  for (const header of headers) {
    if (!header || !header.text || !header.id) {
      continue;
    }
    
    // Clean HTML content to remove anchor tags but preserve emojis and text
    let headerContent;
    if (header.html) {
      // Create a temporary element to parse and clean the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = header.html;
      
      // Remove all anchor tags but keep their content
      const anchors = tempDiv.querySelectorAll('a');
      anchors.forEach(anchor => {
        // Only remove anchor tags, not their content (except for empty name anchors)
        if (anchor.getAttribute('name') && anchor.textContent.trim() === '') {
          // Remove empty anchor name tags completely
          anchor.remove();
        } else if (anchor.href && !anchor.getAttribute('name')) {
          // For href anchors, keep only the text content
          const textNode = document.createTextNode(anchor.textContent);
          anchor.parentNode.replaceChild(textNode, anchor);
        }
      });
      
      headerContent = tempDiv.innerHTML.trim();
      console.log('TOC: Cleaned header content:', headerContent);
    } else {
      headerContent = header.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    
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
        tocHtml += '<li class="discourse-toc__item"><ul class="discourse-toc__list">';
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
    
    // Create the link with proper content wrapping
    tocHtml += `<li class="discourse-toc__item"><a href="${postUrl}" class="discourse-toc__link" data-post-number="${header.post_number}" data-header-id="${header.id}"><span class="discourse-toc__content">${headerContent}</span>${postIndicator}</a>`;
  }
  
  // Close remaining open items and lists
  tocHtml += '</li>';
  for (let i = currentLevel; i > 1; i--) {
    tocHtml += '</ul></li>';
  }
  
  tocHtml += '</ul></div>';
  
  return tocHtml;
}


function initializeToc(api, siteSettings) {
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
      
      if (!tocMarker) {
        console.log('TOC: No [toc] marker found');
        return;
      }
      
      // Always render TOC when [toc] marker is present, even with 0 headers
      if (!post.topic_headers) {
        post.topic_headers = [];
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
        const links = toc.querySelectorAll('.discourse-toc__link');
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
        const title = toc.querySelector('.discourse-toc__title');
        if (title) {
          title.addEventListener('click', function() {
            const list = toc.querySelector('.discourse-toc__list');
            if (list) {
              if (toc.classList.contains('discourse-toc--collapsed')) {
                toc.classList.remove('discourse-toc--collapsed');
              } else {
                toc.classList.add('discourse-toc--collapsed');
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
          const links = toc.querySelectorAll('.discourse-toc__link');
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
    console.log('TOC: Initializer running, settings:', {
      enabled: siteSettings.discourse_toc_enabled,
      maxHeaderLevel: siteSettings.discourse_toc_max_header_level,
      strictH1Only: siteSettings.discourse_toc_strict_h1_only
    });
    if (siteSettings.discourse_toc_enabled) {
      withPluginApi("0.8.31", (api) => initializeToc(api, siteSettings));
    } else {
      console.log('TOC: Plugin disabled via site setting');
    }
  },
};