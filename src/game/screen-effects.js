const FLASH_MS = 720;
const FLASH_REDUCED_MS = 280;

/**
 * Мягкая полноэкранная белая вспышка поверх новеллы.
 * @param {HTMLElement} container — обычно `.novel`
 * @returns {Promise<void>}
 */
export function playSoftWhiteFlash(container) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const duration = reduced ? FLASH_REDUCED_MS : FLASH_MS;

  return new Promise((resolve) => {
    const flash = document.createElement("div");
    flash.className = "novel-flash";
    flash.setAttribute("aria-hidden", "true");
    if (reduced) flash.classList.add("novel-flash--reduced");
    container.appendChild(flash);

    void flash.offsetWidth;
    flash.classList.add("is-active");

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      flash.remove();
      resolve();
    };

    flash.addEventListener("animationend", finish, { once: true });
    window.setTimeout(finish, duration + 100);
  });
}
