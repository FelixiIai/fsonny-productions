/* ============================================================
   F.SONNY PRODUCTIONS — interactions
   Smooth scroll (Lenis), hero reel cycle, horizontal showcase,
   cursor-follow button, parallax, count-ups, hover previews
   ============================================================ */

(function () {
  "use strict";

  /* ---------- Smooth scrolling (Lenis, with graceful fallback) ---------- */
  let lenis = null;
  if (typeof Lenis !== "undefined") {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  // Anchor links scroll smoothly through Lenis when available
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var target = document.querySelector(a.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4 });
      else target.scrollIntoView({ behavior: "smooth" });
    });
  });

  /* ---------- Page-load intro: blur the description in word by word ---------- */
  var desc = document.querySelector(".hero__desc");
  if (desc) {
    var wordIndex = 0;
    desc.innerHTML = desc.innerHTML
      .split(/(<br\s*\/?>)/i)
      .map(function (chunk) {
        if (/^<br/i.test(chunk)) return chunk;
        return chunk
          .split(/\s+/)
          .filter(Boolean)
          .map(function (word) {
            var delay = (2.55 + wordIndex++ * 0.06).toFixed(2);
            return '<span class="intro-word" style="animation-delay:' + delay + 's">' + word + "</span>";
          })
          .join(" ");
      })
      .join("");
  }

  /* ---------- Nav: hide on scroll down, show on scroll up ---------- */
  var nav = document.querySelector(".nav");
  var lastScrollY = window.scrollY;
  window.addEventListener("scroll", function () {
    var y = window.scrollY;
    var delta = y - lastScrollY;
    if (Math.abs(delta) < 3) return;
    if (delta > 0 && y > 120) nav.classList.add("is-hidden");
    else nav.classList.remove("is-hidden");
    lastScrollY = y;
  }, { passive: true });

  /* ---------- Fit hero name to its container width ---------- */
  var heroName = document.querySelector(".hero__name");
  var heroTitle = document.querySelector(".hero__title");
  function fitHeroName() {
    if (!heroName || !heroTitle) return;
    heroName.style.fontSize = "100px";
    var scale = heroTitle.clientWidth / heroName.scrollWidth;
    heroName.style.fontSize = Math.floor(100 * scale * 0.995) + "px";
  }
  fitHeroName();
  window.addEventListener("resize", fitHeroName);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitHeroName);

  /* ---------- Make sure autoplay videos actually start ----------
     Some browsers (iOS low-power mode, occasional Chrome loads)
     skip the initial autoplay; retry on load and first interaction */
  function nudgeVideos() {
    document.querySelectorAll("video[autoplay]").forEach(function (v) {
      if (v.paused) {
        var p = v.play();
        if (p) p.catch(function () {});
      }
    });
  }
  window.addEventListener("load", nudgeVideos);
  document.addEventListener("visibilitychange", nudgeVideos);
  ["click", "touchstart", "scroll", "wheel"].forEach(function (evt) {
    window.addEventListener(evt, nudgeVideos, { once: true, passive: true });
  });

  /* ---------- Hero reel: cycle slides every 4s ---------- */
  var slides = document.querySelectorAll(".hero__slide");
  var current = 0;
  if (slides.length > 1) {
    setInterval(function () {
      slides[current].classList.remove("is-active");
      current = (current + 1) % slides.length;
      slides[current].classList.add("is-active");
    }, 4000);
  }

  /* ---------- Horizontal showcase: vertical scroll drives X ---------- */
  var showcase = document.querySelector(".showcase");
  var track = document.querySelector(".showcase__track");
  var cards = document.querySelectorAll(".card");
  var trackX = 0;
  var targetX = 0;

  function sizeShowcase() {
    if (!showcase || !track) return;
    // total horizontal distance the track must travel
    var travel = track.scrollWidth - window.innerWidth / 2 + window.innerWidth * 0.25;
    showcase.style.height = window.innerHeight + travel + "px";
    showcase.dataset.travel = travel;
  }
  sizeShowcase();
  window.addEventListener("resize", sizeShowcase);

  function updateShowcase() {
    if (!showcase || !track) return;
    var rect = showcase.getBoundingClientRect();
    var travel = parseFloat(showcase.dataset.travel || 0);
    var scrollable = showcase.offsetHeight - window.innerHeight;
    var progress = Math.min(Math.max(-rect.top / scrollable, 0), 1);
    targetX = -progress * travel;
  }

  /* ---------- Cursor-following "View project" button ---------- */
  var viewBtn = document.querySelector(".view-btn");
  var mouseX = 0, mouseY = 0, btnX = 0, btnY = 0, btnVisible = false;

  document.addEventListener("mousemove", function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  document.querySelectorAll("[data-cursor]").forEach(function (el) {
    el.addEventListener("mouseenter", function () {
      btnVisible = true;
      btnX = mouseX; btnY = mouseY; // snap to cursor on entry
      viewBtn.textContent = el.getAttribute("data-cursor") || "View project";
      viewBtn.classList.add("is-visible");
    });
    el.addEventListener("mouseleave", function () {
      btnVisible = false;
      viewBtn.classList.remove("is-visible");
    });
    el.addEventListener("click", function () {
      var href = el.getAttribute("data-href");
      if (!href) return;
      if (href.charAt(0) === "#") {
        var target = document.querySelector(href);
        if (target && lenis) lenis.scrollTo(target, { duration: 1.4 });
        else if (target) target.scrollIntoView({ behavior: "smooth" });
      } else {
        window.location.href = href;
      }
    });
  });

  /* ---------- Parallax elements ---------- */
  var parallaxEls = document.querySelectorAll("[data-parallax]");

  /* ---------- Single rAF loop: showcase lerp, button follow, parallax ---------- */
  function loop() {
    // showcase
    updateShowcase();
    trackX += (targetX - trackX) * 0.08;
    if (track) track.style.transform = "translate3d(" + trackX + "px,0,0)";

    // cursor button
    if (viewBtn) {
      btnX += (mouseX - btnX) * (btnVisible ? 0.16 : 1);
      btnY += (mouseY - btnY) * (btnVisible ? 0.16 : 1);
      viewBtn.style.transform =
        "translate(" + (btnX - viewBtn.offsetWidth / 2) + "px," +
        (btnY - viewBtn.offsetHeight / 2) + "px) scale(" + (btnVisible ? 1 : 0.6) + ")";
    }

    // parallax
    var vh = window.innerHeight;
    parallaxEls.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var speed = parseFloat(el.dataset.parallax);
      var prev = parseFloat(el.style.getPropertyValue("--py")) || 0;
      var offset = (r.top - prev + r.height / 2 - vh / 2) * speed;
      el.style.setProperty("--py", offset.toFixed(2) + "px");
    });

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // view-btn uses transform for position; neutralize the CSS centering transition
  if (viewBtn) {
    viewBtn.style.top = "0";
    viewBtn.style.left = "0";
    viewBtn.style.transition = "opacity 0.25s ease";
  }

  /* ---------- Scroll reveals ---------- */
  var revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-inview");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );
  document.querySelectorAll(".reveal, .reveal-img").forEach(function (el) {
    revealObserver.observe(el);
  });

  /* ---------- Stat count-ups ---------- */
  var statObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        statObserver.unobserve(el);
        var end = parseInt(el.dataset.count, 10);
        if (isNaN(end)) return;
        var suffix = el.dataset.suffix || "";
        var start = null;
        var dur = 1600;
        function tick(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(eased * end) + (p === 1 ? suffix : "");
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    },
    { threshold: 0.5 }
  );
  document.querySelectorAll(".stat__num[data-count]").forEach(function (el) {
    statObserver.observe(el);
  });

  /* ---------- Workflow canvas: looping motion-graphics timeline ---------- */
  var canvas = document.querySelector(".canvas");
  if (canvas) {
    var promptText = "Cast Isiah in the Soleil tee. Shoot the campaign in the collage bedroom — warm 35mm film, golden hour, editorial stills.";
    var promptEl = canvas.querySelector(".cprompt__text");
    var stepClasses = ["on-model", "on-product", "on-location", "on-prompt", "on-w1", "on-w2", "on-w3", "on-w4", "on-output", "on-image"];
    var timeline = [
      [300,  "on-model"],
      [1200, "on-product"],
      [2100, "on-location"],
      [3000, "on-prompt"],
      [3600, "on-w1"],
      [4100, "on-w2"],
      [4600, "on-w3"],
      [8300, "on-w4"],
      [9000, "on-output"],
      [10600, "on-image"]
    ];
    var timers = [];
    var typeTimer = null;
    var playing = false;

    function typePrompt() {
      var i = 0;
      typeTimer = setInterval(function () {
        promptEl.textContent = promptText.slice(0, ++i);
        if (i >= promptText.length) clearInterval(typeTimer);
      }, 34);
    }

    function playCanvas() {
      timeline.forEach(function (step) {
        timers.push(setTimeout(function () { canvas.classList.add(step[1]); }, step[0]));
      });
      timers.push(setTimeout(typePrompt, 3300));
      timers.push(setTimeout(resetCanvas, 16000)); // loop
    }

    function resetCanvas() {
      timers.forEach(clearTimeout);
      timers = [];
      if (typeTimer) clearInterval(typeTimer);
      stepClasses.forEach(function (c) { canvas.classList.remove(c); });
      promptEl.textContent = "";
      if (playing) timers.push(setTimeout(playCanvas, 700));
    }

    var canvasObserver = new IntersectionObserver(function (entries) {
      // only the most recent entry matters — batched stale entries
      // (e.g. after a hidden tab becomes visible) must not flip the state
      var entry = entries[entries.length - 1];
      if (entry.isIntersecting && !playing) {
        playing = true;
        canvas.classList.add("is-live");
        playCanvas();
      } else if (!entry.isIntersecting && playing) {
        playing = false;
        canvas.classList.remove("is-live");
        resetCanvas();
      }
    }, { threshold: 0.35 });
    canvasObserver.observe(canvas);
  }

  /* ---------- Selected work: hover previews ---------- */
  var stage = document.querySelector(".works__stage");
  var workLinks = document.querySelectorAll(".works__list a[data-preview]");
  var previewItems = document.querySelectorAll(".works__preview-item");

  workLinks.forEach(function (link) {
    link.addEventListener("mouseenter", function () {
      stage.classList.add("is-previewing");
      link.classList.add("is-hovered");
      var key = link.dataset.preview;
      previewItems.forEach(function (item) {
        item.classList.toggle("is-active", item.dataset.preview === key);
      });
    });
    link.addEventListener("mouseleave", function () {
      stage.classList.remove("is-previewing");
      link.classList.remove("is-hovered");
      previewItems.forEach(function (item) {
        item.classList.remove("is-active");
      });
    });
  });

  /* ---------- Connect page: tier + education CTAs preselect the plan ---------- */
  var planSelect = document.getElementById("rf-plan");
  document.querySelectorAll("a[data-plan]").forEach(function (cta) {
    cta.addEventListener("click", function () {
      if (!planSelect) return;
      var plan = cta.getAttribute("data-plan");
      for (var i = 0; i < planSelect.options.length; i++) {
        if (planSelect.options[i].value === plan) { planSelect.selectedIndex = i; break; }
      }
    });
  });

  /* ---------- Connect page: request form -> mailto ---------- */
  var reqform = document.querySelector(".reqform");
  if (reqform) {
    reqform.addEventListener("submit", function (e) {
      e.preventDefault();
      var required = ["rf-name", "rf-email", "rf-about"];
      var valid = true;
      required.forEach(function (id) {
        var el = document.getElementById(id);
        if (!el.value.trim()) { el.classList.add("is-invalid"); valid = false; }
        else el.classList.remove("is-invalid");
      });
      var email = document.getElementById("rf-email");
      if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        email.classList.add("is-invalid"); valid = false;
      }
      if (!valid) return;

      var g = function (id) { return (document.getElementById(id).value || "").trim(); };
      var name = g("rf-name");
      var body =
        "Name: " + name + "\n" +
        "Email: " + g("rf-email") + "\n" +
        "Industry: " + g("rf-industry") + "\n" +
        "Plan of interest: " + g("rf-plan") + "\n" +
        "About: " + g("rf-about") + "\n\n" +
        "Notes:\n" + (g("rf-notes") || "—") + "\n";
      var mailto =
        "mailto:f.sonnyijeh@gmail.com" +
        "?subject=" + encodeURIComponent("New project request — " + name) +
        "&body=" + encodeURIComponent(body);

      var btn = reqform.querySelector(".reqform__submit");
      btn.textContent = "Opening email…";
      btn.classList.add("is-sent");
      window.location.href = mailto;
      setTimeout(function () { btn.textContent = "Send request"; btn.classList.remove("is-sent"); }, 4000);
    });
  }
})();
