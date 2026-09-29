(() => {
  const button = document.getElementById("copy-share-link");
  const input = document.getElementById("sharing-url");
  const feedback = document.getElementById("copy-feedback");
  button?.addEventListener("click", async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(input.value);
      feedback.textContent = "Sharing link copied. Paste it into your social media post.";
    } catch {
      input.focus();
      input.select();
      feedback.textContent = "Select and copy the sharing link above.";
    }
  });
})();
