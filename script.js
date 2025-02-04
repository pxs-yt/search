document.addEventListener("DOMContentLoaded", () => {
  fetchTotalUrls();
  // Attach dark mode toggle event listener
  const darkModeToggle = document.getElementById("darkModeToggle");
  if (darkModeToggle) {
    darkModeToggle.addEventListener("change", toggleDarkMode);
  }
  // Attach event listener to history button
  const historyButton = document.getElementById("historyButton");
  if (historyButton) {
    historyButton.addEventListener("click", toggleHistoryModal);
  }
  // Attach event listener to Download History button
  const downloadHistoryButton = document.getElementById("downloadHistory");
  if (downloadHistoryButton) {
    downloadHistoryButton.addEventListener("click", downloadHistory);
  }
  // Close history modal when clicking outside the content
  const historyModal = document.getElementById("historyModal");
  if (historyModal) {
    historyModal.addEventListener("click", (e) => {
      if (e.target === historyModal) {
        toggleHistoryModal();
      }
    });
  }
});

const resultsPerPage = 25;
let searchResults = [];
let currentPage = 1;

/* ========= Cookie Functions for Search History ========= */
function setCookie(name, value, days) {
  let expires = "";
  if (days) {
    const d = new Date();
    d.setTime(d.getTime() + days*24*60*60*1000);
    expires = "; expires=" + d.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}
function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}
function saveSearchHistory(history) {
  setCookie("searchHistory", JSON.stringify(history), 30);
}
function loadSearchHistory() {
  const history = getCookie("searchHistory");
  return history ? JSON.parse(history) : [];
}
function addSearchHistory(query) {
  const history = loadSearchHistory();
  history.push({ query: query, timestamp: new Date().toISOString() });
  saveSearchHistory(history);
}
function addClickHistory(query, url) {
  const history = loadSearchHistory();
  history.push({ query: query, clickedUrl: url, timestamp: new Date().toISOString() });
  saveSearchHistory(history);
}
function displayHistory() {
  const historyModalContent = document.getElementById("historyContent");
  historyModalContent.innerHTML = "<h2>Search History</h2>";
  const history = loadSearchHistory();
  if (history.length === 0) {
    historyModalContent.innerHTML += "<p>No history available.</p>";
    return;
  }
  history.forEach(item => {
    const div = document.createElement("div");
    div.className = "history-item";
    if (item.query && !item.clickedUrl) {
      div.textContent = `Query: "${item.query}" at ${new Date(item.timestamp).toLocaleString()}`;
    } else if (item.clickedUrl) {
      div.textContent = `Clicked: ${item.clickedUrl} (Query: "${item.query}") at ${new Date(item.timestamp).toLocaleString()}`;
    }
    historyModalContent.appendChild(div);
  });
}
function toggleHistoryModal() {
  const historyModal = document.getElementById("historyModal");
  if (historyModal.classList.contains("active")) {
    historyModal.classList.remove("active");
  } else {
    displayHistory();
    historyModal.classList.add("active");
  }
}

/* ========= Download History Function ========= */
function downloadHistory() {
  const history = loadSearchHistory();
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
  const dlAnchorElem = document.createElement("a");
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", "search_history.json");
  dlAnchorElem.style.display = "none";
  document.body.appendChild(dlAnchorElem);
  dlAnchorElem.click();
  document.body.removeChild(dlAnchorElem);
}

/* ========= Fetch Total URLs ========= */
function fetchTotalUrls() {
  fetch("index.json")
    .then(response => response.json())
    .then(data => {
      document.getElementById("totalUrls").textContent = `Total Indexed URLs: ${data.length}`;
    })
    .catch(error => {
      console.error("Error fetching index.json:", error);
      document.getElementById("totalUrls").textContent = "Failed to load index size.";
    });
}

/* ========= Search Functionality ========= */
function handleKeyPress(event) {
  if (event.key === "Enter") {
    performSearch();
  }
}

function toggleDarkMode(event) {
  if (event.target.checked) {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }
}

function performSearch() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  const mimeFilter = document.getElementById("mimeFilter").value;
  const resultsContainer = document.getElementById("results");
  resultsContainer.innerHTML = "";
  
  if (!query) {
    resultsContainer.innerHTML = "<p>Please enter a search query.</p>";
    return;
  }
  
  const startTime = performance.now();
  addSearchHistory(query);
  
  fetch("index.json")
    .then(response => response.json())
    .then(data => {
      // Filter results by query and MIME type
      searchResults = data.filter(item => {
        const matchesQuery = item.title.toLowerCase().includes(query) ||
                             (item.description && item.description.toLowerCase().includes(query));
        if (!matchesQuery) return false;
        if (mimeFilter === "All") return true;
        const mime = item.mime_type.toLowerCase();
        if (mimeFilter === "HTML") return mime.startsWith("text/html");
        if (mimeFilter === "Documents") return mime.includes("pdf") || mime.includes("msword") || mime.includes("vnd.openxmlformats-officedocument");
        if (mimeFilter === "Audio") return mime.startsWith("audio/");
        if (mimeFilter === "Video") return mime.startsWith("video/");
        if (mimeFilter === "Images") return mime.startsWith("image/");
        return true;
      });
      
      const endTime = performance.now();
      const elapsed = ((endTime - startTime) / 1000).toFixed(2);
      
      // Show results info
      let resultsInfo = document.getElementById("resultsInfo");
      if (!resultsInfo) {
        resultsInfo = document.createElement("p");
        resultsInfo.id = "resultsInfo";
        resultsInfo.className = "results-info";
        resultsContainer.parentElement.insertBefore(resultsInfo, resultsContainer);
      }
      resultsInfo.textContent = `Fetched ${searchResults.length} results in ${elapsed} seconds.`;
      
      if (searchResults.length === 0) {
        resultsContainer.innerHTML = "<p>No results found.</p>";
        return;
      }
      
      currentPage = 1;
      displayResults();
    })
    .catch(error => {
      resultsContainer.innerHTML = "<p>Error loading search results.</p>";
      console.error("Error fetching index data:", error);
    });
}

/* ========= Display Results ========= */
function displayResults() {
  const resultsContainer = document.getElementById("results");
  resultsContainer.innerHTML = "";
  
  const start = (currentPage - 1) * resultsPerPage;
  const end = start + resultsPerPage;
  const pageResults = searchResults.slice(start, end);
  
  pageResults.forEach(result => {
    const resultItem = document.createElement("div");
    resultItem.className = "result-item";
    
    let domain = "";
    try {
      const urlObj = new URL(result.url);
      domain = urlObj.hostname;
    } catch (e) {
      domain = "";
    }
    const faviconUrl = domain ? `https://www.google.com/s2/favicons?sz=32&domain=${domain}` : "";
    
    resultItem.innerHTML = `
      <img src="${faviconUrl}" class="favicon" alt="Favicon">
      <div class="result-content">
        <h3><a href="${result.url}" target="_blank">${result.title}</a></h3>
        <p style="font-size:0.8rem;">${result.url}</p>
        <div class="result-meta">
          <div class="meta-mime">MIME Type: ${result.mime_type}</div>
          <div class="meta-others">
            <span>Images: ${result.image_count}</span>
            <span>Links: ${result.link_count}</span>
          </div>
        </div>
      </div>
    `;
    
    // Record click history when the result link is clicked
    const linkElement = resultItem.querySelector("a");
    linkElement.addEventListener("click", () => {
      addClickHistory(document.getElementById("searchInput").value.toLowerCase(), result.url);
    });
    
    resultsContainer.appendChild(resultItem);
    adjustTitleFontSize(resultItem.querySelector(".result-content h3"));
  });
  
  displayPagination();
}

/* ========= Adjust Title Font Size ========= */
function adjustTitleFontSize(titleElement) {
  let fontSize = parseFloat(window.getComputedStyle(titleElement).fontSize);
  while (titleElement.scrollWidth > titleElement.clientWidth && fontSize > 12) {
    fontSize -= 1;
    titleElement.style.fontSize = fontSize + "px";
  }
}

/* ========= Pagination ========= */
/* Structure: [Back] [First] [Current] [Last] [Next] */
function displayPagination() {
  const paginationContainer = document.getElementById("pagination");
  paginationContainer.innerHTML = "";
  
  const totalPages = Math.ceil(searchResults.length / resultsPerPage);
  if (totalPages <= 0) return;
  
  const backBtn = document.createElement("button");
  backBtn.innerHTML = "&larr;";
  backBtn.disabled = (currentPage === 1);
  backBtn.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      displayResults();
    }
  };
  paginationContainer.appendChild(backBtn);
  
  const firstBtn = document.createElement("button");
  firstBtn.textContent = "1";
  firstBtn.disabled = (currentPage === 1);
  firstBtn.onclick = () => {
    currentPage = 1;
    displayResults();
  };
  paginationContainer.appendChild(firstBtn);
  
  const currentBtn = document.createElement("button");
  currentBtn.textContent = currentPage;
  currentBtn.disabled = true;
  paginationContainer.appendChild(currentBtn);
  
  const lastBtn = document.createElement("button");
  lastBtn.textContent = totalPages;
  lastBtn.disabled = (currentPage === totalPages);
  lastBtn.onclick = () => {
    currentPage = totalPages;
    displayResults();
  };
  paginationContainer.appendChild(lastBtn);
  
  const nextBtn = document.createElement("button");
  nextBtn.innerHTML = "&rarr;";
  nextBtn.disabled = (currentPage === totalPages);
  nextBtn.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      displayResults();
    }
  };
  paginationContainer.appendChild(nextBtn);
}
