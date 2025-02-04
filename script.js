document.addEventListener("DOMContentLoaded", () => {
  fetchTotalUrls();
  // Attach event listener to the dark mode toggle switch (checkbox)
  const darkModeToggle = document.getElementById("darkModeToggle");
  if (darkModeToggle) {
    darkModeToggle.addEventListener("change", toggleDarkMode);
  }
});

const resultsPerPage = 25;
let searchResults = [];
let currentPage = 1;

// Fetch the total number of URLs from index.json and update the label
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

// Handle key press on the search input: trigger search on Enter key
function handleKeyPress(event) {
  if (event.key === "Enter") {
    performSearch();
  }
}

// Toggle dark mode by adding or removing the "dark-mode" class on the body
function toggleDarkMode(event) {
  if (event.target.checked) {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }
}

// Perform the search by filtering data from index.json and measure time
function performSearch() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  const resultsContainer = document.getElementById("results");
  resultsContainer.innerHTML = "";
  
  if (!query) {
    resultsContainer.innerHTML = "<p>Please enter a search query.</p>";
    return;
  }
  
  const startTime = performance.now();
  
  fetch("index.json")
    .then(response => response.json())
    .then(data => {
      searchResults = data.filter(item =>
        item.title.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query))
      );
      
      const endTime = performance.now();
      const elapsed = ((endTime - startTime) / 1000).toFixed(2);
      
      // Display results info above the results container
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

// Display paginated search results
function displayResults() {
  const resultsContainer = document.getElementById("results");
  resultsContainer.innerHTML = "";
  
  const start = (currentPage - 1) * resultsPerPage;
  const end = start + resultsPerPage;
  const pageResults = searchResults.slice(start, end);
  
  pageResults.forEach(result => {
    const resultItem = document.createElement("div");
    resultItem.className = "result-item";
    
    // Extract the domain for the favicon
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
        <p>${result.url}</p>
        <div class="result-meta">
          <p>MIME Type: ${result.mime_type}</p>
          <p>Images: ${result.image_count}</p>
          <p>Links: ${result.link_count}</p>
        </div>
      </div>
    `;
    
    resultsContainer.appendChild(resultItem);
    adjustTitleFontSize(resultItem.querySelector(".result-content h3"));
  });
  
  displayPagination();
}

// Adjust the title font size if the title overflows its container
function adjustTitleFontSize(titleElement) {
  let fontSize = parseFloat(window.getComputedStyle(titleElement).fontSize);
  while (titleElement.scrollWidth > titleElement.clientWidth && fontSize > 12) {
    fontSize -= 1;
    titleElement.style.fontSize = fontSize + "px";
  }
}

// Display pagination buttons with the following structure:
// [Back] [First] [Current] [Last] [Next]
function displayPagination() {
  const paginationContainer = document.getElementById("pagination");
  paginationContainer.innerHTML = "";
  
  const totalPages = Math.ceil(searchResults.length / resultsPerPage);
  if (totalPages <= 0) return;
  
  // Create Back button with left arrow
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
  
  // Create First page button (page 1)
  const firstBtn = document.createElement("button");
  firstBtn.textContent = "1";
  firstBtn.disabled = (currentPage === 1);
  firstBtn.onclick = () => {
    currentPage = 1;
    displayResults();
  };
  paginationContainer.appendChild(firstBtn);
  
  // Create Current page button (non-clickable)
  const currentBtn = document.createElement("button");
  currentBtn.textContent = currentPage;
  currentBtn.disabled = true;
  paginationContainer.appendChild(currentBtn);
  
  // Create Last page button (totalPages)
  const lastBtn = document.createElement("button");
  lastBtn.textContent = totalPages;
  lastBtn.disabled = (currentPage === totalPages);
  lastBtn.onclick = () => {
    currentPage = totalPages;
    displayResults();
  };
  paginationContainer.appendChild(lastBtn);
  
  // Create Next button with right arrow
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
