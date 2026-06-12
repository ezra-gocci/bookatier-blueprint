(function () {
  if (document.getElementById("bookatier-tokens")) return;

  const style = document.createElement("style");
  style.id = "bookatier-tokens";
  style.textContent = `
    :root {
      --paper: #F7F1E6;
      --surface: #FFFDF8;
      --surface-sunk: #F0E8D8;
      --ink: #241F1B;
      --ink-soft: #5C5249;
      --ink-faint: #8B8073;
      --line: #E4D9C6;
      --accent: #B85138;
      --accent-hover: #9E4530;
      --accent-tint: #F0DCD2;
      --amber: #C98A3C;
      --slate: #3E5C73;
      --sage: #4C6B5E;
      --success: #5B7553;
      --warning: #C08A2E;
      --danger: #A8412E;
    }
    html[data-theme="sepia"] {
      --paper: #ECE0C8;
      --surface: #F3E9D4;
      --surface-sunk: #E6DCC0;
      --ink: #3A2F22;
      --ink-soft: #6A5A45;
      --ink-faint: #8A7B65;
      --line: #D8C8A8;
      --accent: #A8482F;
      --accent-hover: #8F3D27;
      --accent-tint: #E0C8BC;
      --amber: #C98A3C;
      --slate: #3E5C73;
      --sage: #4C6B5E;
      --success: #5B7553;
      --warning: #C08A2E;
      --danger: #A8412E;
    }
    html[data-theme="dark"] {
      --paper: #1F1B18;
      --surface: #272220;
      --surface-sunk: #171413;
      --ink: #ECE3D6;
      --ink-soft: #B4A899;
      --ink-faint: #7A6E62;
      --line: #3A332D;
      --accent: #D2674A;
      --accent-hover: #B8593F;
      --accent-tint: #3A271F;
      --amber: #D4994A;
      --slate: #5A7A91;
      --sage: #6A907F;
      --success: #7A9A6F;
      --warning: #D4A04A;
      --danger: #C85F4A;
    }
    body { background-color: var(--paper); color: var(--ink); }
    body.immersive header { display: none; }
    .text-balance { text-wrap: balance; }
    .material-symbols-outlined {
      font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
    }
  `;
  document.head.appendChild(style);

  tailwind.config = {
    /* Respond to both .dark class and data-theme="dark" attribute */
    darkMode: ["class", '[data-theme="dark"]'],
    theme: {
      extend: {
        colors: {
          paper: "var(--paper)",
          surface: "var(--surface)",
          "surface-sunk": "var(--surface-sunk)",
          ink: "var(--ink)",
          "ink-soft": "var(--ink-soft)",
          "ink-faint": "var(--ink-faint)",
          line: "var(--line)",
          accent: "var(--accent)",
          "accent-hover": "var(--accent-hover)",
          "accent-tint": "var(--accent-tint)",
          amber: "var(--amber)",
          slate: "var(--slate)",
          sage: "var(--sage)",
          success: "var(--success)",
          warning: "var(--warning)",
          danger: "var(--danger)",
        },
        spacing: {
          px: "1px",
          0.5: "2px",
          1: "4px",
          2: "8px",
          3: "12px",
          4: "16px",
          6: "24px",
          8: "32px",
          12: "48px",
          16: "64px",
          24: "96px",
          "stack-sm": "16px",
          "stack-md": "32px",
          "stack-lg": "64px",
          gutter: "24px",
          "max-width": "1200px",
          "margin-page": "40px",
        },
        borderRadius: {
          sm: "6px",
          md: "10px",
          lg: "16px",
          pill: "9999px",
        },
        fontFamily: {
          "display-serif": ['"Source Serif 4"', "Georgia", "serif"],
          "headline-h1": ['"Source Serif 4"', "Georgia", "serif"],
          "headline-h2": ['"Source Serif 4"', "Georgia", "serif"],
          "body-standard": ['"Source Serif 4"', "Georgia", "serif"],
          "body-reading": ['"Source Serif 4"', "Georgia", "serif"],
          "quote-text": ['"Source Serif 4"', "Georgia", "serif"],
          metadata: ["Inter", "system-ui", "sans-serif"],
          "ui-label-sm": ["Inter", "system-ui", "sans-serif"],
          "ui-label-lg": ["Inter", "system-ui", "sans-serif"],
          sans: ["Inter", "system-ui", "sans-serif"],
          serif: ['"Source Serif 4"', "Georgia", "serif"],
        },
        fontSize: {
          /* ── Canonical brief scale (design-brief.md §2) ── */
          display:  ["40px", { lineHeight: "48px", letterSpacing: "-0.01em", fontWeight: "600" }],
          h1:       ["30px", { lineHeight: "38px", fontWeight: "600" }],
          h2:       ["22px", { lineHeight: "30px", fontWeight: "600" }],
          h3:       ["18px", { lineHeight: "26px", fontWeight: "600" }],
          body:     ["16px", { lineHeight: "24px", fontWeight: "400" }],
          small:    ["14px", { lineHeight: "20px", fontWeight: "400" }],
          caption:  ["12px", { lineHeight: "16px", fontWeight: "500" }],
          pull:     ["22px", { lineHeight: "32px", fontWeight: "400", fontStyle: "italic" }],
          /* ── Legacy Stitch names (kept for backward compat) ── */
          "display-serif": [
            "40px",
            { lineHeight: "48px", letterSpacing: "-0.01em", fontWeight: "600" },
          ],
          "headline-h1": ["30px", { lineHeight: "38px", fontWeight: "600" }],
          "headline-h2": ["22px", { lineHeight: "30px", fontWeight: "600" }],
          subhead: ["18px", { lineHeight: "26px", fontWeight: "600" }],
          "body-standard": ["16px", { lineHeight: "24px", fontWeight: "400" }],
          "body-reading": ["18px", { lineHeight: "28px", fontWeight: "400" }],
          "ui-label-lg": ["15px", { lineHeight: "20px", letterSpacing: "0.02em", fontWeight: "500" }],
          "ui-label-sm": [
            "13px",
            { lineHeight: "18px", letterSpacing: "0.03em", fontWeight: "500" },
          ],
          metadata: ["12px", { lineHeight: "16px", fontWeight: "500" }],
          "quote-text": [
            "22px",
            { lineHeight: "32px", fontWeight: "400", fontStyle: "italic" },
          ],
        },
        boxShadow: {
          soft: "0 1px 2px rgba(40,30,20,0.06), 0 8px 24px rgba(40,30,20,0.06)",
        },
      },
    },
  };
})();
