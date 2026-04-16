# Tejo Estúdio

Link aggregator and press kit platform for Tejo Estúdio. Built with a brutalist visual identity, focusing on simplicity, performance, and accessibility.

## 🎨 Visual Identity

Tejo Estúdio follows a **brutalist visual identity**, characterized by:
- High contrast color palettes.
- Hard shadows and thick borders.
- Semantic HTML structure.

This identity is defined in `css/tejo-base.css`. Branded buttons (link-tree style) are defined in `css/tejo-brands.css`.

## 🛠 Tech Stack

- **Template Engine:** Handlebars (.hbs)
- **Styling:** Vanilla CSS (Brutalist style)
- **Internationalization:** Multi-language support via JSON locales.
- **Build System:** Node.js script (`build.js`) generating a static site.

## 📂 Project Structure

- `templates/`: Handlebars templates for pages and partials.
- `locales/`: JSON files containing translations (`pt.json`, `en.json`).
- `css/`: Styling files (`tejo-base.css`, `tejo-brands.css`).
- `images/`: Static image assets.
- `fonts/`: Custom fonts for the brutalist identity.
- `build.js`: The build script that processes templates and locales into `dist/`.

## 🚀 Getting Started

### Prerequisites

- Node.js installed on your machine.

### Installation

```bash
npm install
```

### Building the Project

To generate the static site in the `dist/` directory:

```bash
npm run build
```

This will:
1. Load all locales from `locales/`.
2. Compile Handlebars templates from `templates/`.
3. Generate localized versions of each page (e.g., `dist/index.html` for Portuguese and `dist/en/index.html` for English).

## 📝 Development Guidelines

Please refer to [AGENTS.md](file:///c:/Users/mkael/progs/html/tejoestudio/AGENTS.md) for strict architectural and styling rules before making any changes to the codebase.

## ⚖️ License

This project is a fork of [LittleLink](https://github.com/sethcottle/littlelink) and maintains the original MIT License.
