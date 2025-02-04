document.addEventListener("DOMContentLoaded", () => {
  fetchTotalUrls();
});

const resultsPerPage = 25;
let searchResults = [];
let currentPage = 1;

// Fetch total URLs in index.json and update the label
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

// Perform the search by filtering the data from index.json
function performSearch() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  const resultsContainer = document.getElementById("results");
  resultsContainer.innerHTML = "";
  
  if (!query) {
    resultsContainer.innerHTML = "<p>Please enter a search query.</p>";
    return;
  }

  fetch("index.json")
    .then(response => response.json())
    .then(data => {
      searchResults = data.filter(item =>
        item.title.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query))
      );

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

    // Extract domain for favicon using the URL API
    let domain = "";
    try {
      const urlObj = new URL(result.url);
      domain = urlObj.hostname;
    } catch (e) {
      domain = "";
    }
    const faviconUrl = domain ? `https://www.google.com/s2/favicons?sz=32&domain=${domain}` : '';

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
  });

  displayPagination();
}

// Display pagination buttons
function displayPagination() {
  const paginationContainer = document.getElementById("pagination");
  paginationContainer.innerHTML = "";

  const totalPages = Math.ceil(searchResults.length / resultsPerPage);

  if (totalPages > 1) {
    for (let i = 1; i <= totalPages; i++) {
      const button = document.createElement("button");
      button.textContent = i;
      button.disabled = i === currentPage;
      button.onclick = () => {
        currentPage = i;
        displayResults();
      };
      paginationContainer.appendChild(button);
    }
  }
}
