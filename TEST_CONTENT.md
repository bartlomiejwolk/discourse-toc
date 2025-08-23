# Test Content for TOC Plugin

This document contains test content for the discourse-toc plugin.

## How to Test

1. Create a new topic in your Discourse forum
2. Copy one of the test examples below
3. The TOC should appear when you include `[toc]` marker

## Test Example 1: Basic TOC

Copy this content into a Discourse post:

```
[toc]

# Introduction

This is a test post with a table of contents.

## Getting Started

This section explains how to get started.

### Prerequisites

You need these items first.

### Installation Steps

Follow these steps carefully.

## Configuration

This section covers configuration.

### Basic Settings

Start with basic settings.

### Advanced Options  

Move to advanced configuration.

## Conclusion

That's how you use the TOC feature.
```

## Test Example 2: No TOC (less than 2 headers)

This should NOT generate a TOC:

```
[toc]

# Single Header

This content has only one header, so no TOC should be generated.

Some content here.
```

## Test Example 3: No TOC marker

This content has headers but no [toc] marker, so no TOC should be generated:

```
# Header 1

Content here.

## Header 2

More content.

### Header 3

Even more content.
```

## Expected Behavior

1. **With `[toc]` marker and 2+ headers**: TOC should appear with:
   - Clickable links to headers
   - Proper nesting (h1 > h2 > h3)  
   - Smooth scrolling when clicked
   - Collapse/expand functionality on title click

2. **Without `[toc]` marker**: No TOC should appear even with multiple headers

3. **With `[toc]` but <2 headers**: No TOC should appear

4. **Styling**: TOC should match Discourse theme with proper responsive design