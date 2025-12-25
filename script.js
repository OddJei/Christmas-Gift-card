function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const AUDIO_NAV_FLAG_KEY = "chrstGift:playAudio";

function setupAudioAutoplayLoop() {
  const audio = document.getElementById("romanceAudio");
  if (!audio) return;

  audio.loop = true;

  const audioSrc = audio.getAttribute("src") || "";
  if (!audioSrc) {
    console.warn("[romance-audio] No src set on #romanceAudio");
    return;
  }

  const shouldAutoplay = window.sessionStorage.getItem(AUDIO_NAV_FLAG_KEY) === "1";
  if (!shouldAutoplay) return;
  window.sessionStorage.removeItem(AUDIO_NAV_FLAG_KEY);

  const tryPlayNow = () => {
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        console.warn(
          "[romance-audio] Playback blocked. Tap/click once to start. If it still fails, confirm the MP3 loads:",
          audioSrc,
        );
        document.addEventListener("pointerdown", () => audio.play().catch(() => {}), { once: true });
      });
    }
  };

  // Best-effort immediate start after the user pressed the button.
  tryPlayNow();
}

function isModifiedClick(event) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

function setupTeddyBubblesFill() {
  if (prefersReducedMotion()) return;

  const mouth = document.getElementById("teddyMouth");
  if (!mouth) return;

  const svgNS = "http://www.w3.org/2000/svg";

  const overlay = document.createElementNS(svgNS, "svg");
  overlay.setAttribute("class", "bubbleOverlay");
  overlay.setAttribute("aria-hidden", "true");
  overlay.setAttribute("focusable", "false");
  overlay.style.display = "block";
  document.body.appendChild(overlay);

  const syncViewBox = () => {
    const width = Math.max(1, Math.floor(window.innerWidth));
    const height = Math.max(1, Math.floor(window.innerHeight));
    overlay.setAttribute("viewBox", `0 0 ${width} ${height}`);
  };

  syncViewBox();
  window.addEventListener("resize", syncViewBox);

  const startedAt = performance.now();
  const durationMs = 180_000;
  const maxBubbles = 1200 * 3;

  const getMouthPointInOverlay = () => {
    const mouthRect = mouth.getBoundingClientRect();
    const x = mouthRect.left + mouthRect.width / 2;
    const y = mouthRect.top + mouthRect.height / 2;
    return { x, y };
  };

  const spawnBubble = () => {
    if (!document.body.contains(mouth)) return;
    if (overlay.childNodes.length >= maxBubbles) return;

    const { x: startX, y: startY } = getMouthPointInOverlay();
    const width = Math.max(1, window.innerWidth);
    const height = Math.max(1, window.innerHeight);

    const circle = document.createElementNS(svgNS, "circle");
    circle.setAttribute("class", "bubble");

    // Festive palette via hue rotation (base color is pink in CSS)
    const hueChoices = [
      0, // pinkish
      -14, // red
      42, // gold
      122, // green
      210, // blue
    ];
    const hue = hueChoices[Math.floor(Math.random() * hueChoices.length)];
    circle.style.setProperty("--hue", `${hue}deg`);

    const radius = (6 + Math.random() * 18) * 2;
    const jitterX = -10 + Math.random() * 20;
    const jitterY = -6 + Math.random() * 12;

    circle.setAttribute("cx", String(Math.max(0, Math.min(width, startX + jitterX))));
    circle.setAttribute("cy", String(Math.max(0, Math.min(height, startY + jitterY))));
    circle.setAttribute("r", String(radius));

    const drift = -60 + Math.random() * 120;
    const rise = height + 140;
    const dur = 8 + Math.random() * 10;
    const alpha = 0.28 + Math.random() * 0.34;

    circle.style.setProperty("--dx", `${drift}px`);
    circle.style.setProperty("--rise", `${rise}px`);
    circle.style.setProperty("--dur", `${dur}s`);
    circle.style.setProperty("--alpha", String(alpha));

    overlay.appendChild(circle);
    window.setTimeout(() => circle.remove(), Math.ceil(dur * 1000) + 150);
  };

  const loop = () => {
    const elapsed = performance.now() - startedAt;
    const t = Math.max(0, Math.min(1, elapsed / durationMs));

    // Spawn rate ramps up over 3 minutes.
    // ~2 bubbles/sec at start -> ~9 bubbles/sec near the end.
    const minDelay = 110;
    const maxDelay = 520;
    const delay = Math.round(maxDelay - (maxDelay - minDelay) * t);

    // Burst a little when we're further in, to help “fill the screen”.
    const perTick = (t < 0.25 ? 1 : t < 0.7 ? 2 : 3) * 3;
    for (let i = 0; i < perTick; i += 1) spawnBubble();

    if (elapsed < durationMs) {
      window.setTimeout(loop, delay);
      return;
    }

    // After 3 minutes, keep a gentle steady stream so it stays filled.
    window.setInterval(() => {
      spawnBubble();
      spawnBubble();
      spawnBubble();
      if (Math.random() > 0.55) {
        spawnBubble();
        spawnBubble();
        spawnBubble();
      }
    }, 260);
  };

  loop();
}

function createGlitterBurst({ x, y }) {
  const burst = document.createElement("div");
  burst.className = "glitter";
  burst.style.left = `${x}px`;
  burst.style.top = `${y}px`;

  const sparkleCount = 20;
  for (let index = 0; index < sparkleCount; index += 1) {
    const sparkle = document.createElement("i");
    sparkle.className = "glitter__spark";

    const angle = Math.random() * Math.PI * 2;
    const distance = 70 + Math.random() * 70;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;

    sparkle.style.setProperty("--dx", `${dx}px`);
    sparkle.style.setProperty("--dy", `${dy}px`);
    sparkle.style.setProperty("--rot", `${Math.floor(Math.random() * 260)}deg`);
    sparkle.style.setProperty("--delay", `${Math.random() * 110}ms`);
    sparkle.style.setProperty("--size", `${2 + Math.random() * 3}px`);
    sparkle.style.setProperty("--blur", `${Math.random() * 1.2}px`);
    sparkle.style.setProperty("--alpha", `${0.65 + Math.random() * 0.35}`);

    burst.appendChild(sparkle);
  }

  document.body.appendChild(burst);
  window.setTimeout(() => burst.remove(), 850);
}

function hookGlitterNavigation(link) {
  link.addEventListener("click", (event) => {
    // Request audio autoplay on the gift page (best-effort, depends on browser policies)
    try {
      window.sessionStorage.setItem(AUDIO_NAV_FLAG_KEY, "1");
    } catch {
      // ignore
    }

    if (prefersReducedMotion() || isModifiedClick(event)) return;
    if (!link.href) return;

    event.preventDefault();

    const rect = link.getBoundingClientRect();
    createGlitterBurst({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });

    window.setTimeout(() => {
      window.location.href = link.href;
    }, 420);
  });
}

// Landing page button (current)
const landingLink = document.querySelector(".card__button");
if (landingLink) hookGlitterNavigation(landingLink);

// Backward compatibility if an older button exists
const openGiftButton = document.getElementById("openGift");
if (openGiftButton && openGiftButton.tagName.toLowerCase() === "button") {
  openGiftButton.addEventListener("click", () => {
    if (prefersReducedMotion()) {
      window.location.href = "gift-card.html";
      return;
    }

    const rect = openGiftButton.getBoundingClientRect();
    createGlitterBurst({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    window.setTimeout(() => {
      window.location.href = "gift-card.html";
    }, 420);
  });
}

setupAudioAutoplayLoop();
setupTeddyBubblesFill();
