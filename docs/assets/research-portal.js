(() => {
  const writeClipboard = async (text) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  };

  const closeShareMenu = (control) => {
    const button = control.querySelector("[data-share-button]");
    const menu = control.querySelector("[data-share-menu]");
    if (!button || !menu) return;
    button.setAttribute("aria-expanded", "false");
    menu.hidden = true;
  };

  const shareControls = [...document.querySelectorAll("[data-share]")];

  shareControls.forEach((control) => {
    const button = control.querySelector("[data-share-button]");
    const menu = control.querySelector("[data-share-menu]");
    const copyButton = control.querySelector("[data-copy-link]");
    const nativeButton = control.querySelector("[data-native-share]");
    const feedback = control.querySelector("[data-share-feedback]");
    const title = control.dataset.shareTitle || document.title;
    const text = control.dataset.shareText || "";
    const url = control.dataset.shareUrl || window.location.href;

    if (!button || !menu) return;

    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const encodedText = encodeURIComponent(`${title}${text ? ` — ${text}` : ""}`);
    const postSuffix = `\n${url}`;
    const postTitleLimit = Math.max(0, 300 - [...postSuffix].length);
    const postText = `${[...title].slice(0, postTitleLimit).join("")}${postSuffix}`;
    const encodedPostText = encodeURIComponent(postText);
    const bluesky = control.querySelector('[data-share-link="bluesky"]');
    const linkedin = control.querySelector('[data-share-link="linkedin"]');
    const threads = control.querySelector('[data-share-link="threads"]');
    const reddit = control.querySelector('[data-share-link="reddit"]');
    const x = control.querySelector('[data-share-link="x"]');
    const email = control.querySelector('[data-share-link="email"]');

    if (bluesky) bluesky.href = `https://bsky.app/intent/compose?text=${encodedPostText}`;
    if (linkedin) linkedin.href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    if (threads) threads.href = `https://www.threads.com/intent/post?text=${encodedPostText}`;
    if (reddit) reddit.href = `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`;
    if (x) x.href = `https://x.com/intent/post?url=${encodedUrl}&text=${encodedTitle}`;
    if (email) email.href = `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`;

    button.addEventListener("click", (event) => {
      const isOpen = button.getAttribute("aria-expanded") === "true";
      shareControls.forEach(closeShareMenu);
      button.setAttribute("aria-expanded", String(!isOpen));
      menu.hidden = isOpen;
      if (!isOpen) {
        if (feedback) feedback.textContent = "";
        if (event.detail === 0) menu.querySelector("a, button")?.focus();
      }
    });

    if (navigator.share && nativeButton) {
      nativeButton.hidden = false;
      nativeButton.addEventListener("click", async () => {
        try {
          await navigator.share({ title, text, url });
          closeShareMenu(control);
        } catch (error) {
          if (error?.name !== "AbortError" && feedback) {
            feedback.textContent = "Sharing is unavailable. Use one of the links below.";
          }
        }
      });
    }

    copyButton?.addEventListener("click", async () => {
      try {
        await writeClipboard(url);
        if (feedback) feedback.textContent = "Link copied.";
        window.setTimeout(() => {
          if (feedback?.textContent === "Link copied.") feedback.textContent = "";
        }, 2500);
      } catch {
        if (feedback) feedback.textContent = "Copy failed. Select the address from your browser.";
      }
    });

    control.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      closeShareMenu(control);
      button.focus();
    });
  });

  document.addEventListener("click", (event) => {
    shareControls.forEach((control) => {
      if (!control.contains(event.target)) closeShareMenu(control);
    });
  });

  document.querySelectorAll("[data-copy-citation]").forEach((button) => {
    button.addEventListener("click", async () => {
      const container = button.closest(".citation-copy");
      const citation = container?.querySelector("[data-citation-text]")?.textContent?.trim();
      const feedback = container?.querySelector("[data-citation-feedback]");
      if (!citation) return;
      try {
        await writeClipboard(citation);
        if (feedback) feedback.textContent = "Citation copied.";
      } catch {
        if (feedback) feedback.textContent = "Copy failed. Select the citation manually.";
      }
    });
  });

  const searchInput = document.querySelector("#publication-search");
  const filterButtons = [...document.querySelectorAll("[data-filter]")];
  const cards = [...document.querySelectorAll(".publication-card")];
  const noResults = document.querySelector("#no-results");

  if (!searchInput || !filterButtons.length || !cards.length || !noResults) return;

  let activeFilter = "all";
  const normalize = (value) =>
    value.toLocaleLowerCase("en").normalize("NFKD").replace(/\p{Diacritic}/gu, "");

  const updateResults = () => {
    const query = normalize(searchInput.value.trim());
    let visibleCount = 0;

    cards.forEach((card) => {
      const topics = card.dataset.topics?.split(" ") ?? [];
      const haystack = normalize(`${card.dataset.search ?? ""} ${card.textContent}`);
      const matchesTopic = activeFilter === "all" || topics.includes(activeFilter);
      const matchesSearch = !query || haystack.includes(query);
      const isVisible = matchesTopic && matchesSearch;
      card.hidden = !isVisible;
      if (isVisible) visibleCount += 1;
    });

    noResults.hidden = visibleCount !== 0;
  };

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter ?? "all";
      filterButtons.forEach((candidate) => {
        const isActive = candidate === button;
        candidate.classList.toggle("is-active", isActive);
        candidate.setAttribute("aria-pressed", String(isActive));
      });
      updateResults();
    });
  });

  searchInput.addEventListener("input", updateResults);
})();
