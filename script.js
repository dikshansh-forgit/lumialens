/**
 * LuminaLens — Image Search Engine (Part 3: Complete App & Production Polish)
 * Features dynamic fetching, loading states, empty & error handling, and responsive rendering.
 */

document.addEventListener("DOMContentLoaded", () => {
  // DOM element references
  const searchForm = document.getElementById("search-form");
  const searchInput = document.getElementById("search-input");
  const searchBtn = document.getElementById("search-btn");
  const resultsContainer = document.getElementById("results");
  const clearBtn = document.getElementById("clear-btn");
  const resultCount = document.getElementById("result-count");
  const loadingState = document.getElementById("loading-state");
  const emptyState = document.getElementById("empty-state");
  const emptyTitle = document.getElementById("empty-title");
  const emptySubtitle = document.getElementById("empty-subtitle");
  const errorState = document.getElementById("error-state");
  const categoryChips = document.getElementById("category-chips");

  /**
   * Resets all status containers (loading, empty, error).
   */
  function clearStatusStates() {
    if (loadingState) loadingState.style.display = "none";
    if (emptyState) emptyState.style.display = "none";
    if (errorState) errorState.style.display = "none";
  }

  /**
   * Fetches images from Wikimedia Commons API and handles all states (Loading, Empty, Error, Success).
   * @param {string} query - Keyword query entered by the user.
   */
  async function searchImages(query) {
    // 1. Ignore blank searches
    if (!query || !query.trim()) {
      return;
    }

    const trimmedQuery = query.trim();

    // 2. Loading State: activate spinner, disable button, and clear old results
    clearStatusStates();
    resultsContainer.innerHTML = "";
    if (loadingState) loadingState.style.display = "flex";
    if (searchBtn) searchBtn.disabled = true;
    if (resultCount) resultCount.textContent = `Searching for "${trimmedQuery}"...`;

    // Build API endpoint using encodeURIComponent for multi-word queries
    const endpoint = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrnamespace=6&gsrlimit=20&gsrsearch=${encodeURIComponent(trimmedQuery)}&prop=imageinfo&iiprop=url&iiurlwidth=500`;

    try {
      // 3. Fetch data and check response.ok
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`Service responded with status ${response.status}`);
      }

      // Parse JSON response
      const data = await response.json();
      const pages = data.query && data.query.pages ? Object.values(data.query.pages) : [];

      // 4. Empty State: check if results list is empty
      if (pages.length === 0) {
        if (emptyTitle) emptyTitle.textContent = "No results found";
        if (emptySubtitle) {
          emptySubtitle.textContent = `No results for "${trimmedQuery}". Try another search or explore one of the popular topics above.`;
        }
        if (emptyState) emptyState.style.display = "flex";
        if (resultCount) resultCount.textContent = `Showing 0 results for "${trimmedQuery}"`;
        return;
      }

      // 5. Success State: update result count and render cards
      if (resultCount) {
        resultCount.textContent = `Showing ${pages.length} results for "${trimmedQuery}"`;
      }

      pages.forEach((page) => {
        if (!page.imageinfo || page.imageinfo.length === 0) {
          return;
        }

        const info = page.imageinfo[0];
        const imageUrl = info.thumburl || info.url;
        const fullImageUrl = info.descriptionurl || info.url;

        // Clean up file title: remove "File:" prefix and extension
        let cleanTitle = page.title || "Untitled Image";
        cleanTitle = cleanTitle.replace(/^File:/i, "").replace(/\.[^/.]+$/, "");

        // Build Card element
        const card = document.createElement("article");
        card.className = "image-card";

        // Clickable link to view full image in a new tab
        const link = document.createElement("a");
        link.href = fullImageUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.className = "image-card-link";
        link.setAttribute("aria-label", `View full image: ${cleanTitle}`);

        // Image element
        const img = document.createElement("img");
        img.src = imageUrl;
        img.alt = cleanTitle;
        img.loading = "lazy";

        // Caption & details body
        const cardBody = document.createElement("div");
        cardBody.className = "image-card-body";

        const titleEl = document.createElement("h3");
        titleEl.className = "image-card-title";
        titleEl.textContent = cleanTitle;
        titleEl.title = cleanTitle;

        const sourceEl = document.createElement("p");
        sourceEl.className = "image-card-author";
        sourceEl.textContent = "Wikimedia Commons";

        cardBody.appendChild(titleEl);
        cardBody.appendChild(sourceEl);

        link.appendChild(img);
        link.appendChild(cardBody);
        card.appendChild(link);

        resultsContainer.appendChild(card);
      });
    } catch (err) {
      // 6. Error State: handle network or API failures with a friendly message
      console.error("Search error:", err);
      clearStatusStates();
      if (errorState) errorState.style.display = "flex";
      if (resultCount) resultCount.textContent = "Something went wrong. Please try again.";
    } finally {
      // Always dismiss loading indicator and re-enable search button
      if (loadingState) loadingState.style.display = "none";
      if (searchBtn) searchBtn.disabled = false;
    }
  }

  // Event Listener: Form submit event (prevents page reload)
  if (searchForm) {
    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      searchImages(searchInput.value);
    });
  }

  // Clear button control: resets search input and restores default state
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      searchInput.value = "";
      resultsContainer.innerHTML = "";
      clearStatusStates();
      if (emptyTitle) emptyTitle.textContent = "Search to see results";
      if (emptySubtitle) {
        emptySubtitle.textContent = "Enter a query above or click any suggested category to populate your custom image gallery.";
      }
      if (emptyState) emptyState.style.display = "flex";
      if (resultCount) resultCount.textContent = "Showing 0 results";
      searchInput.focus();
    });
  }

  // Category suggestion chips: click executes a search
  if (categoryChips) {
    categoryChips.addEventListener("click", (event) => {
      const chip = event.target.closest(".chip");
      if (chip) {
        const topic = chip.dataset.topic || chip.textContent;
        searchInput.value = topic;
        searchImages(topic);
      }
    });
  }
});