const CONFETTI_URL = "./js/vendor/confetti.browser.min.js";

let confettiFn = null;
let loadPromise = null;

function loadConfettiLib() {
  if (confettiFn) return Promise.resolve(confettiFn);
  if (typeof window.confetti === "function") {
    confettiFn = window.confetti;
    return Promise.resolve(confettiFn);
  }
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CONFETTI_URL;
    script.async = true;
    script.onload = () => {
      if (typeof window.confetti === "function") {
        confettiFn = window.confetti;
        resolve(confettiFn);
      } else {
        reject(new Error("confetti не загрузился"));
      }
    };
    script.onerror = () => reject(new Error("не удалось загрузить canvas-confetti"));
    document.head.appendChild(script);
  });

  return loadPromise;
}

export async function launchResultsConfetti() {
  try {
    const confetti = await loadConfettiLib();
    const colors = ["#ff5252", "#4caf50", "#ffc107", "#2196f3", "#ffffff"];
    const end = Date.now() + 2800;

    confetti({
      particleCount: 100,
      spread: 90,
      origin: { y: 0.5 },
      colors,
      zIndex: 60,
    });

    const burst = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.4 },
        colors,
        zIndex: 60,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.4 },
        colors,
        zIndex: 60,
      });
      if (Date.now() < end) requestAnimationFrame(burst);
    };

    burst();
  } catch (err) {
    console.warn("[confetti]", err.message);
  }
}

export function stopConfetti() {
  confettiFn?.reset?.();
}
