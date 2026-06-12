/**
 * Инжектируется через chrome-devtools evaluate_script.
 * Возвращает отчёт о прохождении всех веток.
 */
async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const results = [];
  const errors = [];

  function snapshot() {
    return {
      text: document.querySelector(".textbox__text")?.textContent?.trim()?.slice(0, 120) ?? "",
      choices: [...document.querySelectorAll("[data-choice]")].map((b) => b.dataset.choice),
      actBreak: Boolean(document.querySelector(".novel--act-break, .act-break")),
      menu: Boolean(document.querySelector(".main-menu")),
      ended: Boolean(document.querySelector(".end-screen")),
    };
  }

  async function goMenu() {
    const menuBtn = document.querySelector('[data-action="game-menu"]');
    if (menuBtn) {
      menuBtn.click();
      await sleep(400);
      document.querySelector('[data-action="exit"]')?.click();
      await sleep(500);
    }
  }

  async function startNew() {
    await goMenu();
    const btn = document.querySelector('[data-action="new-game"]');
    if (!btn) throw new Error("Кнопка «Новая игра» не найдена");
    btn.click();
    await sleep(600);
  }

  async function startAt(sceneId, lineIndex) {
    localStorage.setItem(
      "yandex_game_save",
      JSON.stringify({ novel_progress: { sceneId, lineIndex } }),
    );
    location.reload();
    await new Promise((r) => {
      const check = () => {
        if (document.querySelector('[data-action="continue"]')) r();
        else setTimeout(check, 100);
      };
      check();
    });
    document.querySelector('[data-action="continue"]')?.click();
    await sleep(700);
  }

  async function advanceUntilChoices(max = 120) {
    for (let i = 0; i < max; i++) {
      await sleep(360);
      const state = snapshot();
      if (state.choices.length) return state;
      if (state.menu) throw new Error("Неожиданно вернулись в меню");
      const novel = document.querySelector('.novel[data-action="advance"]');
      if (!novel) throw new Error("Экран новеллы не найден");
      novel.click();
      await sleep(360);
    }
    throw new Error("Превышен лимит advance");
  }

  async function pickChoice(id) {
    await sleep(200);
    const btn = document.querySelector(`[data-choice="${id}"]`);
    if (!btn) throw new Error(`Выбор не найден: ${id}`);
    btn.click();
    await sleep(400);
  }

  async function runTest(name, fn) {
    try {
      const detail = await fn();
      results.push({ name, ok: true, ...detail });
    } catch (err) {
      errors.push({ name, ok: false, error: String(err.message || err), state: snapshot() });
    }
  }

  // ── Маршруты до хаба (4 варианта главы 2 + 5 выборов посылки) ──
  const toHubSequences = [
    {
      name: "Маршрут: склад → документы → спасти → Макс → Лера",
      picks: [
        "ch01_take_parcel",
        "ch01_warehouse",
        "ch02b_docs",
        "ch03_save",
        "ch04_truth_max",
        "ch04_lera_trust",
      ],
    },
    {
      name: "Маршрут: открыть → кафе → рассказать → снять → Ника",
      picks: [
        "ch01_open_parcel",
        "ch01_cafe",
        "ch02a_tell_all",
        "ch03_film",
        "ch04_truth_nika",
        "ch04_lera_questions",
      ],
    },
    {
      name: "Маршрут: Макс → Орлова → улики → не вмешиваться → Орлова",
      picks: [
        "ch01_call_max",
        "ch01_orlova",
        "ch02v_evidence",
        "ch03_obey",
        "ch04_truth_orlova",
        "ch04_lera_blame",
      ],
    },
    {
      name: "Маршрут: спрятать → наблюдать → записать → хаос → никому",
      picks: [
        "ch01_hide_parcel",
        "ch01_observe",
        "ch02g_record",
        "ch03_chaos",
        "ch04_truth_nobody",
        "ch04_lera_pretend",
      ],
    },
    {
      name: "Маршрут: выбросить посылку → склад → оставить → доставить",
      picks: [
        "ch01_throw_parcel",
        "ch01_warehouse",
        "ch02b_leave",
        "ch03_deliver",
        "ch04_truth_lera",
        "ch04_lera_trust",
      ],
    },
  ];

  for (const route of toHubSequences) {
    await runTest(route.name, async () => {
      await startNew();
      await advanceUntilChoices(); // пролог → act break
      document.querySelector('.novel[data-action="advance"]')?.click();
      await sleep(400);
      await advanceUntilChoices(); // выбор посылки
      for (const pick of route.picks) {
        await pickChoice(pick);
        await advanceUntilChoices();
      }
      await advanceUntilChoices(); // офис синхрон
      const hub = await advanceUntilChoices();
      if (!hub.choices.includes("hub_branch_a")) throw new Error("Хаб веток не достигнут");
      return { hubChoices: hub.choices.length };
    });
  }

  // ── Ветка A ──
  const branchAPaths = [
    ["hub_branch_a", "a1_loop", "a2_stay", "a_to_hub"],
    ["hub_branch_a", "a1_danger", "a2_leave", "a_to_e"],
    ["hub_branch_a", "a1_avoid", "a2_orlova", "a_to_hub"],
    ["hub_branch_a", "a1_lera", "a2_nika", "a_to_e"],
  ];
  for (let i = 0; i < branchAPaths.length; i++) {
    const picks = branchAPaths[i];
    await runTest(`Ветка A — путь ${i + 1}`, async () => {
      await startAt("scene_ch04_hub", 2);
      for (const p of picks) {
        await pickChoice(p);
        await advanceUntilChoices();
      }
      return snapshot();
    });
  }

  // ── Ветка B ──
  const branchBPaths = [
    ["hub_branch_b", "b2_server", "b_to_e"],
    ["hub_branch_b", "b2_hide", "b_to_hub"],
    ["hub_branch_b", "b2_orlova", "b_to_s2"],
    ["hub_branch_b", "b2_destroy"],
  ];
  for (let i = 0; i < branchBPaths.length; i++) {
    await runTest(`Ветка B — путь ${i + 1}`, async () => {
      await startAt("scene_ch04_hub", 2);
      for (const p of branchBPaths[i]) {
        await pickChoice(p);
        if (p.startsWith("b2_destroy")) {
          await advanceUntilChoices();
          break;
        }
        await advanceUntilChoices();
      }
      return snapshot();
    });
  }

  // ── Ветка C ──
  const branchCPaths = [
    ["hub_branch_c", "c1_max"],
    ["hub_branch_c", "c1_server"],
    ["hub_branch_c", "c1_route"],
    ["hub_branch_c", "c1_break"],
  ];
  for (let i = 0; i < branchCPaths.length; i++) {
    await runTest(`Ветка C — путь ${i + 1}`, async () => {
      await startAt("scene_ch04_hub", 2);
      await pickChoice("hub_branch_c");
      await advanceUntilChoices();
      await pickChoice(branchCPaths[i][1]);
      await advanceUntilChoices();
      return snapshot();
    });
  }

  // ── Ветка D ──
  const branchDPaths = [
    ["hub_branch_d", "d1_follow", "d_to_hub"],
    ["hub_branch_d", "d1_ask"],
    ["hub_branch_d", "d1_break"],
    ["hub_branch_d", "d1_lera", "d_to_e"],
  ];
  for (let i = 0; i < branchDPaths.length; i++) {
    await runTest(`Вetка D — путь ${i + 1}`, async () => {
      await startAt("scene_ch04_hub", 2);
      for (const p of branchDPaths[i]) {
        await pickChoice(p);
        await advanceUntilChoices();
      }
      return snapshot();
    });
  }

  // ── S1 ──
  const s1Paths = [
    ["hub_branch_s1", "s1_route", "s1_to_e"],
    ["hub_branch_s1", "s1_lera", "s1_to_hub"],
    ["hub_branch_s1", "s1_publish", "s1_to_e"],
    ["hub_branch_s1", "s1_ignore"],
  ];
  for (let i = 0; i < s1Paths.length; i++) {
    await runTest(`S1 — путь ${i + 1}`, async () => {
      await startAt("scene_ch04_hub", 2);
      for (const p of s1Paths[i]) {
        await pickChoice(p);
        await advanceUntilChoices();
      }
      return snapshot();
    });
  }

  // ── S2 ──
  const s2Paths = [
    ["hub_branch_s2", "s2_lera"],
    ["hub_branch_s2", "s2_orlova"],
    ["hub_branch_s2", "s2_alone"],
    ["hub_branch_s2", "s2_nika"],
  ];
  for (let i = 0; i < s2Paths.length; i++) {
    await runTest(`S2 — путь ${i + 1}`, async () => {
      await startAt("scene_ch04_hub", 2);
      await pickChoice("hub_branch_s2");
      await advanceUntilChoices();
      await pickChoice(s2Paths[i][1]);
      await advanceUntilChoices();
      return snapshot();
    });
  }

  // ── Ветка E — все финалы ──
  const ePaths = [
    ["hub_branch_e", "e1_nika", "e2_save"],
    ["hub_branch_e", "e1_orlova", "e2_module"],
    ["hub_branch_e", "e1_lera", "e2_people"],
    ["hub_branch_e", "e1_max", "e2_together"],
    ["hub_branch_e", "e1_sync"],
    ["hub_branch_e", "e1_lera", "e2_force"],
  ];
  for (let i = 0; i < ePaths.length; i++) {
    await runTest(`Ветка E — финал ${i + 1}`, async () => {
      await startAt("scene_ch04_hub", 2);
      for (const p of ePaths[i]) {
        await pickChoice(p);
        await advanceUntilChoices();
      }
      // эпилог
      let guard = 0;
      while (guard++ < 30) {
        await sleep(360);
        const s = snapshot();
        if (s.actBreak && s.text.includes("КОНЕЦ")) return s;
        if (s.menu) return s;
        document.querySelector('.novel[data-action="advance"]')?.click();
      }
      return snapshot();
    });
  }

  return {
    passed: results.length,
    failed: errors.length,
    total: results.length + errors.length,
    results,
    errors,
    consoleErrors: "check separately",
  };
};
