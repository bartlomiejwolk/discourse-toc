# GitHub Setup Instructions

1. Go to GitHub and create a new repository named 'discourse-toc'
2. Run these commands to push your code:

```bash
cd ~/ld-plugins/discourse-toc
git remote add origin https://github.com/YOURUSERNAME/discourse-toc.git
git branch -M main
git push -u origin main
```

3. Use the sync script to deploy changes:
```bash
~/ld-plugins/sync-plugin.sh
```

## Development Workflow

1. Edit files in `~/ld-plugins/discourse-toc/`
2. Commit changes: `git add . && git commit -m "Your message"`
3. Push to GitHub: `git push`
4. Sync to Discourse: `~/ld-plugins/sync-plugin.sh`
5. Test in Discourse

