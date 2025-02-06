document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("searchInput");
    const resultsContainer = document.querySelector(".results-container");
    const mimeFilter = document.getElementById("mimeFilter");
    const historyButton = document.getElementById("historyButton");
    const historyModal = document.querySelector(".history-modal");
    const closeHistory = document.querySelector(".close-history");
    const darkModeToggle = document.getElementById("darkModeToggle");
    
    let searchHistory = [];

    // Dark mode toggle
    darkModeToggle.addEventListener("change", () => {
        document.body.classList.toggle("dark-mode", darkModeToggle.checked);
    });

    // Search function
    searchInput.addEventListener("keyup", () => {
        const query = searchInput.value.trim().toLowerCase();
        const mimeType = mimeFilter.value;

        if (query.length === 0) {
            resultsContainer.innerHTML = "";
            return;
        }

        const filteredResults = mockSearch(query, mimeType);
        displayResults(filteredResults);
        saveToHistory(query);
    });

    // Mock search function
    function mockSearch(query, mimeType) {
        const allResults = [
            { title: "Example PDF", url: "#", mime: "application/pdf" },
            { title: "Example Image", url: "#", mime: "image/png" },
            { title: "Example HTML", url: "#", mime: "text/html" }
        ];

        return allResults.filter(item => 
            item.title.toLowerCase().includes(query) && 
            (mimeType === "all" || item.mime === mimeType)
        );
    }

    // Display search results
    function displayResults(results) {
        resultsContainer.innerHTML = "";
        
        if (results.length === 0) {
            resultsContainer.innerHTML = "<p>No results found.</p>";
            return;
        }

        results.forEach(result => {
            const resultItem = document.createElement("div");
            resultItem.classList.add("result-item");
            resultItem.innerHTML = `
                <h3>${result.title}</h3>
                <a href="${result.url}" target="_blank">${result.url}</a>
                <p class="result-meta">${result.mime}</p>
            `;
            resultsContainer.appendChild(resultItem);
        });
    }

    // Save search history
    function saveToHistory(query) {
        if (!searchHistory.includes(query)) {
            searchHistory.push(query);
        }
    }

    // Open search history modal
    historyButton.addEventListener("click", () => {
        historyModal.classList.add("active");
        displayHistory();
    });

    // Close history modal
    closeHistory.addEventListener("click", () => {
        historyModal.classList.remove("active");
    });

    // Display search history
    function displayHistory() {
        const historyContent = document.querySelector(".history-content");
        historyContent.innerHTML = "<h2>Search History</h2>";
        
        if (searchHistory.length === 0) {
            historyContent.innerHTML += "<p>No history available.</p>";
            return;
        }

        searchHistory.forEach(term => {
            const historyItem = document.createElement("p");
            historyItem.textContent = term;
            historyContent.appendChild(historyItem);
        });
    }
});
