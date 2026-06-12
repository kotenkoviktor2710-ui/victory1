/** @type {import("elkjs/lib/elk-api").ELK|null} */
let elkInstance = null;

/** @type {Promise<import("elkjs/lib/elk-api").ELK>|null} */
let elkLoadPromise = null;

const ELK_SCRIPT_SRC = "js/vendor/elk.bundled.js";

/** @returns {Promise<import("elkjs/lib/elk-api").ELK>} */
export function loadElk() {
  if (elkInstance) return Promise.resolve(elkInstance);
  if (elkLoadPromise) return elkLoadPromise;

  elkLoadPromise = new Promise((resolve, reject) => {
    if (window.ELK) {
      elkInstance = new window.ELK();
      resolve(elkInstance);
      return;
    }

    const script = document.createElement("script");
    script.src = ELK_SCRIPT_SRC;
    script.async = true;
    script.onload = () => {
      if (!window.ELK) {
        reject(new Error("ELK не найден после загрузки скрипта"));
        return;
      }
      elkInstance = new window.ELK();
      resolve(elkInstance);
    };
    script.onerror = () => reject(new Error("Не удалось загрузить elk.js"));
    document.head.appendChild(script);
  });

  return elkLoadPromise;
}
