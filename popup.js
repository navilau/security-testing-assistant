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
    const allPayloads = new Set();

    results.forEach(result => {
      // Add to fields by type
      if (!fieldsByType[result.fieldType]) {
        fieldsByType[result.fieldType] = [];
      }
      fieldsByType[result.fieldType].push(result);

      // Collect unique payloads
      result.payloads.forEach(payload => allPayloads.add(payload));
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

    // Display all unique payloads
    const payloadsSection = document.createElement('ul');
    payloadsSection.className = 'payload-list';
    
    Array.from(allPayloads).forEach(payload => {
      const payloadItem = document.createElement('li');
      payloadItem.className = 'payload-item';
      payloadItem.setAttribute('data-payload', payload);
      
      payloadItem.innerHTML = `
        <span class="payload-text">${payload}</span>
        <button class="copy-button" data-payload="${payload}">Copy</button>
      `;
      
      payloadsSection.appendChild(payloadItem);
    });
    
    payloadsList.appendChild(payloadsSection);

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