# frozen_string_literal: true

require "rake"

# Default task mirrors the plugin asset check to give immediate feedback
# when running `rake` without arguments.
task default: "assets:precompile"

namespace :assets do
  desc "Verify plugin assets needed by Discourse are present"
  task :precompile do
    required_files = [
      File.join("assets", "stylesheets", "discourse-toc.scss"),
      File.join("assets", "javascripts", "lib", "discourse-markdown", "discourse-toc.js"),
      File.join("assets", "javascripts", "discourse", "initializers", "discourse-toc.js"),
    ]

    missing = required_files.reject { |path| File.exist?(path) }

    if missing.empty?
      puts "All required assets are present."
    else
      abort "Missing assets: #{missing.join(', ')}"
    end
  end
end
