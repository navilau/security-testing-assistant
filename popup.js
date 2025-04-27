document.addEventListener('DOMContentLoaded', function() {
  console.log('Popup loaded');
  const scanButton = document.getElementById('scanButton');
  const fieldsList = document.getElementById('fieldsList');
  const payloadsList = document.getElementById('payloadsList');
  const submitSection = document.getElementById('submitSection');
  const submitButton = document.getElementById('submitButton');
  let selectedPayload = null;

  scanButton.addEventListener('click', async () => {
    console.log('Scan button clicked');
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log('Current tab:', tab);
      
      if (!tab) {
        throw new Error('No active tab found');
      }

      // First inject the content script
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });

      // Then execute the scan function
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          if (typeof window.scanInputFields !== 'function') {
            throw new Error('scanInputFields function not found');
          }
          return window.scanInputFields();
        }
      });

      console.log('Script execution results:', results);
      if (results && results[0] && results[0].result) {
        const scanResults = results[0].result;
        displayResults(scanResults);
        submitSection.style.display = 'block';
      } else {
        fieldsList.innerHTML = '<p>No input fields found</p>';
        payloadsList.innerHTML = '';
        submitSection.style.display = 'none';
      }
    } catch (error) {
      console.error('Error during scan:', error);
      fieldsList.innerHTML = `<p>Error: ${error.message}</p>`;
      payloadsList.innerHTML = '';
      submitSection.style.display = 'none';
    }
  });

  function displayResults(results) {
    console.log('Displaying results:', results);
    fieldsList.innerHTML = '';
    payloadsList.innerHTML = '';
    
    if (results.length === 0) {
      fieldsList.innerHTML = '<p>No input fields found</p>';
      return;
    }

    // Group fields by type
    const fieldsByType = {};
    const payloadsByCategory = {};

    results.forEach(result => {
      // Add to fields by type
      if (!fieldsByType[result.fieldType]) {
        fieldsByType[result.fieldType] = [];
      }
      fieldsByType[result.fieldType].push(result);

      // Organize payloads by category
      result.payloads.forEach(payload => {
        // Skip category comments
        if (payload.startsWith('/*')) {
          return;
        }

        // Determine category based on payload content
        let category = 'Other';
        if (payload.includes('script>')) {
          category = 'XSS';
        } else if (payload.includes('OR 1=1') || 
                  payload.includes('UNION SELECT') || 
                  payload.includes('SLEEP(') || 
                  payload.includes('WAITFOR DELAY') || 
                  payload.includes('pg_sleep') || 
                  payload.includes('DBMS_PIPE.RECEIVE_MESSAGE') || 
                  payload.includes('randomblob') || 
                  payload.includes('--') || 
                  payload.includes('/*') || 
                  payload.includes('*/') ||
                  payload.includes("' OR") ||
                  payload.includes("' AND") ||
                  payload.includes("' UNION") ||
                  payload.includes("' SELECT") ||
                  payload.includes("' INSERT") ||
                  payload.includes("' UPDATE") ||
                  payload.includes("' DELETE") ||
                  payload.includes("' DROP") ||
                  payload.includes("' CREATE") ||
                  payload.includes("' ALTER")) {
          category = 'SQL Injection';
        } else if (payload.includes('file://')) {
          category = 'Path Traversal';
        } else if (payload.includes('localhost')) {
          category = 'SSRF';
        } else if (payload.includes('{')) {
          category = 'JWT';
        } else if (payload.includes('<!DOCTYPE')) {
          category = 'XXE';
        } else if (payload.includes('iframe')) {
          category = 'Clickjacking';
        } else if (payload.includes('form')) {
          category = 'CSRF';
        } else if (payload.includes('javascript:')) {
          category = 'DOM-based';
        } else if (payload.includes('oauth')) {
          category = 'OAuth';
        } else if (payload.includes('origin')) {
          category = 'CORS';
        }

        if (!payloadsByCategory[category]) {
          payloadsByCategory[category] = new Set();
        }
        payloadsByCategory[category].add(payload);
      });

      // Remove any SQL injection payloads from Other category
      if (payloadsByCategory['Other']) {
        const otherPayloads = Array.from(payloadsByCategory['Other']);
        const sqlInjectionPayloads = new Set();
        
        otherPayloads.forEach(payload => {
          if (payload.includes('OR 1=1') || 
              payload.includes('UNION SELECT') || 
              payload.includes('SLEEP(') || 
              payload.includes('WAITFOR DELAY') || 
              payload.includes('pg_sleep') || 
              payload.includes('DBMS_PIPE.RECEIVE_MESSAGE') || 
              payload.includes('randomblob') || 
              payload.includes('--') || 
              payload.includes('/*') || 
              payload.includes('*/') ||
              payload.includes("' OR") ||
              payload.includes("' AND") ||
              payload.includes("' UNION") ||
              payload.includes("' SELECT") ||
              payload.includes("' INSERT") ||
              payload.includes("' UPDATE") ||
              payload.includes("' DELETE") ||
              payload.includes("' DROP") ||
              payload.includes("' CREATE") ||
              payload.includes("' ALTER")) {
            sqlInjectionPayloads.add(payload);
            payloadsByCategory['Other'].delete(payload);
          }
        });

        // Add SQL injection payloads to SQL Injection category
        if (!payloadsByCategory['SQL Injection']) {
          payloadsByCategory['SQL Injection'] = new Set();
        }
        sqlInjectionPayloads.forEach(payload => {
          payloadsByCategory['SQL Injection'].add(payload);
        });

        // Remove Other category if empty
        if (payloadsByCategory['Other'].size === 0) {
          delete payloadsByCategory['Other'];
        }
      }
    });

    // Display fields grouped by type
    Object.entries(fieldsByType).forEach(([type, fields]) => {
      const typeSection = document.createElement('div');
      typeSection.className = 'field-type-section';
      
      typeSection.innerHTML = `
        <div class="field-type">${type.toUpperCase()}</div>
        <ul class="field-list">
          ${fields.map(field => `
            <li class="field-item">
              <div class="field-name">${field.fieldName}</div>
              <div class="field-details">
                ${field.fieldId ? `ID: ${field.fieldId} | ` : ''}
                ${field.placeholder ? `Placeholder: ${field.placeholder} | ` : ''}
                ${field.currentValue ? `Value: ${field.currentValue}` : ''}
              </div>
            </li>
          `).join('')}
        </ul>
      `;
      
      fieldsList.appendChild(typeSection);
    });

    // Display payloads grouped by category
    Object.entries(payloadsByCategory).forEach(([category, payloads]) => {
      const categorySection = document.createElement('div');
      categorySection.className = 'payload-category';
      
      const categoryHeader = document.createElement('div');
      categoryHeader.className = 'category-header';
      categoryHeader.innerHTML = `
        <span>${category}</span>
        <span class="category-icon">▶</span>
      `;
      
      const categoryContent = document.createElement('div');
      categoryContent.className = 'category-content';
      
      const payloadsList = document.createElement('ul');
      payloadsList.className = 'payload-list';
      
      Array.from(payloads).forEach(payload => {
        const payloadItem = document.createElement('li');
        payloadItem.className = 'payload-item';
        payloadItem.setAttribute('data-payload', payload);
        
        // Create a text node for the payload to prevent HTML interpretation
        const payloadText = document.createElement('span');
        payloadText.className = 'payload-text';
        payloadText.textContent = payload;
        
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.setAttribute('data-payload', payload);
        copyButton.textContent = 'Copy';
        
        payloadItem.appendChild(payloadText);
        payloadItem.appendChild(copyButton);
        payloadsList.appendChild(payloadItem);
      });
      
      categoryContent.appendChild(payloadsList);
      categorySection.appendChild(categoryHeader);
      categorySection.appendChild(categoryContent);
      
      // Add click handler for category header
      categoryHeader.addEventListener('click', () => {
        const isExpanded = categoryContent.classList.contains('expanded');
        categoryContent.classList.toggle('expanded');
        categoryHeader.querySelector('.category-icon').classList.toggle('expanded');
      });
      
      document.getElementById('payloadsList').appendChild(categorySection);
    });

    // Add click handlers for payload items
    document.querySelectorAll('.payload-item').forEach(item => {
      item.addEventListener('click', (e) => {
        document.querySelectorAll('.payload-item').forEach(i => {
          i.classList.remove('selected');
        });
        item.classList.add('selected');
        selectedPayload = item.getAttribute('data-payload');
        submitButton.disabled = false;
      });
    });

    // Add click handlers for copy buttons
    document.querySelectorAll('.copy-button').forEach(button => {
      button.addEventListener('click', async (e) => {
        e.stopPropagation();
        const payload = e.target.getAttribute('data-payload');
        try {
          await navigator.clipboard.writeText(payload);
          e.target.textContent = 'Copied!';
          e.target.classList.add('copied');
          setTimeout(() => {
            e.target.textContent = 'Copy';
            e.target.classList.remove('copied');
          }, 2000);
        } catch (err) {
          console.error('Failed to copy text: ', err);
        }
      });
    });
  }

  // Handle submit button click
  submitButton.addEventListener('click', async () => {
    if (!selectedPayload) return;

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
        throw new Error('No active tab found');
      }

      // Execute the submit function in the content script
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (payload) => {
          // Find all visible input fields
          const visibleFields = Array.from(document.querySelectorAll('input, textarea, select')).filter(field => {
            const style = window.getComputedStyle(field);
            return style.display !== 'none' && 
                   style.visibility !== 'hidden' && 
                   !field.disabled &&
                   !field.readOnly;
          });

          // Submit the payload to each field
          visibleFields.forEach(field => {
            field.value = payload;
            // Trigger input event to ensure any listeners are notified
            field.dispatchEvent(new Event('input', { bubbles: true }));
          });

          return visibleFields.length;
        },
        args: [selectedPayload]
      });

      // Show success message
      const successMsg = document.createElement('div');
      successMsg.className = 'success-message';
      successMsg.textContent = `Payload submitted to all visible fields`;
      payloadsList.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 3000);

    } catch (error) {
      console.error('Error submitting payload:', error);
      const errorMsg = document.createElement('div');
      errorMsg.className = 'error-message';
      errorMsg.textContent = `Error submitting payload: ${error.message}`;
      payloadsList.appendChild(errorMsg);
    }
  });
}); 