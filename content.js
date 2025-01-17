console.log('Trek Selector Extension loaded');
// First check if we need to redirect
// if (window.location.pathname === '/' || !window.location.pathname.includes('/lang/')) {
//   console.log('Redirecting to Kannada version...');
//   window.location.href = 'https://aranyavihaara.karnataka.gov.in/lang/kn';
// } else {
  console.log('Already on language-specific page, proceeding with trek discovery...');
  let trekData = null;

  // Function to get all treks and districts
  async function getAllTreksAndDistricts() {
    try {
      console.log('Starting trek discovery process...');
      const districtSelect = document.getElementById('district');
      const trekSelect = document.getElementById('trek');
      
      if (!districtSelect || !trekSelect) {
        console.log('Select elements not found on page');
        return null;
      }

      const allDistricts = Array.from(districtSelect.options);
      console.log(`Found ${allDistricts.length} districts`);
      
      // Store original selections
      const originalDistrict = districtSelect.value;
      const originalTrek = trekSelect.value;
      console.log('Stored original selections:', { originalDistrict, originalTrek });
      
      const allTreks = [];
      
      for (const district of allDistricts) {
        if (!district.value) {
          console.log('Skipping empty district value');
          continue;
        }
        
        console.log(`Processing district: ${district.text} (${district.value})`);
        
        try {
          // Select the district and wait for trek options to update
          districtSelect.value = district.value;
          districtSelect.dispatchEvent(new Event('change'));
          
          // Wait for potential AJAX calls and DOM updates
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          console.log(`Trek options count for ${district.text}:`, trekSelect.options.length);
          
          // Get treks for this district
          const treks = Array.from(trekSelect.options)
            .filter(option => option.value)
            .map(option => ({
              trek: option.text,
              district: district.text,
              trekValue: option.value,
              districtValue: district.value
            }));
          
          console.log(`Found ${treks.length} treks for district ${district.text}`);
          allTreks.push(...treks);
          
        } catch (err) {
          console.error(`Error processing district ${district.text}:`, err);
        }
      }
      
      // Restore original selections
      try {
        console.log('Restoring original selections...');
        districtSelect.value = originalDistrict;
        districtSelect.dispatchEvent(new Event('change'));
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        trekSelect.value = originalTrek;
        trekSelect.dispatchEvent(new Event('change'));
      } catch (err) {
        console.error('Error restoring original selections:', err);
      }
      
      console.log(`Total treks found: ${allTreks.length}`);
      return allTreks;
      
    } catch (err) {
      console.error('Fatal error in trek discovery:', err);
      return null;
    }
  }

  // Function to save treks to storage
  async function saveTreksToStorage(treks) {
    const storageData = {
      [window.location.origin]: {
        treks: treks,
        timestamp: Date.now()
      }
    };
    await chrome.storage.local.set(storageData);
    console.log('Saved treks to storage for:', window.location.origin);
  }

  // Function to get treks from storage
  async function getTreksFromStorage() {
    const data = await chrome.storage.local.get(window.location.origin);
    return data[window.location.origin];
  }

  // Function to check if we need to refresh trek data
  function shouldRefreshTreks(storedData) {
    if (!storedData) return true;
    const ONE_DAY = 24 * 60 * 60 * 1000;
    return Date.now() - storedData.timestamp > ONE_DAY;
  }

  // Function to create and show the trek panel
  function showTrekPanel(treks) {
    let panel = document.getElementById('trek-panel');
    if (panel) panel.remove();
    
    panel = document.createElement('div');
    panel.id = 'trek-panel';
    panel.className = 'trek-panel';
    
    panel.innerHTML = `
      <div class="trek-panel-header">
        <span>All Available Treks</span>
        <button class="minimize-button">─</button>
      </div>
      <div class="trek-panel-content">
        <input type="text" class="trek-panel-search" placeholder="Search treks...">
        <div id="trek-list"></div>
      </div>
    `;
    
    document.body.appendChild(panel);
    
    // Add minimize functionality
    const minimizeButton = panel.querySelector('.minimize-button');
    minimizeButton.addEventListener('click', () => {
      panel.classList.toggle('minimized');
      minimizeButton.textContent = panel.classList.contains('minimized') ? '□' : '─';
    });
    
    // Add search functionality
    const searchInput = panel.querySelector('.trek-panel-search');
    const trekList = panel.querySelector('#trek-list');
    
    function updateTrekList(searchTerm = '') {
      const filteredTreks = treks.filter(trek => 
        trek.trek.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trek.district.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      trekList.innerHTML = filteredTreks.map(trek => `
        <div class="trek-item" data-trek-value="${trek.trekValue}" data-district-value="${trek.districtValue}">
          <div>${trek.trek}</div>
          <div class="trek-district">District: ${trek.district}</div>
        </div>
      `).join('');
    }
    
    searchInput.addEventListener('input', (e) => updateTrekList(e.target.value));
    
    // Add click handlers for trek selection
    trekList.addEventListener('click', async (e) => {
      const trekItem = e.target.closest('.trek-item');
      if (!trekItem) return;
      
      const districtSelect = document.getElementById('district');
      const trekSelect = document.getElementById('trek');
      
      const districtValue = trekItem.dataset.districtValue;
      const trekValue = trekItem.dataset.trekValue;
      
      districtSelect.value = districtValue;
      districtSelect.dispatchEvent(new Event('change'));
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      trekSelect.value = trekValue;
      trekSelect.dispatchEvent(new Event('change'));
    });
    
    // Initial display
    updateTrekList();
  }

  // Initialize everything when the page loads
  async function initialize(clearCache = false) {
    // Try to get cached trek data
    const storedData = await getTreksFromStorage();
    
    if (storedData && !shouldRefreshTreks(storedData) && !clearCache) {
      console.log('Using cached trek data');
      trekData = storedData.treks;
    } else {
      console.log('Fetching fresh trek data');
      trekData = await getAllTreksAndDistricts();
      if (trekData) {
        await saveTreksToStorage(trekData);
      }
    }
    
    if (trekData) {
      showTrekPanel(trekData);
    }
  }

  // Wait for the page to be fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
// }