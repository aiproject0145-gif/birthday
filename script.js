(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Scroll progress bar ---------------- */

  const scrollProgressBar = document.getElementById("scrollProgressBar");
  function updateScrollProgress() {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    scrollProgressBar.style.width = `${Math.min(Math.max(pct, 0), 100)}%`;
  }
  window.addEventListener("scroll", updateScrollProgress, { passive: true });
  window.addEventListener("resize", updateScrollProgress);
  updateScrollProgress();

  /* ---------------- Ambient background particles ---------------- */

  const canvas = document.getElementById("bg-canvas");
  const ctx = canvas.getContext("2d");
  let particles = [];
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resizeCanvas() {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makeParticles(count) {
    const colors = ["#e9b65e", "#ff6f91", "#c9c2e8", "#f5d89a"];
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 2 + 0.6,
      speed: Math.random() * 0.4 + 0.08,
      drift: Math.random() * 0.6 - 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
      twinkle: Math.random() * Math.PI * 2,
    }));
  }

  function drawAmbient() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (const p of particles) {
      p.twinkle += 0.02;
      const alpha = 0.35 + Math.sin(p.twinkle) * 0.25;
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(alpha, 0.08);
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();

      if (!reduceMotion) {
        p.y -= p.speed;
        p.x += p.drift * 0.2;
        if (p.y < -10) p.y = window.innerHeight + 10;
        if (p.x < -10) p.x = window.innerWidth + 10;
        if (p.x > window.innerWidth + 10) p.x = -10;
      }
    }
    ctx.globalAlpha = 1;
    if (!reduceMotion) requestAnimationFrame(drawAmbient);
  }

  resizeCanvas();
  makeParticles(70);
  drawAmbient();
  window.addEventListener("resize", () => {
    resizeCanvas();
  });

  /* ---------------- Confetti burst (gift open / cake cut) ---------------- */

  function burstConfetti(originX, originY, opts = {}) {
    const colors = opts.colors || ["#e9b65e", "#ff6f91", "#c9c2e8", "#f5d89a", "#fbf7ff"];
    const circleRatio = opts.circleRatio || 0;
    const count = reduceMotion ? 0 : opts.count || 60;
    const bits = Array.from({ length: count }, () => ({
      x: originX,
      y: originY,
      vx: (Math.random() - 0.5) * 8,
      vy: Math.random() * -8 - 3,
      size: Math.random() * 5 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: Math.random() < circleRatio ? "circle" : "rect",
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      life: 0,
    }));

    if (bits.length === 0) return;

    function frame() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      // repaint ambient particles underneath so they don't vanish for a frame
      for (const p of particles) {
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.3;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      let alive = false;
      for (const b of bits) {
        b.life += 1;
        if (b.life > 90) continue;
        alive = true;
        b.x += b.vx;
        b.y += b.vy;
        b.vy += 0.25;
        b.rot += b.vr;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);
        ctx.fillStyle = b.color;
        ctx.globalAlpha = Math.max(1 - b.life / 90, 0);
        if (b.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, b.size / 2.4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-b.size / 2, -b.size / 4, b.size, b.size / 2);
        }
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      if (alive) requestAnimationFrame(frame);
    }
    frame();
  }

  /* ---------------- Intro terminal sequence ---------------- */

  const intro = document.getElementById("intro");
  const card = document.getElementById("card");
  const enterBtn = document.getElementById("enterBtn");
  const introLines = [
    { el: document.getElementById("introLine1"), text: "> loading birthday_wish.exe ..." },
    { el: document.getElementById("introLine2"), text: "> compiling wishes for Irum Shabbir ..." },
    { el: document.getElementById("introLine3"), text: "> build successful. 0 errors, 100% love." },
  ];

  function typeLine(line, speed, done) {
    let i = 0;
    line.el.textContent = "";
    const timer = setInterval(() => {
      line.el.textContent += line.text[i];
      i++;
      if (i >= line.text.length) {
        clearInterval(timer);
        done();
      }
    }, speed);
  }

  function runIntro() {
    if (reduceMotion) {
      introLines.forEach((l) => (l.el.textContent = l.text));
      enterBtn.hidden = false;
      return;
    }
    let idx = 0;
    function next() {
      if (idx >= introLines.length) {
        enterBtn.hidden = false;
        return;
      }
      typeLine(introLines[idx], 28, () => {
        idx++;
        setTimeout(next, 220);
      });
    }
    next();
  }

  function openCard() {
    intro.classList.add("hidden");
    card.classList.add("visible");
    startTypewriter();
    document.removeEventListener("keydown", onKeydown);
    scheduleAutoCut(reduceMotion ? 500 : 1400);
  }

  function beginOpen() {
    if (enterBtn.disabled) return;
    enterBtn.disabled = true;

    if (reduceMotion) {
      openCard();
      return;
    }

    enterBtn.textContent = "Opening your wish...";
    const hintLine = document.createElement("p");
    hintLine.className = "line hint-line";
    hintLine.textContent = "> unwrapping birthday.exe for Irum ✨";
    enterBtn.insertAdjacentElement("beforebegin", hintLine);

    setTimeout(openCard, 700);
  }

  function onKeydown(e) {
    if (e.key === "Enter" && !enterBtn.hidden && !enterBtn.disabled) beginOpen();
  }

  enterBtn.addEventListener("click", beginOpen);
  document.addEventListener("keydown", onKeydown);
  runIntro();

  /* ---------------- Message typewriter ---------------- */

  const message =
    "Dear Mam Irum, on the floor you keep calm when the queues get loud and make every agent feel seen. " +
    "Today isn't about targets or shifts — it's simply about you. " +
    "May this new year bring you the same patience you give others, and a little extra joy reserved just for yourself. " +
    "Happy Birthday!";

  const typewriterEl = document.getElementById("typewriter");
  const caretEl = document.getElementById("caret");
  let typewriterStarted = false;

  function startTypewriter() {
    if (typewriterStarted) return;
    typewriterStarted = true;

    if (reduceMotion) {
      typewriterEl.textContent = message;
      caretEl.classList.add("done");
      return;
    }

    let i = 0;
    const timer = setInterval(() => {
      typewriterEl.textContent += message[i];
      i++;
      if (i >= message.length) {
        clearInterval(timer);
        caretEl.classList.add("done");
      }
    }, 22);
  }

  /* ---------------- Gift box interaction ---------------- */

  const giftBox = document.getElementById("giftBox");
  const giftHint = document.getElementById("giftHint");
  const quoteCard = document.getElementById("quoteCard");
  let giftOpened = false;

  giftBox.addEventListener("click", () => {
    if (giftOpened) return;
    giftOpened = true;
    giftBox.classList.add("open");
    giftHint.textContent = "made just for you ✨";
    quoteCard.classList.add("visible");
    document.querySelector(".gift-section").classList.add("opened");

    const rect = giftBox.getBoundingClientRect();
    burstConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
  });

  /* ---------------- Scroll reveal ---------------- */

  const revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealEls.forEach((el) => el.classList.add("in-view"));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("in-view");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.25 }
      );
      revealEls.forEach((el) => io.observe(el));
    }
  }

  /* ---------------- Cake: make a wish + cut the cake ---------------- */

  const cakeBtn = document.getElementById("cake");
  const flameEl = document.getElementById("flame");
  const smokeEl = document.getElementById("smoke");
  const knifeEl = document.getElementById("knife");
  const sliceEl = document.getElementById("slice");
  const wishHintEl = document.getElementById("wishHint");
  let cakeBusy = false;
  let autoCutTimer = null;
  const AUTO_CUT_GAP = 5200;

  const FLAVOR_COUNT = 3;
  let flavorIndex = 0;
  const CAKE_SCALES = [1, 0.88, 0.76, 0.64, 0.54];
  let sizeStep = 0;

  function scheduleAutoCut(delay) {
    clearTimeout(autoCutTimer);
    autoCutTimer = setTimeout(() => runCakeCut(true), delay);
  }

  function serveSlice() {
    // cycle the cake's flavor color on every cut
    flavorIndex = (flavorIndex + 1) % FLAVOR_COUNT;
    cakeBtn.classList.remove("flavor-0", "flavor-1", "flavor-2");
    if (flavorIndex > 0) cakeBtn.classList.add(`flavor-${flavorIndex}`);

    // shrink the remaining cake with each slice; replenish once fully served
    sizeStep += 1;
    const replenished = sizeStep >= CAKE_SCALES.length;
    if (replenished) sizeStep = 0;
    cakeBtn.style.setProperty("--cake-scale", CAKE_SCALES[sizeStep]);

    return replenished;
  }

  function runCakeCut(auto) {
    if (cakeBusy) return;
    cakeBusy = true;
    cakeBtn.classList.add("cutting");
    flameEl.classList.add("out");
    wishHintEl.textContent = auto ? "serving another slice..." : "cutting the cake...";

    if (reduceMotion) {
      const replenished = serveSlice();
      wishHintEl.textContent = replenished ? "🎂 a fresh cake appears!" : "🍰 a fresh slice, served with love";
      setTimeout(() => {
        flameEl.classList.remove("out");
        cakeBtn.classList.remove("cutting");
        cakeBtn.classList.add("cut");
        wishHintEl.textContent = "tap to cut again 🔪";
        cakeBusy = false;
        scheduleAutoCut(AUTO_CUT_GAP);
      }, 1800);
      return;
    }

    smokeEl.classList.remove("puff");
    void smokeEl.offsetWidth;
    smokeEl.classList.add("puff");

    setTimeout(() => {
      knifeEl.classList.remove("slicing");
      sliceEl.classList.remove("serving");
      void knifeEl.offsetWidth;
      knifeEl.classList.add("slicing");
      sliceEl.classList.add("serving");
      cakeBtn.classList.add("cut");

      const replenished = serveSlice();

      const rect = cakeBtn.getBoundingClientRect();
      burstConfetti(rect.left + rect.width / 2, rect.top + rect.height * 0.6, {
        colors: ["#e9b65e", "#fff6d8", "#ff6f91", "#f5d89a", "#7a5a2a"],
        count: 56,
        circleRatio: 0.5,
      });
      wishHintEl.textContent = replenished ? "🎂 a fresh cake appears!" : "🍰 a fresh slice, served with love";
    }, 650);

    setTimeout(() => {
      flameEl.classList.remove("out");
      knifeEl.classList.remove("slicing");
      sliceEl.classList.remove("serving");
      cakeBtn.classList.remove("cutting");
      wishHintEl.textContent = "tap to cut again 🔪";
      cakeBusy = false;
      scheduleAutoCut(AUTO_CUT_GAP);
    }, 4600);
  }

  cakeBtn.addEventListener("click", () => runCakeCut(false));

  /* ---------------- Name: letter-by-letter color cycle ---------------- */

  const nameLetters = document.getElementById("nameLetters");
  if (nameLetters) {
    const text = nameLetters.textContent;
    nameLetters.textContent = "";
    text.split("").forEach((ch, i) => {
      const span = document.createElement("span");
      span.className = "letter" + (ch === " " ? " is-space" : "");
      span.textContent = ch === " " ? " " : ch;
      span.style.setProperty("--d", `${i * 0.12}s`);
      nameLetters.appendChild(span);
    });
  }

  /* ---------------- Scroll cue ---------------- */

  const scrollCue = document.getElementById("scrollCue");
  if (scrollCue) {
    const showScrollCue = () => {
      if (!card.classList.contains("visible")) return;
      scrollCue.classList.add("visible");
    };
    const hideOnScroll = () => {
      scrollCue.classList.add("fade-out");
      window.removeEventListener("scroll", hideOnScroll);
    };
    const cardObserver = new MutationObserver(() => {
      if (card.classList.contains("visible")) {
        setTimeout(showScrollCue, 400);
        cardObserver.disconnect();
      }
    });
    cardObserver.observe(card, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("scroll", hideOnScroll, { passive: true });
  }

  /* ---------------- Balloon parallax (fine pointers only) ---------------- */

  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (canHover && !reduceMotion) {
    const balloonEls = document.querySelectorAll(".balloon");
    document.querySelector(".hero").addEventListener("mousemove", (e) => {
      const { innerWidth, innerHeight } = window;
      const px = (e.clientX / innerWidth - 0.5) * 2;
      const py = (e.clientY / innerHeight - 0.5) * 2;
      balloonEls.forEach((b, i) => {
        const strength = 6 + i * 2;
        b.style.setProperty("--px", (px * strength).toFixed(2));
        b.style.setProperty("--py", (py * strength * 0.6).toFixed(2));
      });
    });
  }
})();
