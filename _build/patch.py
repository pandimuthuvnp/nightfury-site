"""Rebuild public/ (the deployable site) from the downloaded originals.

Changes merged into the live site's code:
  1. Hero speed counter: 1 -> 43.46 km/h, 2 decimals, fast start / slow finish.
  2. Hero card: Night Patrol scene (Night / Day hybrid / Rain).
  3. Word on the street: last quote signed "— Master Aadhithyavarman".
  4. Chapter 04 The Master, 05 The Defense, 06 the mini-game (+ Squad of Unity).
  5. Sound effects (sfx.js), nav + footer links.
  6. Emergent / webpack dev-server clients stripped so it runs on any static host.
Re-run any time:  python _build/patch.py
"""
import re
from pathlib import Path

B = Path(__file__).resolve().parent
ROOT = B.parent / "public"
(ROOT / "static/js").mkdir(parents=True, exist_ok=True)
src = (B / "bundle.original.js").read_text(encoding="utf-8")
JSX = "(0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxDEV)"


def sub_once(s, old, new, label):
    n = s.count(old)
    assert n == 1, f"{label}: expected 1 match, found {n}"
    return s.replace(old, new)


def cut(s, start_marker, end_marker, new, label):
    i = s.find(start_marker)
    assert i >= 0, f"{label}: start not found"
    j = s.find(end_marker, i)
    assert j >= 0, f"{label}: end not found"
    return s[:i] + new + s[j + len(end_marker):]


# ---------------------------------------------------------------- scene code
proto = (B / "nightfury-patrol.html").read_text(encoding="utf-8")
svg = re.search(r"<svg id=\"scene\".*?</svg>", proto, re.S).group(0)
svg = re.sub(r'id="([\w-]+)"', r'id="nfp-\1"', svg)
svg = svg.replace("url(#", "url(#nfp-")
svg = svg.replace('<svg id="nfp-scene"',
                  '<svg id="nfp-scene" style="display:block;width:100%;height:auto;'
                  'cursor:crosshair;touch-action:manipulation;overflow:hidden;border-radius:12px"')
svg = re.sub(r"<!--.*?-->", "", svg, flags=re.S)
assert "`" not in svg and "${" not in svg

js = re.search(r"<script>\s*\(\(\) => \{(.*)\}\)\(\);\s*</script>", proto, re.S).group(1)
js = sub_once(js, 'const $ = id => document.getElementById(id);',
              'const $ = id => root.querySelector("#nfp-" + id);', "scoped $")
js = sub_once(js, 'const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;\n', "", "reduced")
js = js.replace('document.querySelectorAll(".spokes")', 'root.querySelectorAll(".spokes")')
js = js.replace('"url(#', '"url(#nfp-')
js = sub_once(js, "    recoil = 1;\n", "    recoil = 1;\n    if (window.nfSfx) window.nfSfx.plasma();\n", "patrol plasma sfx")
# the speed pill lives in the hero's left column now (Telemetry) — the scene
# only uses the same curve to drive the world speed
js = sub_once(js, 'const spd = $("spd");', "", "spd el")
js = sub_once(js, "    spd.textContent = fmt(kmh);\n", "", "spd write")
js = sub_once(js, "    spd.textContent = fmt(TARGET);\n", "", "spd reduced")
# lifecycle: cancel the loop on unmount
js = sub_once(js, "  const frame = ts => {\n",
              "  const frame = ts => {\n    if (dead) return;\n", "frame guard")
js = sub_once(js, "    requestAnimationFrame(frame);\n  };",
              "    raf = requestAnimationFrame(frame);\n  };", "raf inner")
js = sub_once(js, "  } else {\n    requestAnimationFrame(frame);\n  }",
              "  } else {\n    raf = requestAnimationFrame(frame);\n  }\n"
              "  return () => { dead = true; cancelAnimationFrame(raf); };", "raf outer")

scene = (
    "\n" + (B / "sfx.js").read_text(encoding="utf-8") +
    "\n/* ---- Night Patrol scene (merged) ---- */\n"
    "const NF_PATROL_SVG = `" + svg + "`;\n"
    "function nfPatrolMount(root, reduced) {\n"
    "  root.innerHTML = NF_PATROL_SVG;\n"
    "  let raf = 0, dead = false;\n"
    + js +
    "}\n"
    "const NightPatrol = ({ reduced, mode, rain }) => {\n"
    "  const ref = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);\n"
    "  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => nfPatrolMount(ref.current, !!reduced), [reduced]);\n"
    "  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => { const s = ref.current && ref.current.querySelector('svg'); if (s && s.__nfSet) s.__nfSet(mode, rain); }, [mode, rain, reduced]);\n"
    f"  return {JSX}(\"div\", {{ ref, className: \"w-full\", \"data-testid\": \"hero-night-patrol\" }}, void 0, false, void 0, undefined);\n"
    "};\n"
)

# ---------------------------------------------------------------- HeroSection
H0 = src.find('/***/ "./src/components/nightfury/HeroSection.jsx"')
H1 = src.find('/***/ "./src/components/nightfury/Logo.jsx"')
hero = src[H0:H1]

hero = sub_once(hero, "_s2 = __webpack_require__.$Refresh$.signature();\n",
                "_s2 = __webpack_require__.$Refresh$.signature();\n" + scene, "inject scene")

# 1. speed counter
hero = sub_once(hero, '(0,react__WEBPACK_IMPORTED_MODULE_0__.useState)("00.0")',
                '(0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(reduced ? "43.46" : "01.00")', "spd init")
hero = sub_once(hero,
    """(0,framer_motion__WEBPACK_IMPORTED_MODULE_4__.animate)(0, 42.6, {
      duration: 7,
      ease: [0.3, 0.9, 0.4, 1],
      onUpdate: v => setDisplay(v.toFixed(1).padStart(4, "0"))
    });""",
    """(0,framer_motion__WEBPACK_IMPORTED_MODULE_4__.animate)(1, 43.46, {
      duration: 7,
      ease: [0.3, 0.9, 0.4, 1],
      onUpdate: v => setDisplay(v.toFixed(2).padStart(5, "0")),
      onComplete: () => setDisplay("43.46")
    });""", "spd animate")

# 2a. state: Night/Day follows the visitor's clock, plus a Rain switch
hero = sub_once(hero, 'const [tab, setTab] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)("bike");',
    'const [tab, setTab] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(() => { const h = new Date().getHours(); return h >= 6 && h < 18 ? "dragon" : "bike"; });\n'
    '  const [rain, setRain] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);', "state")

# 2b. card title + header wrap
hero = sub_once(hero, 'children: tab === "bike" ? "FIG. 01 — The Machine" : "FIG. 02 — The Sigil"',
                'children: tab === "bike" ? "FIG. 01 — The Night Patrol" : "FIG. 02 — The Day Patrol"', "title")
hero = sub_once(hero, 'className: "flex items-center justify-between mb-8",',
                'className: "flex items-center justify-between mb-8",\n            style: { flexWrap: "wrap", gap: 12 },', "header wrap")

# 2c. Bike/Dragon -> Night/Day, plus Rain
hero = sub_once(hero, 'children: "Bike"', 'children: "Night"', "btn night")
hero = sub_once(hero, 'children: "Dragon"', 'children: "Day"', "btn day")
hero = sub_once(hero, 'onClick: () => setTab("dragon"),',
                'onClick: () => setTab("dragon"),\n                style: tab === "dragon" ? { background: "#FFB020" } : undefined,', "day colour")
rain_btn = (', ' + JSX + '("button", { "data-testid": "hero-toggle-rain", onClick: () => setRain(r => !r), '
            '"aria-pressed": rain, style: rain ? { background: "#7DD3FC", color: "#07080B", borderColor: "#7DD3FC" } : undefined, '
            'className: "rounded-full px-4 py-2 font-mono-nf text-[10px] font-bold tracking-[0.18em] uppercase transition-colors duration-300 border border-white/15 text-[#94A3B8] hover:text-white hover:border-white/40", '
            'children: "Rain" }, void 0, false, void 0, undefined)')
hero = sub_once(hero, "lineNumber: 158,\n                columnNumber: 17\n              }, undefined)",
                "lineNumber: 158,\n                columnNumber: 17\n              }, undefined)" + rain_btn, "rain btn")

# 2d. canvas -> the scene
hero = cut(hero,
           'children: tab === "bike" ? /*#__PURE__*/' + JSX + '(_BikeOutline',
           "lineNumber: 179,\n              columnNumber: 17\n            }, undefined)",
           "children: " + JSX + '(NightPatrol, { reduced: reduced, mode: tab === "dragon" ? "day" : "night", rain: rain }, "patrol", false, void 0, undefined)',
           "canvas")

# 2e. footer
hero = sub_once(hero, 'children: tab === "bike" ? "One gear // No brakes" : "Shadow drawn in light"',
                'children: (tab === "dragon" ? "Stormcutter × Night Fury" : "One gear // One hand") + " // " + '
                '(rain ? "Raining Hosur" : tab === "dragon" ? "Scorching Hosur" : "No brakes")', "footer left")
hero = sub_once(hero, 'children: "NF-01"', 'children: "Click to fire · " + (tab === "dragon" ? "NF-02" : "NF-01")', "footer right")

src = src[:H0] + hero + src[H1:]

# ---------------------------------------------------------------- StorySection
S0 = src.find('/***/ "./src/components/nightfury/StorySection.jsx"')
S1 = src.find('/***/ "./src/index.js"')
story = src[S0:S1]
SJ = "(0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxDEV)"
sign = (', index === quotes.length - 1 ? ' + SJ + '("span", { "data-testid": "story-quote-author", '
        'style: { display: "block", marginTop: "1.1rem", fontFamily: "JetBrains Mono, monospace", '
        'fontSize: "clamp(11px, 1.1vw, 14px)", fontWeight: 700, letterSpacing: "0.28em", '
        'textTransform: "uppercase", color: "#00FF87" }, '
        'children: "\\u2014 Master Aadhithyavarman" }, "author", false, void 0, undefined) : null')
story = sub_once(story, 'children: quotes[index]\n              }, void 0, false), "\\""]',
                 'children: quotes[index]\n              }, void 0, false), "\\""' + sign + ']', "author")
src = src[:S0] + story + src[S1:]

# ---------------------------------------------------------------- Chapter 04: The Master
A0 = src.find('/***/ "./src/App.js"')
A1 = src.find('/***/ "./src/components/nightfury/BikeOutline.jsx"')
app = src[A0:A1]
master = (B / "master_section.js").read_text(encoding="utf-8")
master += "\n" + (B / "defense_scene.js").read_text(encoding="utf-8")
master += "\n" + (B / "defense_section.js").read_text(encoding="utf-8") + "\n"
master += "\n" + (B / "game.js").read_text(encoding="utf-8")
master += "\n" + (B / "game_section.js").read_text(encoding="utf-8") + "\n"
app = sub_once(app, "const Home = () =>", master + "const Home = () =>", "master def")
app = sub_once(app, "lineNumber: 42,\n      columnNumber: 7\n    }, undefined)]",
               "lineNumber: 42,\n      columnNumber: 7\n    }, undefined), "
               "(0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxDEV)(MasterSection, {}, \"master\", false, void 0, undefined), "
               "(0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxDEV)(DefenseSection, {}, \"defense\", false, void 0, undefined), "
               "(0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxDEV)(GameSection, {}, \"play\", false, void 0, undefined)]",
               "master mount")
src = src[:A0] + app + src[A1:]

# nav link + footer credit
src = sub_once(src, '''  label: "Legend",
  id: "#legend",
  testid: "nav-link-story"
}];''', '''  label: "Legend",
  id: "#legend",
  testid: "nav-link-story"
}, {
  label: "Master",
  id: "#master",
  testid: "nav-link-master"
}, {
  label: "Defense",
  id: "#defense",
  testid: "nav-link-defense"
}, {
  label: "Play",
  id: "#play",
  testid: "nav-link-play"
}];''', "nav master")
src = sub_once(src, '["Outlines", "Specs", "Legend"].map(l =>', '["Outlines", "Specs", "Legend", "Master", "Defense", "Play"].map(l =>', "footer master")
src = sub_once(src, 'children: "After dark, it\'s his"', 'children: "Ridden by Master Aadhithyavarman"', "footer credit")

# ---------------------------------------------------------------- static hosting
# The Emergent preview ran a dev server; on a static host its clients would retry a
# live-reload socket forever and post errors to Emergent. Drop them from startup.
for entry in ['./node_modules/@emergentbase/overlay/dist/cjs/webpack-client.js',
              './node_modules/webpack/hot/dev-server.js']:
    src = sub_once(src, '/******/ \t__webpack_require__("' + entry + '");\n', "", "strip " + entry)
src, n = re.subn(r'/\*{6}/ \t__webpack_require__\("\./node_modules/webpack-dev-server/client/index\.js\?[^"]*"\);\n', "", src)
assert n == 1, f"strip dev-server client: {n}"
src = src.replace("//# sourceMappingURL=bundle.js.map", "")

(ROOT / "static/js/bundle.js").write_text(src, encoding="utf-8")
(ROOT / "favicon.svg").write_bytes((B / "favicon.svg").read_bytes())

# ---------------------------------------------------------------- index.html
(ROOT / "index.html").write_text("""<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#07080B" />
        <meta name="description" content="NIGHTFURY — the single-speed of the local cycling king. One gear, silent strike, ride the dark." />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,600;0,800;1,400&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
        <title>NIGHTFURY — Single Speed King</title>
        <script defer src="/static/js/bundle.js?v=__BUILD__"></script>
    </head>
    <body>
        <noscript>You need to enable JavaScript to run this app.</noscript>
        <div id="root"></div>
    </body>
</html>
""".replace("__BUILD__", str(len(src))), encoding="utf-8")
print("patched OK:", len(src), "bytes")
