const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

try {
  const localesPath = path.join(__dirname, 'locales');
  if (!fs.existsSync(localesPath)) {
    throw new Error('locales/ directory does not exist. Build cannot proceed.');
  }
  const localeFiles = fs.readdirSync(localesPath).filter(file => file.endsWith('.json'));

  if (localeFiles.length === 0) {
    throw new Error('No locale JSON files found in locales/ directory. Build cannot proceed.');
  }

  const locales = {};

  localeFiles.forEach(file => {
    const lang = path.basename(file, '.json');
    try {
      locales[lang] = JSON.parse(fs.readFileSync(path.join(localesPath, file), 'utf8'));
    } catch (e) {
      throw new Error(`Invalid JSON in locale file: ${file}. Error: ${e.message}`);
    }
  });

  const templates = {};

  // Recursively find and compile all templates in the templates directory
  function loadTemplates(dir, baseDir) {
    if (!fs.existsSync(dir)) {
      throw new Error(`Templates directory ${dir} does not exist. Build cannot proceed.`);
    }
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        loadTemplates(fullPath, baseDir);
      } else if (file.endsWith('.hbs')) {
        const templateContent = fs.readFileSync(fullPath, 'utf8');
        // Handlebars partials, conventionally starting with '_'
        if (file.startsWith('_')) {
          // Use relative path without the '_' for partial names to avoid collisions
          const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
          const dirName = path.dirname(relativePath);
          const baseName = path.basename(file, '.hbs').substring(1);
          // e.g. partials/_lang_redirect.hbs -> partials/lang_redirect
          const partialName = dirName === '.' ? baseName : `${dirName}/${baseName}`;
          Handlebars.registerPartial(partialName, templateContent);
        } else {
          const relativePath = path.relative(baseDir, fullPath);
          // Replace windows backslashes with forward slashes for cross-platform keys
          const templateKey = relativePath.replace(/\\/g, '/');
          templates[templateKey] = Handlebars.compile(templateContent);
        }
      }
    });
  }

  loadTemplates(path.join(__dirname, 'templates'), path.join(__dirname, 'templates'));

  const pageConfigs = Object.keys(templates).map(templateKey => {
    // Map template path 'press-kit/vem-exu/index.hbs' -> 'press-kit/vem-exu/index.html'
    const baseOutputPath = templateKey.replace(/\.hbs$/, '.html');

    // Map canonical path 'press-kit/vem-exu/index.html' -> 'press-kit/vem-exu/'
    let canonicalBase = baseOutputPath.replace(/index\.html$/, '');

    return {
      template: templates[templateKey],
      baseOutputPath: baseOutputPath,
      canonicalBase: canonicalBase
    };
  });

  // Clean dist directory before generating to prevent stale files
  const distDir = path.join(__dirname, 'dist');
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });

  const pages = [];

  const CONFIG = {
    DEFAULT_LANG: 'pt',
    SITE_URL: (process.env.SITE_URL || '/').replace(/\/$/, '') + '/'
  };

  // Assumes all non-default locales map directly to their lang folder (e.g. 'en' -> '/en/')
  const availableLangs = Object.keys(locales);

  /**
   * Calculates the relative path to the root from a given file path.
   * e.g. 'index.html' -> './', 'en/index.html' -> '../', 'press-kit/vem-exu/index.html' -> '../../'
   */
  function getRelativePath(outputPath) {
    const depth = outputPath.split('/').filter(Boolean).length - 1;
    return depth > 0 ? '../'.repeat(depth) : './';
  }

  pageConfigs.forEach(config => {
    availableLangs.forEach(lang => {
      const isDefault = lang === CONFIG.DEFAULT_LANG;
      const langFolder = isDefault ? '' : `${lang}/`;
      const outputPath = `${langFolder}${config.baseOutputPath}`;
      const toRoot = getRelativePath(outputPath);

      // Calculate alternative languages for the switcher
      const otherLangs = availableLangs
        .filter(l => l !== lang)
        .map(otherLang => {
          const otherLangFolder = (otherLang === CONFIG.DEFAULT_LANG) ? '' : `${otherLang}/`;
          return {
            code: otherLang,
            label: otherLang.toUpperCase(),
            link: `${toRoot}${otherLangFolder}${config.baseOutputPath}`,
            aria: (locales[lang].lang_switcher_aria || 'Switch to {lang}').replace('{lang}', otherLang.toUpperCase())
          };
        });

      pages.push({
        template: config.template,
        outputPath: `dist/${outputPath}`,
        data: {
          ...locales[lang],
          lang: locales[lang].lang_code || (isDefault ? 'pt-BR' : lang),
          canonical_path: isDefault ? config.canonicalBase : `${lang}/${config.canonicalBase}`,
          canonical_base: config.canonicalBase,
          site_url: CONFIG.SITE_URL,
          base_path: toRoot,
          language_path: `${toRoot}${langFolder}`,
          is_default_lang: isDefault,
          default_lang: CONFIG.DEFAULT_LANG,
          available_langs: JSON.stringify(availableLangs),
          other_langs: otherLangs
        }
      });
    });
  });

  pages.forEach(page => {
    const absoluteOutputPath = path.resolve(__dirname, page.outputPath);
    const dir = path.dirname(absoluteOutputPath);
    fs.mkdirSync(dir, { recursive: true });

    const html = page.template(page.data);
    fs.writeFileSync(absoluteOutputPath, html);
    console.log(`Generated: ${page.outputPath}`);
  });

  console.log("Build completed successfully!");
} catch (error) {
  console.error("Error during build:");
  console.error(error);
  process.exit(1);
}
