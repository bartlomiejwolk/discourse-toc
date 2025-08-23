import { withPluginApi } from "discourse/lib/plugin-api";

function initializeToc(api) {
  api.decorateCookedElement(
    function (element) {
      const toc = element.querySelector('.discourse-toc');
      if (toc) {
        // Add smooth scrolling behavior to TOC links
        const links = toc.querySelectorAll('.discourse-toc-link');
        links.forEach(link => {
          link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
              targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              });
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
              e.preventDefault();
              const targetId = this.getAttribute('href').substring(1);
              const targetElement = document.getElementById(targetId);
              
              if (targetElement) {
                targetElement.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start'
                });
              }
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
    if (siteSettings.discourse_toc_enabled) {
      withPluginApi("0.8.31", initializeToc);
    }
  },
};