(function () {
  "use strict";
  var $ = function (s, r) {
    return (r || document).querySelector(s);
  };
  var $$ = function (s, r) {
    return [].slice.call((r || document).querySelectorAll(s));
  };

  /* ============ 1. THEME TOGGLE ============ */
  $("#tb").addEventListener("click", function () {
    var d = document.documentElement;
    var dark = d.dataset.theme
      ? d.dataset.theme === "dark"
      : matchMedia("(prefers-color-scheme:dark)").matches;
    d.dataset.theme = dark ? "light" : "dark";
  });

  /* ============ 2. HERO: LETTER REVEAL ============ */
  var h1 = $("h1"),
    n = 0;
  var split = function (s) {
    return s
      .split("")
      .map(function (c) {
        return '<span class="ch" style="--i:' + n++ + '">' + c + "</span>";
      })
      .join("");
  };
  h1.setAttribute("aria-label", "Mirajul");
  h1.innerHTML = split("Miraj") + "<em>" + split("ul") + "</em>";

  /* ============ 3. HERO: TERMINAL ============ */
  var LINES = [
    [
      "POST /analyze",
      "{ url: 'youtu.be/…' }",
      "200 OK · 412ms",
      "summary, topics, timestamps",
    ],
    [
      "POST /embed",
      "{ text: 'chunk_0042' }",
      "200 OK · 86ms",
      "vector[768] stored",
    ],
    ["GET /health", "", "200 OK · 3ms", "models loaded: 2"],
  ];
  var term = $("#t"),
    li = 0;
  function runTerminal() {
    var r = LINES[li++ % LINES.length];
    var full =
      "$ " +
      r[0] +
      "\n" +
      (r[1] ? "  " + r[1] + "\n" : "") +
      "\n→ " +
      r[2] +
      "\n  " +
      r[3];
    var i = 0;
    (function tick() {
      var text = full
        .slice(0, i)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/→ (.*)/, '<span class="ok">→ $1</span>');
      term.innerHTML = text + '<span class="cur"></span>';
      if (i++ < full.length) setTimeout(tick, 22);
      else setTimeout(runTerminal, 2400);
    })();
  }
  runTerminal();

  /* ============ 4. SCROLL RAIL + ACTIVE NAV ============ */
  var rail = $("#rail");
  var navLinks = $$("#nav a");
  var navSecs = navLinks.map(function (a) {
    return $(a.getAttribute("href"));
  });
  function onScroll() {
    var h = document.documentElement;
    rail.style.width =
      (scrollY / Math.max(1, h.scrollHeight - innerHeight)) * 100 + "%";
    var cur = 0;
    navSecs.forEach(function (s, j) {
      if (s.getBoundingClientRect().top < innerHeight * 0.4) cur = j;
    });
    navLinks.forEach(function (a, j) {
      a.classList.toggle("on", j === cur);
    });
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ============ 5. SECTION REVEAL ============ */
  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
  );
  $$(".rv").forEach(function (el) {
    io.observe(el);
  });

  /* ============ 6. PROJECTS (API with fallback) ============ */
  var FALLBACK = [
    {
      title: "Lumen Ai",
      flow: ["URL", "transcribe", "analyze", "UI"],
      description:
        "AI-powered YouTube video and document analysis. Paste a link, get structured insight without watching the whole video.",
      stack: ["Python", "FastAPI", "Hugging Face", "Gemini"],
      metric_label: "status",
      metric: "in development",
      link: "https://github.com/Mirajul100/Ai-video-assistant",
      image: "img/lumen_ai.png",
    },
  ];

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c];
    });
  }
  function safeLink(u) {
    return /^https?:\/\//i.test(u) ? u : "";
  }

  function safeImage(path) {
    return typeof path === "string" && /^img\/[a-z0-9._-]+$/i.test(path)
      ? path
      : "";
  }

  function cardHTML(p) {
    var title = esc(p.title),
      url = safeLink(p.link || ""),
      image = safeImage(p.image);
    var head = url
      ? '<a href="' +
        esc(url) +
        '" target="_blank" rel="noopener">' +
        title +
        " ↗</a>"
      : title;
    return (
      '<article class="card' +
      (image ? " has-image" : "") +
      '">' +
      (image
        ? '<div class="card-image"><img src="' +
          esc(image) +
          '" alt="' +
          title +
          ' preview illustration" loading="lazy"><span>Project preview</span></div>'
        : "") +
      '<div class="card-content">' +
      '<div class="flow">' +
      p.flow
        .map(function (f) {
          return "<span>" + esc(f) + "</span>";
        })
        .join("<b>→</b>") +
      "</div>" +
      "<h3>" +
      head +
      "</h3>" +
      "<p>" +
      esc(p.description) +
      "</p>" +
      '<div class="flow">' +
      p.stack
        .map(function (s) {
          return "<span>" + esc(s) + "</span>";
        })
        .join("") +
      "</div>" +
      '<div class="metric"><span>' +
      esc(p.metric_label) +
      "</span><em>" +
      esc(p.metric) +
      "</em></div>" +
      "</div>" +
      "</article>"
    );
  }

  function bindCards() {
    $$(".card").forEach(function (c, j) {
      c.style.setProperty("--d", j);
      c.addEventListener("pointermove", function (e) {
        var r = c.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5,
          y = (e.clientY - r.top) / r.height - 0.5;
        c.style.setProperty("--x", e.clientX - r.left + "px");
        c.style.setProperty("--y", e.clientY - r.top + "px");
        c.style.transform =
          "perspective(700px) rotateX(" +
          -y * 6 +
          "deg) rotateY(" +
          x * 6 +
          "deg)";
      });
      c.addEventListener("pointerleave", function () {
        c.style.transform = "";
      });
    });
  }

  function render(list) {
    $("#projects").innerHTML = list.map(cardHTML).join("");
    bindCards();
  }

  fetch("/api/projects")
    .then(function (r) {
      if (!r.ok) throw 0;
      return r.json();
    })
    .then(render)
    .catch(function () {
      render(FALLBACK);
    });

  $$(".layers").forEach(function (g) {
    [].forEach.call(g.children, function (c, j) {
      c.style.setProperty("--d", j);
    });
  });

  /* ============ 7. CURSOR GLOW ============ */
  var glow = $("#glow"),
    gx = 0,
    gy = 0,
    tx = 0,
    ty = 0;
  if (matchMedia("(pointer:fine)").matches) {
    addEventListener("pointermove", function (e) {
      tx = e.clientX;
      ty = e.clientY;
    });
    (function loop() {
      gx += (tx - gx) * 0.12;
      gy += (ty - gy) * 0.12;
      glow.style.transform =
        "translate(" + (gx - 210) + "px," + (gy - 210) + "px)";
      requestAnimationFrame(loop);
    })();
  }

  /* ============ 8. CONTACT FORM ============ */
  var form = $("#cf"),
    status = $("#status"),
    send = $("#send");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    status.className = "";
    if (!form.checkValidity()) {
      status.className = "err";
      status.textContent =
        "Check your name, a valid email, and a message of at least 10 characters.";
      return;
    }
    var data = Object.fromEntries(new FormData(form).entries());
    send.disabled = true;
    status.textContent = "Sending…";
    fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then(function (r) {
        if (r.status === 429)
          throw new Error("Too many messages. Try again in an hour.");
        if (!r.ok)
          throw new Error("Couldn't send. Check the fields and try again.");
        form.reset();
        status.className = "good";
        status.textContent = "Sent. I'll reply by email.";
      })
      .catch(function (err) {
        status.className = "err";
        status.textContent =
          err.message ||
          "Couldn't reach the server. Email me directly instead.";
      })
      .then(function () {
        send.disabled = false;
      });
  });

  /* ============ 9. COMMAND PALETTE (⌘K / Ctrl+K) ============ */
  var pal = $("#pal"),
    pi = $("#pi"),
    pl = $("#pl");
  var ITEMS = [
    ["Input", "#top"],
    ["Developer", "#me"],
    ["Process", "#about"],
    ["Layers", "#stack"],
    ["Output / projects", "#work"],
    ["Contact", "#contact"],
  ];
  var sel = 0,
    vis = ITEMS;
  function draw() {
    pl.innerHTML = vis
      .map(function (x, j) {
        return (
          '<li class="' +
          (j === sel ? "sel" : "") +
          '" data-h="' +
          x[1] +
          '">' +
          x[0] +
          "<span>" +
          x[1] +
          "</span></li>"
        );
      })
      .join("");
  }
  function go(h) {
    pal.classList.remove("open");
    location.hash = h;
  }
  function openPal() {
    pal.classList.add("open");
    pi.value = "";
    vis = ITEMS;
    sel = 0;
    draw();
    pi.focus();
  }
  $("#pb").addEventListener("click", openPal);
  pal.addEventListener("click", function (e) {
    if (e.target === pal) pal.classList.remove("open");
    var item = e.target.closest("li");
    if (item) go(item.dataset.h);
  });
  pi.addEventListener("input", function () {
    var q = pi.value.toLowerCase();
    vis = ITEMS.filter(function (x) {
      return x[0].toLowerCase().indexOf(q) > -1;
    });
    sel = 0;
    draw();
  });
  addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      openPal();
      return;
    }
    if (!pal.classList.contains("open")) return;
    if (e.key === "Escape") pal.classList.remove("open");
    if (e.key === "ArrowDown") {
      sel = Math.min(sel + 1, vis.length - 1);
      draw();
      e.preventDefault();
    }
    if (e.key === "ArrowUp") {
      sel = Math.max(sel - 1, 0);
      draw();
      e.preventDefault();
    }
    if (e.key === "Enter" && vis[sel]) go(vis[sel][1]);
  });
})();
