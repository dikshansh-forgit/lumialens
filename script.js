/*
 * LuminaLens
 *
 * LuminaLens is a fast, responsive image-discovery web application designed
 * to help users explore curated, high-resolution photography from across the
 * globe through intuitive keyword queries. It will later connect to an image
 * API to dynamically populate an adaptive visual gallery.
 *
 * The interface uses an oceanic deep-slate background accented by electric
 * cyan and teal, a sticky glassmorphic header, curated topic chips, and an
 * instructive empty-state card.
 */
/**
 * LuminaLens — Image Search Engine (Part 2: Fetch & Render)
 * Interacts with the Wikimedia Commons API to fetch and render image cards dynamically.
 */

document.addEventListener("DOMContentLoaded", () => {
  // DOM element references from Part 1
  const searchForm = document.getElementById("search-form");
  const searchInput = document.getElementById("search-input");
  const resultsContainer = document.getElementById("results");
  const clearBtn = document.getElementById("clear-btn");
  const resultCount = document.getElementById("result-count");
  const emptyState = document.getElementById("empty-state");
  const categoryChips = document.getElementById("category-chips");

  /**
   * Fetches images from Wikimedia Commons and populates the grid.
   * @param {string} query - Keyword query entered by the user.
   */
  async function searchImages(query) {
    // 1. Ignore blank or whitespace-only searches
    if (!query || !query.trim()) {
      return;
    }

    const trimmedQuery = query.trim();

    // 2. Build API URL with encodeURIComponent to safely handle spaces and punctuation
    const endpoint = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrnamespace=6&gsrlimit=20&gsrsearch=${encodeURIComponent(trimmedQuery)}&prop=imageinfo&iiprop=url&iiurlwidth=500`;

    try {
      // 3. Await fetch and check response.ok
      const response = await fetch(endpoint);
      if (!response.ok) {
        return;
      }

      // Parse JSON payload
      const data = await response.json();

      // 4. Clear existing results before appending new cards
      resultsContainer.innerHTML = "";

      const pages = data.query && data.query.pages ? Object.values(data.query.pages) : [];

      // Handle 0 results found
      if (pages.length === 0) {
        if (emptyState) emptyState.style.display = "flex";
        if (resultCount) resultCount.textContent = `Showing 0 results for "${trimmedQuery}"`;
        return;
      }

      // Hide empty-state graphic once results are available
      if (emptyState) {
        emptyState.style.display = "none";
      }

      // Enhancement 1: Update the result count indicator
      if (resultCount) {
        resultCount.textContent = `Showing ${pages.length} results for "${trimmedQuery}"`;
      }

      // 5. Build and append one card per result
      pages.forEach((page) => {
        if (!page.imageinfo || page.imageinfo.length === 0) {
          return;
        }

        const info = page.imageinfo[0];
        const imageUrl = info.thumburl || info.url;
        const fullImageUrl = info.descriptionurl || info.url;

        // Clean file name: remove "File:" prefix and file extension
        let cleanTitle = page.title || "Untitled Image";
        cleanTitle = cleanTitle.replace(/^File:/i, "").replace(/\.[^/.]+$/, "");

        // Create card element
        const card = document.createElement("article");
        card.className = "image-card";

        // Enhancement 2: Make card clickable to open full image in a new tab
        const link = document.createElement("a");
        link.href = fullImageUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.className = "image-card-link";
        link.setAttribute("aria-label", `View full image: ${cleanTitle}`);

        // Create <img> element
        const img = document.createElement("img");
        img.src = imageUrl;
        img.alt = cleanTitle;
        img.loading = "lazy";

        // Create caption body
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

        // Append card into the CSS grid results container
        resultsContainer.appendChild(card);
      });
    } catch (err) {
      console.error("Search failed:", err);
    }
  }

  // Event listener on form submit: prevents reload and passes input value
  if (searchForm) {
    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      searchImages(searchInput.value);
    });
  }

  // Clear button control: resets input and focuses
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      searchInput.value = "";
      searchInput.focus();
    });
  }

  // Enhancement 3: Category chips run a search when clicked
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