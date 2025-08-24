# frozen_string_literal: true

# name: discourse-toc
# about: Table of Contents plugin for Discourse posts
# version: 0.1.0
# authors: Bartlomiej Wolk
# url: https://github.com/bartlomiejwolk/discourse-toc

enabled_site_setting :discourse_toc_enabled

register_asset "stylesheets/discourse-toc.scss"

after_initialize do
  # Add site setting for enabling/disabling the plugin
  if respond_to?(:add_to_serializer)
    add_to_serializer(:site, :discourse_toc_enabled) do
      SiteSetting.discourse_toc_enabled
    end
  end

  # Helper module for extracting headers from posts
  module ::DiscourseTocHelper
    def self.extract_headers_from_post(post)
      return [] unless post&.cooked.present?
      
      headers = []
      doc = Nokogiri::HTML::DocumentFragment.parse(post.cooked)
      
      doc.css('h1, h2, h3, h4, h5, h6').each do |header|
        level = header.name[1].to_i
        text = header.inner_text.strip
        next if text.empty?
        
        headers << {
          level: level,
          text: text,
          post_number: post.post_number
        }
      end
      
      headers
    end

    def self.extract_headers_from_topic(topic)
      return [] unless topic&.posts&.any?
      
      all_headers = []
      existing_ids = Set.new
      
      topic.posts.order(:post_number).each do |post|
        post_headers = extract_headers_from_post(post)
        
        post_headers.each do |header|
          # Generate unique ID for cross-post navigation
          header[:id] = generate_unique_id(header[:text], existing_ids)
          all_headers << header
        end
      end
      
      all_headers
    end

    def self.generate_unique_id(text, existing_ids)
      id = text
        .downcase
        .gsub(/[^\w\s-]/, '')
        .gsub(/\s+/, '-')
        .gsub(/^-+|-+$/, '')
      
      counter = 1
      original_id = id
      while existing_ids.include?(id)
        id = "#{original_id}-#{counter}"
        counter += 1
      end
      existing_ids.add(id)
      
      id
    end
  end

  # Add topic headers to post serializer for first post only
  add_to_serializer(:post, :topic_headers, false) do
    if SiteSetting.discourse_toc_enabled && object.post_number == 1 && object.topic.present?
      DiscourseTocHelper.extract_headers_from_topic(object.topic)
    else
      []
    end
  end
end