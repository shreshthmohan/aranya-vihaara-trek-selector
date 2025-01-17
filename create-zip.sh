#!/bin/bash

# Remove existing zip file if it exists
rm -f aranya-vihaara-trek-selector.zip

# Exclude development and version control files
zip -r aranya-vihaara-trek-selector.zip . \
    -x "*.git*" \
    -x "*.DS_Store" \
    -x "node_modules/*" \
    -x "*.zip" \
    -x "README.md" \
    -x "package-lock.json" \
    -x "package.json" \
    -x ".eslintrc*" \
    -x ".prettier*" \
    -x "tests/*" \
    -x "docs/*" \
    -x ".vscode/*" \
    -x "*.map" \
    -x "*.log"

echo "Created aranya-vihaara-trek-selector.zip"