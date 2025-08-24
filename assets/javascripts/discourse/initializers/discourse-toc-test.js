// Simple test initializer to verify the plugin system is working
export default {
  name: "discourse-toc-test",
  initialize() {
    console.log("TOC TEST: Plugin initializer is working!");
    
    // Also try to log after a delay to see if it appears
    setTimeout(() => {
      console.log("TOC TEST: Delayed message - initializer definitely ran");
    }, 2000);
  }
};