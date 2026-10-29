"use strict";

(() => {
  const header = document.querySelector(".site-header");
  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector("#section-nav");
  const links = [...nav.querySelectorAll('a[href^="#"]')];
  const sections = links.map(link => document.querySelector(link.getAttribute("href")));
  const smallScreen = window.matchMedia("(max-width: 900px)");
  let activeDestination = sections.find(section => `#${section.id}` === window.location.hash) || null;
  let lastFocusedElement = document.activeElement;
  document.addEventListener("focusin", event => { lastFocusedElement = event.target; });

  // With JavaScript disabled, the links stay visible at every screen size.
  header.classList.add("nav-enhanced");

  function setMenu(open, returnFocus = false) {
    nav.classList.toggle("is-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    if (returnFocus) menuButton.focus();
  }

  function syncMenu() {
    menuButton.hidden = !smallScreen.matches;
    setMenu(false, smallScreen.matches && nav.contains(lastFocusedElement));
  }

  menuButton.addEventListener("click", () => {
    setMenu(menuButton.getAttribute("aria-expanded") !== "true");
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
      setMenu(false, true);
    }
  });

  document.addEventListener("click", event => {
    if (!header.contains(event.target)) setMenu(false);
  });

  // Move keyboard focus to the destination so it is not left in a closed menu.
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", () => {
      const target = document.querySelector(link.getAttribute("href"));
      activeDestination = sections.includes(target) ? target : null;
      setMenu(false);
      if (target) {
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }
      scheduleUpdate();
    });
  });

  let pending = false;
  function updateCurrentSection() {
    const line = header.getBoundingClientRect().height + 40;
    let current = sections[0];
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= line) current = section;
    }
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
      current = sections[sections.length - 1];
    }
    // Near the page end several short sections can share the viewport. Keep a
    // clicked destination selected while visible, until the visitor scrolls.
    if (activeDestination) {
      const bounds = activeDestination.getBoundingClientRect();
      if (bounds.bottom > line && bounds.top < window.innerHeight) current = activeDestination;
      else activeDestination = null;
    }
    links.forEach(link => {
      if (link.hash === `#${current.id}`) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    pending = false;
  }

  function scheduleUpdate() {
    if (!pending) {
      pending = true;
      window.requestAnimationFrame(updateCurrentSection);
    }
  }

  // The collapsed bar height is stable at mobile sizes. Expanded menus close
  // before anchor navigation, so they do not change the destination offset.
  function updateHeaderHeight() {
    if (menuButton.getAttribute("aria-expanded") !== "true") {
      document.documentElement.style.setProperty("--header-height", `${header.offsetHeight}px`);
    }
    scheduleUpdate();
  }

  smallScreen.addEventListener("change", () => { syncMenu(); updateHeaderHeight(); });
  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", updateHeaderHeight);
  window.addEventListener("hashchange", scheduleUpdate);
  function resumeScrollTracking() { activeDestination = null; scheduleUpdate(); }
  window.addEventListener("wheel", resumeScrollTracking, { passive: true });
  window.addEventListener("touchstart", resumeScrollTracking, { passive: true });
  window.addEventListener("keydown", event => {
    if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)
        && !event.target.closest("button, a")) resumeScrollTracking();
  });
  syncMenu();
  updateHeaderHeight();
  updateCurrentSection();
})();
