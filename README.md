# Primework

> **A precision rendering framework for the modern web.**

Today we are excited to open-source Primework.

The web doesn't need another HTML replacement. It needs better tools for the problems HTML and CSS weren't designed to solve.

Over the years, browsers have evolved into powerful application platforms, but there are still areas where developers need deterministic rendering, precise layout control, advanced typography, and custom rendering pipelines. The usual solution is a collection of workarounds, compromises, and browser-specific techniques.

I wanted to explore a different approach.

Primework is a precision rendering framework that complements the web platform. Use browser primitives where they already work well. Use Primework where rendering quality becomes part of the product.

Whether you're building:

- Design tools
- Visual editors
- Publishing platforms
- Graphics-heavy applications
- Canvas-based interfaces
- Applications with demanding typography and layout requirements

Primework can be introduced incrementally:

- Standalone applications
- Embedded inside existing web applications
- Overlay mode where only a specific part of the UI requires precision rendering

No rewrites. No all-or-nothing migration. Adopt it only where it provides value.

But Primework is more than a framework.

It's also an exploration of what modern rendering on the web could look like if deterministic layout, advanced typography, and precision rendering were treated as first-class capabilities rather than problems to solve with workarounds.

My hope is that ideas explored in projects like this can contribute to future discussions about browser engines and the evolution of the web platform itself—so that one day, many of these workarounds simply won't be necessary.

This is the first public release, and there's a lot more to build. If you're interested in rendering engines, frontend architecture, typography, graphics, or the future of web applications, I'd genuinely love your feedback.

Primework is now open source. Feel free to explore it, open issues, suggest ideas, or contribute.

**[Website →](https://kunstx.online/primework)** &nbsp;·&nbsp; **[GitHub →](https://github.com/kunstx-src/primework)**

---

## Quick Start

Primework is a single self-contained file. Grab `primework.js` and include it as a `<script>` tag — no npm, no bundler, no build step. The `Primework` class is exposed as a global.

```bash
git clone https://github.com/kunstx-src/primework.git
```

Or just download [`primework.js`](https://github.com/kunstx-src/primework/blob/main/primework.js) directly and drop it into your project.

```html
<!DOCTYPE html>
<html lang="en"><head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="...IBM+Plex+Sans..." rel="stylesheet">
</head><body>
  <!-- viewport element: Primework fills this div -->
  <div id="app" style="position:relative;width:100vw;height:100vh;"></div>

  <!-- 1. Include the framework -->
  <script src="primework.js"></script>

  <!-- 2. Your code -->
  <script>
    document.fonts.ready.then(() => {
      const pw = new Primework({
        viewport   : document.getElementById('app'),
        clearColor : '#ffffff',
      });
      pw.add({ id:'title', type:'heading1', content:'Hello world',
        constraints:{ left:48, top:80, right:48 } });
      pw.startAnimating(24);
    });
  </script>
</body></html>
```

That's it — no `npm install`, no bundler, no build step. `document.fonts.ready` just makes sure web fonts are loaded before Primework measures text metrics, so layout is correct on the first frame.

### Integration modes

Primework works alongside your existing HTML in three ways — pick the one that matches how much of the page you're handing over:

| Mode | Use when |
|---|---|
| `isolated` (default) | Building a complete canvas-powered application — editors, creative tools, visualizations, design software. |
| `embedded` | Dropping Primework into a section of an existing page; the page's own scroll drives it. |
| `overlay` | Rendering on top of existing HTML with a fixed, transparent canvas — no rewrite required. |

```js
const pw = new Primework({ viewport, mode: 'overlay', clearColor: 'transparent' });
```

### Learn more

- **[Full documentation](https://kunstx.online/primework/documentation.html)** — every element type, style property, and API, live and interactive.
- **[Website](https://kunstx.online/primework)** — Primework's own site, built with itself.
- **[GitHub](https://github.com/kunstx-src/primework)** — source, issues, and releases.

---

## Why Primework?

Modern browsers are optimized for documents and conventional user interfaces.
That's exactly what HTML and CSS were designed for.

But some applications demand more.

- Rich typography
- Precise text composition
- Interactive editors
- Publishing software
- Graphics-heavy interfaces
- Design tools
- Custom rendering
- Pixel-perfect layouts

Primework is built for those applications.

---

## Use HTML Where HTML Shines

Primework is **not** trying to replace the browser.

Continue using HTML and CSS for:
- Forms
- Articles
- Navigation
- Dashboards
- Documentation
- Standard web interfaces

Use Primework when you need:
- Advanced typography
- Precision rendering
- Complex layouts
- Canvas-driven interfaces
- Visual editors
- Publishing systems
- Custom graphics
- Deterministic rendering

Both approaches can coexist in the same application.

---

# Integration Modes

Primework works in three ways.

### Standalone

Build complete canvas-powered applications.

Ideal for editors, creative tools, visualizations, and design software.

---

### Embedded

Embed Primework inside an existing website or application.

Use it only where precision rendering adds value.

---

### Overlay

Render on top of existing HTML.

Perfect when only a portion of an application requires advanced rendering.

No rewrite required.

---

# Features

- Deterministic rendering engine
- Constraint-based layout system
- Advanced typography
- Precision text layout
- Canvas rendering architecture
- Semantic HTML aliases
- Flexible styling system
- Custom rendering primitives
- High-performance rendering pipeline
- HTML coexistence
- Component-based architecture
- Extensible rendering model

---

# Philosophy

Primework extends the web instead of replacing it.

HTML remains the best choice for documents and traditional interfaces.

Primework focuses on the areas where rendering quality becomes a feature rather than an implementation detail.

---

# Roadmap


- [ ] Component library
- [ ] Plugin ecosystem

---

# Contributing

Contributions are welcome.

Whether it's [reporting issues](https://github.com/kunstx-src/primework/issues), improving documentation, proposing ideas, or submitting pull requests, we'd love your help in shaping Primework.

---

# License

Licensed under the Apache License 2.0.
See the [LICENSE](LICENSE) file for details.
