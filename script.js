const cfg = window.INVITE;
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

// Имя из ссылки ?name=... имеет приоритет над конфигом
const params = new URLSearchParams(location.search);
const friendName = params.get("name") || cfg.friendName;
$$("[data-name]").forEach((el) => (el.textContent = friendName));

const state = { activities: new Set(), wish: "" };

/* ---------- Фото-страницы ---------- */
$("#s-places").insertAdjacentHTML(
  "beforebegin",
  cfg.stories
    .map(
      (s, i) => `<section class="screen story">
        <figure class="polaroid-main${s.polaroid ? " has-polaroid" : ""}" style="transform: rotate(${i % 2 ? 1.6 : -1.6}deg)">
          <div class="frame">
            <img src="${s.photo}" alt="${s.title}" />
            ${
              s.polaroid
                ? `<div class="polaroid"><img src="${s.polaroid.photo}" alt="" /><span>${s.polaroid.caption}</span></div>`
                : ""
            }
          </div>
          <figcaption>
            <span>${s.kicker}</span>
            <span class="credit">фото: ${[s, s.polaroid, ...(s.extras || [])]
              .filter(Boolean)
              .map((p) => `<a href="${p.source}" target="_blank" rel="noopener">${p.credit}</a>`)
              .join(" · ")}</span>
          </figcaption>
          ${(s.extras || [])
            .map(
              (p, j) => `<div class="extra extra-${j + 1}"><img src="${p.photo}" alt="" loading="lazy" /><span>${p.caption}</span></div>`,
            )
            .join("")}
        </figure>
        <h2>${s.title}</h2>
        <p class="story-text">${s.text}</p>
        <div class="facts">${s.facts.map((f) => `<span>${f}</span>`).join("")}</div>
        <div class="choice">
          <button class="btn btn-primary" data-next>Да</button>
          <button class="btn btn-no phantom" data-no='${JSON.stringify(s.no || [])}'${s.flee ? " data-flee=1" : ""}${s.shrink ? " data-shrink=1" : ""}${s.scatter ? " data-scatter=1" : ""}${s.zombie ? " data-zombie=1" : ""}${s.sink ? " data-sink=1" : ""}>Нет</button>
        </div>
      </section>`,
    )
    .join(""),
);

/* ---------- Навигация ---------- */
const screens = $$(".screen");
const route = $("#route");
const routePlane = $("#routePlane");
let cur = 0;
let maxVisited = 0;

// Точки маршрута сверху — переход на любую уже открытую страницу
screens.forEach((_, i) => {
  const dot = document.createElement("i");
  dot.addEventListener("click", () => i <= maxVisited && go(i));
  route.appendChild(dot);
});

// target — индекс экрана или id секции
function go(target) {
  const idx = typeof target === "number" ? target : screens.findIndex((s) => s.id === target);
  const dir = idx >= cur ? "slide-fwd" : "slide-back";
  cur = idx;
  maxVisited = Math.max(maxVisited, idx);
  screens.forEach((s, i) => {
    s.classList.remove("slide-fwd", "slide-back");
    s.style.animation = "";
    s.classList.toggle("active", i === idx);
  });
  void screens[idx].offsetWidth; // перезапуск анимации
  screens[idx].classList.add(dir);
  $$("#route i").forEach((d, i) => {
    d.classList.toggle("on", i <= idx);
    d.classList.toggle("visited", i <= maxVisited);
  });
  routePlane.style.left = `${(idx / (screens.length - 1)) * 100}%`;
  window.scrollTo({ top: 0, behavior: "smooth" });
}
$$("[data-next]").forEach((b) =>
  b.addEventListener("click", () => go(screens.indexOf(b.closest(".screen")) + 1)),
);
// После анимации появления снимаем её: иначе на элементе остаётся transform,
// и position: fixed у убегающих кнопок считается от секции, а не от окна
document.addEventListener("animationend", (e) => {
  if (/^slide-/.test(e.animationName)) e.target.style.animation = "none";
});
go(0);

// Свайпы: влево — «дальше» (если на экране есть такая кнопка), вправо — назад
{
  let sx = 0, sy = 0, tracking = false;
  const app = $("#app");
  app.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".wall, input, button, .map-card, .route")) return;
    sx = e.clientX; sy = e.clientY; tracking = true;
  });
  app.addEventListener("pointerup", (e) => {
    if (!tracking) return;
    tracking = false;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) < 60 || Math.abs(dy) > 60) return;
    if (dx < 0) screens[cur].querySelector("[data-next]")?.click();
    else if (cur >= 1) go(cur - 1);
  });
}

/* ---------- Даты ---------- */
const months = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
const fmt = (iso) => {
  const d = new Date(iso + "T00:00:00");
  return `${d.getDate()} ${months[d.getMonth()]}`;
};

$("#whenLine").textContent = cfg.departDate
  ? `${fmt(cfg.departDate)}${cfg.returnDate ? " — " + fmt(cfg.returnDate) : ""}`
  : "Чтобы в начале октября быть уже там";

/* ---------- 0. Карта с полётом ---------- */
{
  // Карта в равнопромежуточной проекции 800×400: x = долгота, y = широта
  const P = (lat, lon) => [((lon + 180) / 360) * 800, ((90 - lat) / 180) * 400];
  const [x1, y1] = P(...cfg.fromCoords);
  const [x2, y2] = P(37.57, 126.98); // Сеул
  const cx = (x1 + x2) / 2;
  const cy = Math.min(y1, y2) - Math.hypot(x2 - x1, y2 - y1) * 0.18;
  const d = `M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}`;

  const svg = $("#mapSvg");
  const trail = $("#trail");
  const reveal = $("#trailReveal");
  const plane = $("#plane");
  trail.setAttribute("d", d);
  reveal.setAttribute("d", d);

  // Кадр карты: маршрут с полями, пропорция 16:10
  const pad = 26;
  const minX = Math.min(x1, x2) - pad;
  const w = Math.max(x1, x2) + pad - minX;
  const h = w / 1.6;
  const minY = Math.max(0, Math.min(cy, y1, y2) - 10);
  svg.setAttribute("viewBox", `${minX} ${minY} ${w} ${h}`);

  $("#pinFrom").setAttribute("transform", `translate(${x1} ${y1})`);
  $("#pinFromLabel").textContent = cfg.fromCity;
  $("#routeSticker").textContent = `${cfg.fromCode} → ICN`;

  const len = trail.getTotalLength();
  const at = (t) => trail.getPointAtLength(t * len);
  function placePlane(t) {
    const p = at(t);
    const q = at(Math.min(1, t + 0.01));
    const a = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI + 90;
    plane.setAttribute("transform", `translate(${p.x} ${p.y}) rotate(${a})`);
  }
  placePlane(0);

  let flying = false;
  function takeoff() {
    if (flying) return;
    flying = true;
    $("#mapCard").classList.add("flying");
    const T = 2400;
    const t0 = performance.now();
    (function frame(now) {
      const t = Math.min(1, (now - t0) / T);
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // easeInOut
      placePlane(e);
      reveal.setAttribute("stroke-dashoffset", 100 - e * 100);
      if (t < 1) requestAnimationFrame(frame);
      else
        setTimeout(() => {
          $("#mapHint").hidden = true;
          const q = $("#question");
          q.hidden = false;
          q.scrollIntoView({ behavior: "smooth", block: "end" });
        }, 400);
    })(t0);
  }
  $("#mapCard").addEventListener("click", takeoff);
}

/* ---------- 1. Да / Нет ---------- */
const yesBtn = $("#yesBtn");
const noSlot = $("#noSlot");
const btnRow = $("#btnRow");
const noHint = $("#noHint");
let noBtn = $("#noBtn");
let clones = [];

// Цепочка трюков: каждое следующее нажатие на «Нет» — новый фокус
const tricks = [
  { do: dodge, text: "Точно нет?", hint: "Эта кнопка стесняется" },
  { do: dodge, text: "Подумай ещё 🥺", hint: "Кажется, она за «да»" },
  { do: swap, text: "Хм…", hint: "Кнопки поменялись местами. Случайно" },
  { do: grow, text: "Не сейчас", hint: "«Да» растёт, когда на неё смотрят" },
  { do: multiply, text: "нет", hint: "Ой. Кажется, «да» размножилось" },
  { do: fly, text: "", hint: "" },
];
let step = 0;

function trick(e) {
  e.preventDefault();
  const t = tricks[step];
  if (!t) return;
  step++;
  t.do();
  if (t.text) noBtn.textContent = t.text;
  noHint.textContent = t.hint;
}

// Когда «Нет» отрывается от строки (position: fixed), на её месте остаётся
// невидимая заглушка того же размера — иначе «Да» растягивается и дёргается.
function holdPlace(btn) {
  if (btn._ghost || !btn.closest(".choice")) return;
  const g = document.createElement("span");
  g.className = "ghost";
  g.style.width = `${btn.offsetWidth}px`;
  g.style.height = `${btn.offsetHeight}px`;
  btn.before(g);
  btn._ghost = g;
}
function releasePlace(btn) {
  btn._ghost?.remove();
  btn._ghost = null;
}

// Кнопка el перескакивает в случайное место, не накрывая avoid
function dodgeEl(el, avoid) {
  if (!el.classList.contains("dodging")) holdPlace(el);
  const { width, height } = el.getBoundingClientRect();
  const yes = avoid.getBoundingClientRect();
  const pad = 16;
  const maxX = window.innerWidth - width - pad;
  const maxY = window.innerHeight - height - pad;
  let x, y;
  for (let i = 0; i < 20; i++) {
    x = pad + Math.random() * (maxX - pad);
    y = pad + Math.random() * (maxY - pad);
    const overlaps = x < yes.right + 12 && x + width > yes.left - 12 && y < yes.bottom + 12 && y + height > yes.top - 12;
    if (!overlaps) break;
  }
  el.classList.add("dodging");
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
}
function dodge() {
  dodgeEl(noBtn, yesBtn);
}

function swap() {
  noBtn.classList.remove("dodging");
  noBtn.style.left = noBtn.style.top = "";
  btnRow.classList.add("swapped");
  [yesBtn, noBtn].forEach((b) => {
    b.classList.add("bounce");
    setTimeout(() => b.classList.remove("bounce"), 500);
  });
}

function grow() {
  yesBtn.style.transform = "scale(1.5)";
  noBtn.style.transform = "scale(0.7)";
}

function multiply() {
  // «Нет» — в угол и крошечная
  noBtn.classList.add("tiny");
  noBtn.style.transform = "";
  noBtn.style.left = "10px";
  noBtn.style.top = `${window.innerHeight - 70}px`;
  yesBtn.style.transform = "scale(1.6)";
  // и ещё пять «Да»
  const spots = [
    [0.12, 0.14], [0.7, 0.12], [0.15, 0.78], [0.72, 0.8], [0.45, 0.32],
  ];
  spots.forEach(([fx, fy], i) => {
    const c = document.createElement("button");
    c.className = "btn btn-primary yes-clone";
    c.textContent = ["Да!", "Да", "Конечно", "Да-да", "Полетели"][i];
    c.style.left = `${fx * (window.innerWidth - 120)}px`;
    c.style.top = `${fy * (window.innerHeight - 60)}px`;
    c.style.animationDelay = `${i * 0.08}s`;
    c.addEventListener("click", sayYes);
    document.body.appendChild(c);
    clones.push(c);
  });
}

function fly() {
  // «Нет» цепляется за самолёт и улетает
  const r = noBtn.getBoundingClientRect();
  const planeEl = document.createElement("div");
  planeEl.className = "fly-plane";
  planeEl.textContent = "✈️";
  planeEl.style.left = `${r.left - 34}px`;
  planeEl.style.top = `${r.top - 6}px`;
  document.body.appendChild(planeEl);
  noBtn.classList.add("flying");
  requestAnimationFrame(() => {
    const dx = window.innerWidth + 200 - r.left;
    planeEl.style.transform = `translate(${dx}px, -${r.top * 0.6}px) rotate(-15deg)`;
    noBtn.style.transform = `translate(${dx}px, -${r.top * 0.6}px) rotate(-15deg) scale(0.42)`;
  });
  clones.forEach((c) => c.remove());
  clones = [];
  yesBtn.style.transform = "scale(1.15)";
  setTimeout(() => {
    planeEl.remove();
    noBtn.remove();
    noSlot.innerHTML = `<span class="tag">«Нет» улетело в Сеул ✈️</span>`;
    noBtn = document.createElement("button");
    noBtn.className = "btn btn-no";
    noBtn.textContent = "Ладно, да 🙈";
    noBtn.addEventListener("click", sayYes);
    noSlot.appendChild(noBtn);
    noHint.textContent = "Присоединишься?";
  }, 1400);
}

/* ---------- Отодвигание от курсора (ПК) ---------- */
// Пока курсор ближе R px, кнопка плавно отодвигается в противоположную сторону.
// Никаких прыжков: у края экрана скользит вдоль него, а когда курсор совсем
// близко — перестаёт ловить клики, чтобы её нельзя было нажать даже в углу.
// Двигается покадрово: пока курсор ближе R px от края, кнопка каждый кадр
// отодвигается — даже если мышь замерла. У края экрана скользит вдоль него.
// Если зажали в углу — делает рывок вдоль стены на другой её конец, а рядом
// с курсором вообще не ловит клики, так что нажать её нельзя нигде.
function makeFleer(btn) {
  const R = 28; // за сколько px от края кнопки она начинает отодвигаться
  const SAFE = R + 12; // до какого расстояния убегает, начав движение
  let cursor = null;
  let x, y, raf = 0, dashing = false;

  const onMove = (e) => e.pointerType === "mouse" && (cursor = [e.clientX, e.clientY]);
  document.addEventListener("pointermove", onMove);

  function frame() {
    raf = requestAnimationFrame(frame);
    if (!cursor || dashing || !btn.isConnected) return;
    const r = btn.getBoundingClientRect();
    if (!r.width) return; // страница скрыта
    // расстояние от курсора до ближайшего края кнопки (0 — курсор над ней)
    const ex = cursor[0] - Math.max(r.left, Math.min(r.right, cursor[0]));
    const ey = cursor[1] - Math.max(r.top, Math.min(r.bottom, cursor[1]));
    const edge = Math.hypot(ex, ey);
    btn.style.pointerEvents = edge < 40 ? "none" : "";
    if (edge > (x === undefined ? R : SAFE)) return;
    if (x === undefined) {
      x = r.left;
      y = r.top;
      holdPlace(btn);
      btn.classList.add("fleeing");
    }
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let dx = cx - cursor[0];
    let dy = cy - cursor[1];
    const d = Math.hypot(dx, dy) || 1;
    const ux = dx / d;
    const uy = dy / d;
    const speed = 5 + ((SAFE - edge) / SAFE) * 9; // px за кадр: чем ближе, тем быстрее
    let nx = x + ux * speed;
    let ny = y + uy * speed;
    const pad = 12;
    const maxX = innerWidth - r.width - pad;
    const maxY = innerHeight - r.height - pad;
    // упёрлась в край — скользит вдоль него, прочь от курсора
    if (nx < pad || nx > maxX) ny += Math.sign(uy || 1) * speed;
    if (ny < pad || ny > maxY) nx += Math.sign(ux || 1) * speed;
    nx = Math.max(pad, Math.min(maxX, nx));
    ny = Math.max(pad, Math.min(maxY, ny));
    if (Math.hypot(nx - x, ny - y) < 0.5) return dash(r, pad, maxX, maxY);
    x = nx;
    y = ny;
    btn.style.left = `${x}px`;
    btn.style.top = `${y}px`;
    btn.style.setProperty("--tilt", `${-ux * 6}deg`);
  }
  raf = requestAnimationFrame(frame);

  // Зажали в углу: рывок вдоль более длинной стены на её другой конец
  function dash(r, pad, maxX, maxY) {
    dashing = true;
    btn.classList.add("dash");
    btn.style.pointerEvents = "none";
    if (innerWidth - r.width > innerHeight - r.height) x = x < innerWidth / 2 ? maxX : pad;
    else y = y < innerHeight / 2 ? maxY : pad;
    btn.style.left = `${x}px`;
    btn.style.top = `${y}px`;
    setTimeout(() => {
      btn.classList.remove("dash");
      dashing = false;
    }, 480);
  }

  const reset = () => {
    btn.classList.remove("fleeing", "dash");
    btn.style.left = btn.style.top = btn.style.pointerEvents = "";
    btn.style.removeProperty("--tilt");
    releasePlace(btn);
    x = y = undefined;
    dashing = false;
  };
  return {
    reset,
    stop() {
      cancelAnimationFrame(raf);
      document.removeEventListener("pointermove", onMove);
      reset();
    },
  };
}

function bindNo() {
  noBtn.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && trick(e));
  noBtn.addEventListener("pointerdown", trick);
  // клик с клавиатуры (detail === 0); обычный клик уже обработан в pointerdown
  noBtn.addEventListener("click", (e) => e.detail === 0 && trick(e));
}
bindNo();
yesBtn.addEventListener("click", sayYes);

function sayYes() {
  clones.forEach((c) => c.remove());
  clones = [];
  $$(".fly-plane").forEach((p) => p.remove());
  noBtn.remove();
  yesBtn.style.transform = "";
  burst();
  setTimeout(() => go(screens.indexOf($("#s-map")) + 1), 700);
}

/* ---------- Сжатие при приближении курсора (ПК) ---------- */
// Дальше R px от края — обычный размер; чем ближе, тем меньше, у самой кнопки —
// пара пикселей. Кнопка стоит на месте, но нажать её нельзя.
function makeShrinker(btn) {
  const R = 220;
  const MIN = 0.03; // ≈2 px при ширине 70
  function move(e) {
    if (e.pointerType !== "mouse" || !btn.isConnected) return;
    const r = btn.getBoundingClientRect();
    if (!r.width) return; // страница скрыта
    // расстояние считаем от исходного (несжатого) прямоугольника, иначе кнопка «дрожит»
    const w = btn.offsetWidth, h = btn.offsetHeight;
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const ex = e.clientX - Math.max(cx - w / 2, Math.min(cx + w / 2, e.clientX));
    const ey = e.clientY - Math.max(cy - h / 2, Math.min(cy + h / 2, e.clientY));
    const edge = Math.hypot(ex, ey);
    const t = Math.min(1, edge / R);
    const s = MIN + (1 - MIN) * t * t; // сжимается всё быстрее к концу
    btn.classList.add("shrinking");
    btn.style.transform = `scale(${s})`;
    btn.style.pointerEvents = s < 0.35 ? "none" : "";
  }
  document.addEventListener("pointermove", move);
  const reset = () => {
    btn.classList.remove("shrinking");
    btn.style.transform = btn.style.pointerEvents = "";
  };
  return {
    reset,
    stop() {
      document.removeEventListener("pointermove", move);
      reset();
    },
  };
}

/* ---------- Буквы разлетаются по странице ---------- */
// Текст кнопки режется на буквы. При наведении каждая буква улетает в случайную
// точку экрана (со своим вращением), через HOLD мс все медленно возвращаются.
// Навёл снова — разлетаются заново, уже в другие места.
function makeScatter(btn) {
  const HOLD = 1000; // сколько висят по странице
  const chars = [...btn.textContent];
  btn.textContent = "";
  const letters = chars.map((ch) => {
    const sp = document.createElement("span");
    sp.className = "l";
    sp.textContent = ch;
    btn.appendChild(sp);
    return sp;
  });
  let state = "home"; // home | away | returning
  let timer = 0;

  function scatter() {
    if (state === "away" || !btn.isConnected) return;
    clearTimeout(timer);
    state = "away";
    btn.classList.remove("returning");
    btn.classList.add("scattered");
    btn.style.pointerEvents = "none";
    const pad = 40;
    letters.forEach((sp) => {
      const r = sp.getBoundingClientRect();
      // буква могла ещё возвращаться — считаем от её места в покое
      const rest = restRect(sp);
      const tx = pad + Math.random() * (innerWidth - pad * 2) - (rest.left + rest.width / 2);
      const ty = pad + Math.random() * (innerHeight - pad * 2) - (rest.top + rest.height / 2);
      const rot = (Math.random() - 0.5) * 1440;
      sp.style.transform = `translate(${tx}px, ${ty}px) rotate(${rot}deg)`;
      void r;
    });
    timer = setTimeout(comeBack, HOLD);
  }

  // прямоугольник буквы без transform
  function restRect(sp) {
    const t = sp.style.transform;
    sp.style.transition = "none";
    sp.style.transform = "";
    const r = sp.getBoundingClientRect();
    sp.style.transform = t;
    void sp.offsetWidth;
    sp.style.transition = "";
    return r;
  }

  function comeBack() {
    if (state !== "away") return;
    state = "returning";
    btn.classList.remove("scattered");
    btn.classList.add("returning");
    btn.style.pointerEvents = "";
    letters.forEach((sp) => (sp.style.transform = ""));
    timer = setTimeout(() => {
      if (state === "returning") {
        state = "home";
        btn.classList.remove("returning");
      }
    }, 1500);
  }

  btn.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && scatter());
  btn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    scatter();
  });

  const reset = () => {
    clearTimeout(timer);
    state = "home";
    letters.forEach((sp) => (sp.style.transform = ""));
    btn.classList.remove("scattered", "returning");
    btn.style.pointerEvents = "";
  };
  return { reset, stop: reset };
}

/* ---------- Зомби (Пусан) ---------- */
// Курсор ближе R px — кнопка отрывается от строки и ковыляет К курсору рывками,
// покачиваясь. Убежать от неё легко, зомби медленный. Но если дать себя догнать —
// кнопка «кусает»: вспыхивает красным и навсегда превращается в «Да».
function makeZombie(btn, primary) {
  const R = 320;
  const STEP = 34;
  let cursor = null;
  let x, y;
  let lastStep = 0;
  let raf = 0;
  let bitten = false;

  const onMove = (e) => e.pointerType === "mouse" && (cursor = [e.clientX, e.clientY]);
  document.addEventListener("pointermove", onMove);

  function tick(now) {
    raf = requestAnimationFrame(tick);
    if (!cursor || bitten || !btn.isConnected) return;
    const r = btn.getBoundingClientRect();
    if (!r.width) return; // страница скрыта
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = cursor[0] - cx;
    const dy = cursor[1] - cy;
    const d = Math.hypot(dx, dy);
    if (d > R) {
      btn.classList.remove("hunting");
      return;
    }
    if (x === undefined) {
      x = r.left;
      y = r.top;
      holdPlace(btn);
      btn.classList.add("zombie");
    }
    btn.classList.add("hunting");
    // укус: курсор внутри кнопки
    if (Math.abs(dx) < r.width / 2 && Math.abs(dy) < r.height / 2) return bite();
    if (now - lastStep < 420) return;
    lastStep = now;
    const step = Math.min(STEP, d);
    x += (dx / d) * step;
    y += (dy / d) * step;
    const pad = 8;
    x = Math.max(pad, Math.min(innerWidth - r.width - pad, x));
    y = Math.max(pad, Math.min(innerHeight - r.height - pad, y));
    btn.style.left = `${x}px`;
    btn.style.top = `${y}px`;
    btn.style.setProperty("--lurch", `${(Math.random() < 0.5 ? -1 : 1) * (6 + Math.random() * 8)}deg`);
    btn.textContent = ["Н-е-е-ет", "Нееет…", "Н-е-т"][(Math.random() * 3) | 0];
  }
  raf = requestAnimationFrame(tick);

  function bite() {
    bitten = true;
    btn.classList.remove("hunting");
    btn.classList.add("bitten");
    btn.textContent = "🧟 Кусь";
    btn.style.pointerEvents = "none";
    setTimeout(() => {
      btn.classList.remove("zombie", "bitten", "btn-no");
      btn.classList.add("gaveup", "btn-primary");
      btn.style.left = btn.style.top = btn.style.pointerEvents = "";
      releasePlace(btn);
      btn.textContent = "Теперь тоже Да";
    }, 900);
  }
  btn.addEventListener("click", () => btn.classList.contains("gaveup") && primary.click());
  btn.addEventListener("pointerdown", (e) => e.pointerType !== "mouse" && !bitten && (e.preventDefault(), bite()));

  const reset = () => {
    if (bitten) return;
    btn.classList.remove("zombie", "hunting");
    btn.style.left = btn.style.top = "";
    releasePlace(btn);
    btn.textContent = "Нет";
    x = y = undefined;
  };
  return {
    reset,
    stop() {
      cancelAnimationFrame(raf);
      document.removeEventListener("pointermove", onMove);
      reset();
    },
  };
}

/* ---------- Тонет в море (капсула) ---------- */
// Кнопку оборачиваем в «море». Чем ближе курсор (в радиусе R от края), тем
// выше поднимается вода и тем глубже уходит кнопка — синеет, пускает пузыри.
// Под водой клик не ловится. Курсор ушёл — всплывает.
function makeSink(btn) {
  const R = 160;
  const sea = document.createElement("span");
  sea.className = "sea";
  btn.before(sea);
  sea.appendChild(btn);
  let depth = 0;
  let bubbleTimer = 0;

  function move(e) {
    if (e.pointerType !== "mouse" || !btn.isConnected) return;
    const r = sea.getBoundingClientRect();
    if (!r.width) return; // страница скрыта
    const ex = e.clientX - Math.max(r.left, Math.min(r.right, e.clientX));
    const ey = e.clientY - Math.max(r.top, Math.min(r.bottom, e.clientY));
    const edge = Math.hypot(ex, ey);
    const p = Math.max(0, Math.min(1, (R - edge) / R));
    depth = p * p; // медленно у поверхности, быстро у дна
    sea.style.setProperty("--depth", depth);
    sea.classList.toggle("under", depth > 0.45);
    btn.style.pointerEvents = depth > 0.3 ? "none" : "";
  }
  document.addEventListener("pointermove", move);

  // пузырьки, пока кнопка под водой
  bubbleTimer = setInterval(() => {
    if (depth < 0.45 || !sea.isConnected || !sea.getBoundingClientRect().width) return;
    const b = document.createElement("i");
    b.className = "bubble";
    b.style.left = `${15 + Math.random() * 70}%`;
    b.style.setProperty("--s", `${4 + Math.random() * 6}px`);
    sea.appendChild(b);
    setTimeout(() => b.remove(), 1300);
  }, 260);

  const reset = () => {
    depth = 0;
    sea.style.setProperty("--depth", 0);
    sea.classList.remove("under");
    btn.style.pointerEvents = "";
  };
  return {
    reset,
    stop() {
      document.removeEventListener("pointermove", move);
      clearInterval(bubbleTimer);
      reset();
    },
  };
}

/* ---------- Откусывают (Сеул, стритфуд) ---------- */
// Каждое наведение или нажатие — укус с той стороны, где курсор: в кнопке
// появляется полукруглая дыра (mask), летят крошки и «ням!». После BITES
// укусов кнопка съедена — остаётся шпажка.
function makeBite(btn) {
  const BITES = 4;
  const holes = [];
  let bites = 0;
  let lastBite = 0;

  // Форма после укусов: скруглённый прямоугольник кнопки минус «зубчатые»
  // круги укусов (clip-path с правилом evenodd — круги становятся дырами)
  function applyShape() {
    const w = btn.offsetWidth, h = btn.offsetHeight, rr = 14;
    let d = `M${rr} 0 H${w - rr} A${rr} ${rr} 0 0 1 ${w} ${rr} V${h - rr} A${rr} ${rr} 0 0 1 ${w - rr} ${h} H${rr} A${rr} ${rr} 0 0 1 0 ${h - rr} V${rr} A${rr} ${rr} 0 0 1 ${rr} 0 Z`;
    for (const { x, y, rad, seed } of holes) {
      const pts = [];
      for (let i = 0; i < 48; i++) {
        const a = (i / 48) * Math.PI * 2;
        const rr2 = rad * (1 + 0.1 * Math.sin(a * 9 + seed)); // следы зубов
        pts.push(`${(x + Math.cos(a) * rr2).toFixed(1)} ${(y + Math.sin(a) * rr2).toFixed(1)}`);
      }
      d += ` M${pts[0]} L${pts.slice(1).join(" L")} Z`;
    }
    btn.style.clipPath = `path(evenodd, "${d}")`;
  }

  function bite(e) {
    if (btn.classList.contains("eaten") || performance.now() - lastBite < 220) return;
    const r = btn.getBoundingClientRect();
    // точка укуса — ближайшая к курсору точка края кнопки
    let x = Math.max(r.left, Math.min(r.right, e.clientX)) - r.left;
    let y = Math.max(r.top, Math.min(r.bottom, e.clientY)) - r.top;
    const rad = 18 + Math.random() * 6;
    lastBite = performance.now();
    bites++;
    // Дыры не должны пересекаться (evenodd «зальёт» пересечение): если новый укус
    // попал в старую дыру — она просто становится больше и сдвигается к курсору
    const hit = holes.find((o) => Math.hypot(o.x - x, o.y - y) < o.rad + rad - 4);
    if (hit) {
      hit.rad = Math.min(hit.rad + 7, 36);
      hit.x = (hit.x * 2 + x) / 3;
      hit.y = (hit.y * 2 + y) / 3;
      // разросшаяся дыра задела соседнюю — сливаем их в одну
      const other = holes.find((o) => o !== hit && Math.hypot(o.x - hit.x, o.y - hit.y) < o.rad + hit.rad);
      if (other) {
        hit.x = (hit.x + other.x) / 2;
        hit.y = (hit.y + other.y) / 2;
        hit.rad = Math.max(hit.rad, other.rad) + 5;
        holes.splice(holes.indexOf(other), 1);
      }
    } else holes.push({ x, y, rad, seed: Math.random() * 6 });
    applyShape();
    btn.classList.add("bitten");
    btn.classList.remove("chomp");
    void btn.offsetWidth;
    btn.classList.add("chomp");
    crumbs(r.left + x, r.top + y);

    if (bites >= BITES) {
      btn.classList.add("eaten");
      btn.style.pointerEvents = "none";
      setTimeout(() => {
        btn.style.clipPath = "";
        btn.textContent = "🍢";
        btn.title = "съедено";
      }, 300);
    }
  }

  function crumbs(x, y) {
    const yum = document.createElement("span");
    yum.className = "yum";
    yum.textContent = ["ням!", "хрум", "ам!", "вкусно"][bites % 4];
    yum.style.left = `${x}px`;
    yum.style.top = `${y - 10}px`;
    document.body.appendChild(yum);
    setTimeout(() => yum.remove(), 900);
    for (let i = 0; i < 5; i++) {
      const c = document.createElement("i");
      c.className = "crumb";
      c.style.left = `${x}px`;
      c.style.top = `${y}px`;
      c.style.setProperty("--dx", `${(Math.random() - 0.5) * 60}px`);
      c.style.setProperty("--dy", `${20 + Math.random() * 40}px`);
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 800);
    }
  }

  // кусает при наведении и дальше — пока курсор водят по кнопке (не чаще раза в 220 мс)
  btn.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && bite(e));
  btn.addEventListener("pointermove", (e) => e.pointerType === "mouse" && bite(e));
  btn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    bite(e);
  });
  btn.addEventListener("click", (e) => e.preventDefault());

  const reset = () => {}; // съеденное не возвращается
  return { reset, stop: reset };
}

/* ---------- Фантомное «Нет» на остальных страницах ---------- */
// Убегает столько раз, сколько реплик минус одна; последняя реплика — сдаётся
// и работает как основная кнопка рядом.
$$(".phantom").forEach((btn) => {
  const texts = JSON.parse(btn.dataset.no || "[]");
  const mode = ["flee", "shrink", "scatter", "zombie", "sink", "bite"].find((m) => btn.dataset[m]);
  if (!texts.length && !mode) return;
  const primary = btn.closest(".choice").querySelector(".btn-primary");

  // Страница с flee: кнопка только уплывает от курсора — без реплик, нажать нельзя
  if (btn.dataset.flee) {
    btn._fleer = makeFleer(btn);
    btn.addEventListener("pointerdown", (e) => e.pointerType !== "mouse" && (e.preventDefault(), dodgeEl(btn, primary)));
    return;
  }
  // Страница с scatter: буквы разлетаются от курсора
  if (btn.dataset.scatter) {
    btn._fleer = makeScatter(btn);
    return;
  }
  // Пусан: зомби-кнопка ковыляет к курсору
  if (btn.dataset.zombie) {
    btn._fleer = makeZombie(btn, primary);
    return;
  }
  // Сеул: кнопку откусывают
  if (btn.dataset.bite) {
    btn._fleer = makeBite(btn);
    return;
  }
  // Капсула: тонет в море при приближении курсора
  if (btn.dataset.sink) {
    btn._fleer = makeSink(btn);
    return;
  }
  // Страница с shrink: чем ближе курсор, тем меньше кнопка
  if (btn.dataset.shrink) {
    btn._fleer = makeShrinker(btn);
    btn.addEventListener("pointerdown", (e) => e.pointerType !== "mouse" && (e.preventDefault(), dodgeEl(btn, primary)));
    return;
  }

  let n = 0;
  const handler = (e) => {
    if (btn.classList.contains("gaveup")) return;
    e.preventDefault();
    if (n < texts.length - 1) {
      dodgeEl(btn, primary); // сначала — чтобы заглушка сняла размер ещё с «Нет»
      btn.textContent = texts[n++];
    } else {
      btn.classList.remove("dodging", "btn-no");
      btn.classList.add("gaveup", "btn-primary");
      btn.style.left = btn.style.top = "";
      releasePlace(btn);
      btn.textContent = texts.at(-1);
    }
  };
  btn.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && handler(e));
  btn.addEventListener("pointerdown", handler);
  btn.addEventListener("click", (e) => {
    if (btn.classList.contains("gaveup")) primary.click();
    else if (e.detail === 0) handler(e);
  });
});
// При смене страницы возвращаем убежавшие кнопки в строку
const _go = go;
go = function (target) {
  $$(".phantom.dodging, .phantom.fleeing, .phantom.shrinking, .phantom.scattered, .phantom.returning, .phantom.zombie").forEach((b) => {
    b.classList.remove("dodging");
    b.style.left = b.style.top = "";
    releasePlace(b);
    b._fleer?.reset();
  });
  return _go(target);
};

/* ---------- Места ---------- */
$("#placeCards").innerHTML = cfg.places
  .map(
    (p) => `<article class="card">
      <div class="e" style="background:${p.bg}"><img src="${p.photo}" alt="${p.title}" loading="lazy" /><a class="card-credit" href="${p.source}" target="_blank" rel="noopener">${p.credit}</a></div>
      <h3>${p.emoji} ${p.title}</h3><p>${p.text}</p></article>`,
  )
  .join("");

/* ---------- Занятия ---------- */
const toTicket = $("#toTicket");
const refreshReady = () => (toTicket.disabled = state.activities.size === 0 && !state.wish);

cfg.activities.forEach((a) => {
  const chip = document.createElement("button");
  chip.className = "chip";
  chip.textContent = a;
  chip.addEventListener("click", () => {
    chip.classList.toggle("on") ? state.activities.add(a) : state.activities.delete(a);
    refreshReady();
  });
  $("#chips").appendChild(chip);
});
$("#wishInput").addEventListener("input", (e) => {
  state.wish = e.target.value.trim();
  refreshReady();
});
toTicket.addEventListener("click", () => {
  fillTicket();
  go("s-ticket");
  setTimeout(burst, 300);
});

/* ---------- Талон ---------- */
function fillTicket() {
  const list = [...state.activities].map((a) => a.replace(/^\S+\s/, ""));
  if (state.wish) list.push(state.wish);
  $("#tWishes").textContent = "После концерта: " + list.join(" · ");
}

/* ---------- Финал: настоящий выбор и отправка ---------- */
function answerText(yes) {
  const lines = [yes ? `${friendName}: ДА! Летим в Корею 🇰🇷✈️` : `${friendName}: нет, не в этот раз 😔`];
  const list = [...state.activities];
  if (state.wish) list.push(state.wish);
  if (list.length) lines.push("", yes ? "Хочет:" : "Но выбирала:", ...list.map((a) => "• " + a));
  lines.push("", new Date().toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" }));
  return lines.join("\n");
}

async function finalAnswer(yes) {
  $("#finalChoice").hidden = true;
  const result = $("#result");
  result.hidden = false;
  $("#resultText").textContent = yes
    ? "Отличный выбор! Я посмотрю даты, когда можно будет полететь!"
    : "Понял. Спасибо, что дошла до конца 💛 Корея подождёт.";
  if (yes) {
    $("#stamp").classList.add("show");
    $("#icsBtn").hidden = !cfg.departDate;
    burst();
  }
  await sendResult(answerText(yes));
}
$("#finalYes").addEventListener("click", () => finalAnswer(true));
$("#finalNo").addEventListener("click", () => finalAnswer(false));

// Сначала пробуем бота (сообщение уходит само), иначе — запасные пути
async function sendResult(text) {
  const hint = $("#sendHint");
  const { token, chatId } = cfg.telegramBot || {};
  if (token && chatId) {
    hint.textContent = "Отправляю…";
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
      if (!res.ok) throw new Error(res.status);
      hint.textContent = "Ответ уже у меня в Telegram ✓";
      return;
    } catch {
      hint.textContent = "Не долетело… ";
    }
  }
  const { telegram, whatsapp } = cfg.contact;
  if (whatsapp) {
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`, "_blank");
    return;
  }
  if (telegram) {
    // Telegram не умеет подставлять текст в личный чат — копируем и открываем чат
    await copy(text);
    hint.textContent += "Текст скопирован — просто вставь его в чат 💌";
    setTimeout(() => window.open(`https://t.me/${telegram}`, "_blank"), 600);
  }
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = Object.assign(document.createElement("textarea"), { value: text });
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

$("#icsBtn").addEventListener("click", () => {
  const d = (iso) => iso.replaceAll("-", "");
  const end = cfg.returnDate || cfg.departDate;
  const endNext = new Date(end + "T00:00:00");
  endNext.setDate(endNext.getDate() + 1);
  const pad = (n) => String(n).padStart(2, "0");
  const endStr = `${endNext.getFullYear()}${pad(endNext.getMonth() + 1)}${pad(endNext.getDate())}`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//korea-trip//RU",
    "BEGIN:VEVENT",
    `UID:korea-${Date.now()}@invite`,
    `DTSTART;VALUE=DATE:${d(cfg.departDate)}`,
    `DTEND;VALUE=DATE:${endStr}`,
    "SUMMARY:Корея вместе 🇰🇷",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  a.download = "korea-trip.ics";
  a.click();
});

/* ---------- Конфетти ---------- */
const canvas = $("#confetti");
const ctx = canvas.getContext("2d");
let pieces = [];
let running = false;

function resize() {
  canvas.width = innerWidth * devicePixelRatio;
  canvas.height = innerHeight * devicePixelRatio;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}
addEventListener("resize", resize);
resize();

function burst() {
  const colors = ["#c8102e", "#0b3d91", "#d9a441", "#ffffff", "#f3ebdc"];
  for (let i = 0; i < 140; i++) {
    pieces.push({
      x: innerWidth / 2,
      y: innerHeight * 0.55,
      vx: (Math.random() - 0.5) * 14,
      vy: -Math.random() * 16 - 4,
      size: 6 + Math.random() * 8,
      rot: Math.random() * 6,
      vr: (Math.random() - 0.5) * 0.3,
      color: colors[(Math.random() * colors.length) | 0],
      glyph: Math.random() < 0.18 ? (Math.random() < 0.5 ? "✈️" : "💗") : null,
      life: 1,
    });
  }
  if (!running) {
    running = true;
    requestAnimationFrame(tick);
  }
}

function tick() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  pieces.forEach((p) => {
    p.vy += 0.35;
    p.vx *= 0.99;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    p.life -= 0.006;
    ctx.save();
    ctx.globalAlpha = Math.max(p.life, 0);
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    if (p.glyph) {
      ctx.font = `${p.size * 1.4}px serif`;
      ctx.fillText(p.glyph, 0, 0);
    } else {
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    }
    ctx.restore();
  });
  pieces = pieces.filter((p) => p.life > 0 && p.y < innerHeight + 40);
  if (pieces.length) requestAnimationFrame(tick);
  else {
    running = false;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
  }
}
