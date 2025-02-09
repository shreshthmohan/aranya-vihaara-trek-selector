// popup.js
document.addEventListener("DOMContentLoaded", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Handle rescan button
  document.getElementById("rescanBtn").addEventListener("click", async () => {
    const button = document.getElementById("rescanBtn");
    button.textContent = "Scanning...";
    button.disabled = true;

    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => initialize(true),
      });

      const status = document.getElementById("status");
      status.textContent = "Trek data updated!";
      status.className = "success";
      status.style.display = "block";
      setTimeout(() => (status.style.display = "none"), 3000);
    } catch (error) {
      const status = document.getElementById("status");
      status.textContent = "Scan failed";
      status.className = "error";
      status.style.display = "block";
    }

    button.textContent = "Rescan Treks";
    button.disabled = false;
  });

  // Handle toggle panel button
  const toggleBtn = document.getElementById("togglePanel");
  toggleBtn.addEventListener("click", async () => {
    const panel = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const panel = document.getElementById("trek-panel");
        if (panel) {
          const isHidden = panel.style.display === "none";
          panel.style.display = isHidden ? "block" : "none";
          return !isHidden;
        }
        return false;
      },
    });

    const isHidden = panel[0].result;
    toggleBtn.textContent = isHidden ? "Show Trek Panel" : "Hide Trek Panel";
  });

  // Handle CSV download
  document.getElementById("downloadCSV").addEventListener("click", async () => {
    try {
      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          if (!trekData) return null;

          // Convert trek data to CSV format
          const headers = ["Trek", "District", "Trek Value", "District Value"];
          const csvRows = [headers];

          trekData.forEach((trek) => {
            csvRows.push([
              trek.trek,
              trek.district,
              trek.trekValue,
              trek.districtValue,
            ]);
          });

          const csvContent = csvRows
            .map((row) => row.map((cell) => `"${cell}"`).join(","))
            .join("\n");

          return csvContent;
        },
      });

      if (result[0].result) {
        const blob = new Blob([result[0].result], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "aranya_vihaara_treks.csv";
        a.click();
        URL.revokeObjectURL(url);

        const status = document.getElementById("status");
        status.textContent = "CSV downloaded successfully!";
        status.className = "success";
        status.style.display = "block";
        setTimeout(() => (status.style.display = "none"), 3000);
      }
    } catch (error) {
      const status = document.getElementById("status");
      status.textContent = "Download failed";
      status.className = "error";
      status.style.display = "block";
    }
  });

  // Handle JSON download
  document
    .getElementById("downloadJSON")
    .addEventListener("click", async () => {
      try {
        const result = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            if (!trekData) return null;
            return JSON.stringify(trekData, null, 2);
          },
        });

        if (result[0].result) {
          const blob = new Blob([result[0].result], {
            type: "application/json",
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "aranya_vihaara_treks.json";
          a.click();
          URL.revokeObjectURL(url);

          const status = document.getElementById("status");
          status.textContent = "JSON downloaded successfully!";
          status.className = "success";
          status.style.display = "block";
          setTimeout(() => (status.style.display = "none"), 3000);
        }
      } catch (error) {
        const status = document.getElementById("status");
        status.textContent = "Download failed";
        status.className = "error";
        status.style.display = "block";
      }
    });

  // Handle TXT download with clean numbered list
  document.getElementById("downloadTXT").addEventListener("click", async () => {
    try {
      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          if (!trekData) return null;

          // Create a clean numbered list
          return trekData
            .map((trek) => {
              // Remove redundant words and clean up the trek name
              let cleanName = trek.trek
                .replace(/\s+trek$/i, "")
                .replace(/\s+trekking$/i, "")
                .replace(/^trek\s+/i, "")
                .replace(/^trekking\s+/i, "")
                .trim();

              // Add district in parentheses
              return `${cleanName} (${trek.district})`;
            })
            .map((trek, index) => `${index + 1}. ${trek}`)
            .join("\n");
        },
      });

      if (result[0].result) {
        const blob = new Blob([result[0].result], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "aranya_vihaara_trek_list.txt";
        a.click();
        URL.revokeObjectURL(url);

        const status = document.getElementById("status");
        status.textContent = "Clean list downloaded successfully!";
        status.className = "success";
        status.style.display = "block";
        setTimeout(() => (status.style.display = "none"), 3000);
      }
    } catch (error) {
      const status = document.getElementById("status");
      status.textContent = "Download failed";
      status.className = "error";
      status.style.display = "block";
    }
  });
});
