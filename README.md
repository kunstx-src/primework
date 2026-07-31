# Primework

> **A precision rendering framework for the modern web.**

Primework complements the web platform by bringing deterministic rendering, advanced layout, and high-quality typography to the parts of web applications where every pixel matters.

Instead of replacing HTML and CSS, Primework works alongside them—allowing developers to use the browser where it excels and Primework where rendering precision becomes part of the product.

**[Live demo →](https://kunstx.online/primework)**

---

## Quick Start

Primework is a single self-contained file. Copy `primework.js` into your project and include it as a `<script>` tag — no npm, no bundler, no build step. The `Primework` class is exposed as a global.

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

### Dark themes

Primework ships with built-in Carbon Design tokens for light and dark UI. Call `pw.theme('g100')` right after construction to repoint every text-bearing element at dark-theme colors (or `pw.theme('white')` for light, which is the default):

```js
const pw = new Primework({ viewport: document.getElementById('app'), clearColor: '#161616' });
pw.theme('g100'); // dark theme — body copy resolves to #f4f4f4
```

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

- **[Full documentation](primework-docs.html)** — every element type, style property, and API, live and interactive.
- **[Live demo](https://kunstx.online/primework)** — see Primework's own landing page, built with itself.

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

- [ ] Core rendering engine
- [ ] Constraint layout engine
- [ ] Typography engine
- [ ] Component library
- [ ] Editor tooling
- [ ] Documentation
- [ ] Examples
- [ ] Plugin ecosystem

---

# Contributing

Contributions are welcome.

Whether it's reporting issues, improving documentation, proposing ideas, or submitting pull requests, we'd love your help in shaping Primework.

---

# License

Licensed under the Apache License 2.0.
See the [LICENSE](LICENSE) file for details.
