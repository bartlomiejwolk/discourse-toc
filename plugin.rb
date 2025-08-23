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
end