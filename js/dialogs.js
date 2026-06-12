const DIALOG_LEAVE_MS = 260;

/** @type {Promise<unknown>} */
let dialogChain = Promise.resolve();

/** @param {() => Promise<unknown>} task */
function enqueueDialog(task) {
  const run = dialogChain.then(() => task());
  dialogChain = run.catch(() => {});
  return run;
}

/** @param {string} value */
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * @param {object} options
 * @param {string} options.message
 * @param {string} [options.title]
 * @param {"alert"|"confirm"} options.kind
 * @param {string} [options.confirmLabel]
 * @param {string} [options.cancelLabel]
 * @returns {Promise<boolean>}
 */
function openDialog(options) {
  return enqueueDialog(
    () =>
      new Promise((resolve) => {
        const {
          message,
          title = "",
          kind,
          confirmLabel = kind === "confirm" ? "OK" : "Понятно",
          cancelLabel = "Отмена",
        } = options;

        const root = document.createElement("div");
        root.className = "game-dialog-root";
        root.innerHTML = `
          <div
            class="overlay overlay--dim game-dialog"
            data-stop-advance="true"
            role="alertdialog"
            aria-modal="true"
            ${title ? 'aria-labelledby="game-dialog-title"' : ""}
            aria-describedby="game-dialog-message"
          >
            <div class="panel panel--dialog">
              ${
                title
                  ? `<div class="panel__head panel__head--compact">
                      <h2 class="panel__title" id="game-dialog-title">${escapeHtml(title)}</h2>
                    </div>`
                  : ""
              }
              <div class="panel__body">
                <p class="game-dialog__message" id="game-dialog-message">${escapeHtml(message)}</p>
              </div>
              <div class="panel__foot panel__foot--dialog">
                ${
                  kind === "confirm"
                    ? `<button type="button" class="menu-btn game-dialog__btn" data-dialog-action="cancel">
                        <span class="menu-btn__label">${escapeHtml(cancelLabel)}</span>
                      </button>`
                    : ""
                }
                <button type="button" class="menu-btn menu-btn--active game-dialog__btn" data-dialog-action="confirm">
                  <span class="menu-btn__label">${escapeHtml(confirmLabel)}</span>
                </button>
              </div>
            </div>
          </div>
        `;

        document.body.appendChild(root);

        const overlay = root.querySelector(".game-dialog");
        const confirmBtn = root.querySelector('[data-dialog-action="confirm"]');
        const cancelBtn = root.querySelector('[data-dialog-action="cancel"]');

        let settled = false;

        /** @param {boolean} result */
        const finish = (result) => {
          if (settled || !overlay) return;
          settled = true;
          document.removeEventListener("keydown", onKeyDown);
          overlay.classList.add("is-leaving");
          window.setTimeout(() => {
            root.remove();
            resolve(result);
          }, DIALOG_LEAVE_MS);
        };

        /** @param {KeyboardEvent} event */
        const onKeyDown = (event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            finish(kind === "confirm" ? false : true);
            return;
          }
          if (event.key === "Enter" && !event.repeat) {
            event.preventDefault();
            finish(true);
          }
        };

        confirmBtn?.addEventListener("click", () => finish(true));
        cancelBtn?.addEventListener("click", () => finish(false));
        overlay.addEventListener("click", (event) => {
          if (event.target === overlay) finish(kind === "confirm" ? false : true);
        });

        document.addEventListener("keydown", onKeyDown);
        requestAnimationFrame(() => confirmBtn?.focus());
      }),
  );
}

/**
 * @param {string} message
 * @param {{ title?: string, confirmLabel?: string }} [options]
 */
export function showAlert(message, options = {}) {
  return openDialog({ ...options, message, kind: "alert" }).then(() => undefined);
}

/**
 * @param {string} message
 * @param {{ title?: string, confirmLabel?: string, cancelLabel?: string }} [options]
 */
export function showConfirm(message, options = {}) {
  return openDialog({ ...options, message, kind: "confirm" });
}
