(() => {
  const searchInput = document.querySelector("#publication-search");
  const filterButtons = [...document.querySelectorAll("[data-filter]")];
  const cards = [...document.querySelectorAll(".publication-card")];
  const noResults = document.querySelector("#no-results");

  if (!searchInput || !filterButtons.length || !cards.length || !noResults) {
    return;
  }

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
