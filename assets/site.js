// Shared behaviour: language, menu, header shadow, copy buttons, publication filter, recruiting popup.
(() => {
  const root = document.documentElement;
  const L = (ko, en) => `<span data-l="ko">${ko}</span><span data-l="en">${en}</span>`;

  function setLang(l) {
    root.dataset.lang = l;
    root.lang = l === "en" ? "en" : "ko";
    document.querySelectorAll(".lang button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang === l)));
    try { localStorage.setItem("dcl-lang", l); } catch (e) {}
  }
  document.querySelectorAll(".lang button").forEach(b => b.addEventListener("click", () => setLang(b.dataset.lang)));
  let saved = null;
  try { saved = localStorage.getItem("dcl-lang"); } catch (e) {}
  setLang(saved === "en" ? "en" : "ko");

  const menuBtn = document.getElementById("menuBtn"), drawer = document.getElementById("drawer");
  if (menuBtn && drawer) {
    const setOpen = open => { drawer.hidden = !open; menuBtn.setAttribute("aria-expanded", String(open)); document.body.classList.toggle("menu-open", open); };
    menuBtn.addEventListener("click", () => setOpen(drawer.hidden));
    drawer.addEventListener("click", e => { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && !drawer.hidden) { setOpen(false); menuBtn.focus(); } });
  }

  const top = document.querySelector(".top");
  const onScroll = () => { if (top) top.classList.toggle("scrolled", window.scrollY > 8); };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  document.addEventListener("click", e => {
    const b = e.target.closest("button[data-copy]");
    if (!b) return;
    const original = b.innerHTML;
    const done = () => { b.innerHTML = L("복사했습니다", "Copied"); setTimeout(() => { b.innerHTML = original; }, 1600); };
    const fallback = () => {
      const v = b.parentElement.querySelector(".v");
      if (v) { const r = document.createRange(); r.selectNodeContents(v); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
      b.innerHTML = L("선택했습니다. Ctrl+C로 복사하세요", "Selected. Press Ctrl+C");
      setTimeout(() => { b.innerHTML = original; }, 2400);
    };
    try { navigator.clipboard.writeText(b.dataset.copy).then(done, fallback); } catch (err) { fallback(); }
  });

  const pubList = document.getElementById("pubList"), pubSel = document.getElementById("pubSel"), pubAll = document.getElementById("pubAll");
  if (pubList && pubSel && pubAll) {
    const set = mode => { pubList.dataset.mode = mode; pubSel.setAttribute("aria-pressed", String(mode === "sel")); pubAll.setAttribute("aria-pressed", String(mode === "all")); };
    pubSel.addEventListener("click", () => set("sel"));
    pubAll.addEventListener("click", () => set("all"));
    set("all");
  }

  // recruiting popup: opens shortly after load; "오늘 하루 그만 보기" keeps it closed for a day (cookie labpop=done, with a storage fallback for file:// and sandboxed frames)
  const pop = document.getElementById("labpop");
  if (pop && !/[?&]nopop\b/.test(location.search)) {
    const DAY = 864e5;
    const hidden = () => {
      if (document.cookie.split("; ").some(c => c === "labpop=done")) return true;
      try { const until = Number(localStorage.getItem("labpop-until")); return until > Date.now(); } catch (e) { return false; }
    };
    if (!hidden()) {
      const today = document.getElementById("labpop-today");
      let prevOverflow = "", lastFocus = null;
      const focusables = () => [...pop.querySelectorAll("button, a[href], input")].filter(el => !el.disabled);
      const open = () => { lastFocus = document.activeElement; prevOverflow = document.body.style.overflow; pop.hidden = false; document.body.style.overflow = "hidden"; pop.querySelector(".labpop-close").focus(); };
      const close = () => {
        if (today && today.checked) {
          document.cookie = "labpop=done; expires=" + new Date(Date.now() + DAY).toUTCString() + "; path=/; SameSite=Lax";
          try { localStorage.setItem("labpop-until", String(Date.now() + DAY)); } catch (e) {}
        }
        pop.hidden = true; document.body.style.overflow = prevOverflow;
        if (lastFocus && lastFocus.focus) lastFocus.focus();
      };
      pop.querySelector(".labpop-x").addEventListener("click", close);
      pop.querySelector(".labpop-close").addEventListener("click", close);
      pop.addEventListener("click", e => { if (e.target === pop) close(); });
      document.addEventListener("keydown", e => {
        if (pop.hidden) return;
        if (e.key === "Escape") close();
        if (e.key === "Tab") { const f = focusables(), first = f[0], last = f[f.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
      });
      setTimeout(open, 600);
    }
  }
})();
