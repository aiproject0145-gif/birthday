(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  /* ---------------- Confetti burst (gift open) ---------------- */

  function burstConfetti(originX, originY) {
    const colors = ["#e9b65e", "#ff6f91", "#c9c2e8", "#f5d89a", "#fbf7ff"];
    const bits = Array.from({ length: reduceMotion ? 0 : 60 }, () => ({
      x: originX,
      y: originY,
      vx: (Math.random() - 0.5) * 8,
      vy: Math.random() * -8 - 3,
      size: Math.random() * 5 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
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
        ctx.fillRect(-b.size / 2, -b.size / 4, b.size, b.size / 2);
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
  }

  function onKeydown(e) {
    if (e.key === "Enter" && !enterBtn.hidden) openCard();
  }

  enterBtn.addEventListener("click", openCard);
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

  /* ---------------- Candle "make a wish" interaction ---------------- */

  const cakeBtn = document.getElementById("cake");
  const flameEl = document.getElementById("flame");
  const smokeEl = document.getElementById("smoke");
  let candleBusy = false;

  cakeBtn.addEventListener("click", () => {
    if (candleBusy || flameEl.classList.contains("out")) return;
    candleBusy = true;
    flameEl.classList.add("out");

    if (!reduceMotion) {
      smokeEl.classList.remove("puff");
      void smokeEl.offsetWidth;
      smokeEl.classList.add("puff");
      const rect = cakeBtn.getBoundingClientRect();
      burstConfetti(rect.left + rect.width / 2, rect.top + 20);
    }

    setTimeout(() => {
      flameEl.classList.remove("out");
      candleBusy = false;
    }, 2200);
  });

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
