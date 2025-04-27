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
  - JWT Attacks
  - XXE Attacks
  - SSRF Attacks
  - CSRF Attacks
  - Clickjacking
  - DOM-based Vulnerabilities
  - CORS Attacks
  - OAuth Attacks
- Organized payload categories with collapsible sections
- One-click payload submission to all visible fields

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

### Selecting and Using Payloads

1. **View Payload Categories**:
   - Payloads are organized into collapsible categories
   - Click on a category header to expand/collapse
   - Categories include SQL Injection, XSS, Path Traversal, etc.

2. **Select a Payload**:
   - Click on any payload to select it
   - The selected payload will be highlighted
   - Use the "Copy" button to copy a payload to clipboard

3. **Submit Payload to Fields**:
   - After selecting a payload, the "Submit Selected Payload to All Fields" button will be enabled
   - Click the button to automatically submit the payload to all visible input fields
   - A success message will appear when the payload has been submitted

## Security Note

This extension is intended for security testing purposes only. Use responsibly and only on systems you have permission to test.

## License

MIT License 