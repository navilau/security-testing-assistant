# Security Testing Assistant Chrome Extension

A Chrome extension that automatically detects input fields on web pages and generates contextually relevant security test payloads.

## Features

- Automatically detects input fields and textareas on web pages
- Generates security test payloads based on field type and context
- Supports multiple types of security tests:
  - SQL Injection
  - Cross-site Scripting (XSS)
  - Path Traversal
  - Buffer Overflow
  - Timing-based attacks

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory

## Usage

1. Click the extension icon in your Chrome toolbar
2. Click the "Scan Input Fields" button
3. The extension will analyze the current page and display:
   - Detected input fields
   - Field types
   - Suggested security test payloads

## Security Note

This extension is intended for security testing purposes only. Use responsibly and only on systems you have permission to test.

## License

MIT License 