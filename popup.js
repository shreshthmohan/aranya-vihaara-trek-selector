// popup.js
document.addEventListener('DOMContentLoaded', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Handle rescan button
    document.getElementById('rescanBtn').addEventListener('click', async () => {
      const button = document.getElementById('rescanBtn');
      button.textContent = 'Scanning...';
      button.disabled = true;
      
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => initialize()
        });
        
        const status = document.getElementById('status');
        status.textContent = 'Trek data updated!';
        status.className = 'success';
        status.style.display = 'block';
        setTimeout(() => status.style.display = 'none', 3000);
      } catch (error) {
        const status = document.getElementById('status');
        status.textContent = 'Scan failed';
        status.className = 'error';
        status.style.display = 'block';
      }
      
      button.textContent = 'Rescan Treks';
      button.disabled = false;
    });
    
    // Handle toggle panel button
    const toggleBtn = document.getElementById('togglePanel');
    toggleBtn.addEventListener('click', async () => {
      const panel = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const panel = document.getElementById('trek-panel');
          if (panel) {
            const isHidden = panel.style.display === 'none';
            panel.style.display = isHidden ? 'block' : 'none';
            return !isHidden;
          }
          return false;
        }
      });
      
      const isHidden = panel[0].result;
      toggleBtn.textContent = isHidden ? 'Show Trek Panel' : 'Hide Trek Panel';
    });
  });