# Known Bugs in discourse-toc

## 1. Front-end JavaScript is never loaded
`plugin.rb` only registers the stylesheet asset, so neither the Markdown extension nor the Ember initializer is compiled into the client bundle. Without registering `assets/javascripts/lib/discourse-markdown/discourse-toc.js` and `assets/javascripts/discourse/initializers/discourse-toc.js`, no TOC logic ever runs. 【F:plugin.rb†L9-L13】

## 2. `Set` is used without requiring the standard library
`Set.new` is referenced when aggregating topic headers, but the file never calls `require "set"`. In production, this raises `NameError: uninitialized constant Set` before any headers can be extracted. 【F:plugin.rb†L49-L65】

## 3. Header extraction is limited to `<h1>` elements
`extract_headers_from_post` explicitly queries only `h1` tags. The README promises support for h1–h6 and the TOC nesting logic expects multiple levels, so posts with `##` or deeper headers are silently ignored. 【F:plugin.rb†L27-L43】【F:README.md†L8-L19】

## 4. Only the first post receives `topic_headers`
The serializer supplies `topic_headers` exclusively for `post_number == 1`, yet the initializer tries to read `post.topic_headers` for every cooked post when assigning IDs. That means headers in posts 2+ never receive IDs, so TOC links to other posts can’t scroll to their targets. 【F:plugin.rb†L87-L94】【F:assets/javascripts/discourse/initializers/discourse-toc.js†L105-L129】

## 5. Duplicate headers in a single post can’t be disambiguated
When trying to match rendered headers to `topic_headers`, the code searches by `text`, `level`, and `post_number` only. If a post contains the same heading text at the same level twice, `Array#find` always returns the first match and the second header never gets an ID. 【F:assets/javascripts/discourse/initializers/discourse-toc.js†L114-L129】

## 6. The Markdown processor is disabled
The Markdown extension defines `processToc` but the exported `setup` function simply returns, so `[toc]` markers are never replaced server-side and header IDs are never injected during cooking. 【F:assets/javascripts/lib/discourse-markdown/discourse-toc.js†L117-L170】

## 7. Client TOC renders even when there are fewer than two headers
README instructions say `[toc]` should only render when there are 2+ headers, but the initializer unconditionally renders the TOC whenever the marker exists, even after forcing `post.topic_headers = []`. Users see an empty TOC container instead of the marker disappearing. 【F:README.md†L11-L19】【F:README.md†L177-L184】【F:assets/javascripts/discourse/initializers/discourse-toc.js†L145-L185】
