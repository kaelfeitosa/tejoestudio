const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

const CONFIG = {
  DEFAULT_LANG: 'pt',
  SITE_URL: (process.env.SITE_URL || '/').replace(/\/$/, '') + '/'
};

/**
 * Main build process
 */
function runBuild() {
  console.log("Starting build...");
  try {
    const paths = {
      src: path.join(__dirname, 'src'),
      locales: path.join(__dirname, 'src', 'locales'),
      templates: path.join(__dirname, 'src', 'templates'),
      static: path.join(__dirname, 'src', 'static'),
      dist: path.join(__dirname, 'dist')
    };

    cleanDist(paths.dist);
    const locales = loadLocales(paths.locales);
    const templates = compileTemplates(paths.templates);
    copyAssets(paths.static, paths.dist);
    generatePages(templates, locales, paths.dist);
    
    console.log("Build completed successfully!");
  } catch (error) {
    console.error("Build failed:");
    console.error(error.message);
    process.exit(1);
  }
}

function cleanDist(distDir) {
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });
}

function loadLocales(localesPath) {
  if (!fs.existsSync(localesPath)) {
    throw new Error(`Locales directory missing: ${localesPath}`);
  }
  const localeFiles = fs.readdirSync(localesPath).filter(file => file.endsWith('.json'));
  const locales = {};
  localeFiles.forEach(file => {
    const lang = path.basename(file, '.json');
    locales[lang] = JSON.parse(fs.readFileSync(path.join(localesPath, file), 'utf8'));
  });
  return locales;
}

function compileTemplates(templatesPath) {
  const templates = {};
  
  function loadRecursive(dir, baseDir) {
    fs.readdirSync(dir).forEach(file => {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        loadRecursive(fullPath, baseDir);
      } else if (file.endsWith('.hbs')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (file.startsWith('_')) {
          registerPartial(fullPath, baseDir, content);
        } else {
          const key = path.relative(baseDir, fullPath).replace(/\\/g, '/');
          templates[key] = Handlebars.compile(content);
        }
      }
    });
  }

  loadRecursive(templatesPath, templatesPath);
  return templates;
}

function registerPartial(fullPath, baseDir, content) {
  const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
  const dirName = path.dirname(relativePath);
  const baseName = path.basename(fullPath, '.hbs').substring(1);
  const partialName = dirName === '.' ? baseName : `${dirName}/${baseName}`;
  Handlebars.registerPartial(partialName, content);
}

function copyAssets(staticPath, distDir) {
  if (fs.existsSync(staticPath)) {
    // Copy while excluding sample files
    fs.cpSync(staticPath, distDir, { 
      recursive: true,
      filter: (src) => !src.endsWith('.sample') && !src.includes('.DS_Store')
    });
    console.log("Static assets copied to dist/ (excluding samples)");
  }
  fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
}

function generatePages(templates, locales, distDir) {
  const availableLangs = Object.keys(locales);

  Object.keys(templates).forEach(templateKey => {
    const template = templates[templateKey];
    const baseOutputPath = templateKey.replace(/\.hbs$/, '.html');
    const canonicalBase = baseOutputPath.replace(/index\.html$/, '');

    availableLangs.forEach(lang => {
      const isDefault = lang === CONFIG.DEFAULT_LANG;
      const langFolder = isDefault ? '' : `${lang}/`;
      const outputPath = path.join(distDir, langFolder, baseOutputPath);
      const toRoot = getToRoot(isDefault, baseOutputPath);

      const pageData = {
        ...locales[lang],
        lang: locales[lang].lang_code || (isDefault ? 'pt-BR' : lang),
        canonical_path: isDefault ? canonicalBase : `${lang}/${canonicalBase}`,
        site_url: CONFIG.SITE_URL,
        base_path: toRoot,
        language_path: `${toRoot}${langFolder}`,
        other_langs: getOtherLangs(lang, availableLangs, toRoot, baseOutputPath, locales)
      };

      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, template(pageData));
      console.log(`Generated: ${path.relative(__dirname, outputPath)}`);
    });
  });
}

function getToRoot(isDefault, outputPath) {
  const depth = outputPath.split(/[/\\]/).filter(Boolean).length - (isDefault ? 1 : 0);
  return depth > 0 ? '../'.repeat(depth) : './';
}

function getOtherLangs(currentLang, availableLangs, toRoot, baseOutputPath, locales) {
  return availableLangs
    .filter(l => l !== currentLang)
    .map(lang => {
      const folder = (lang === CONFIG.DEFAULT_LANG) ? '' : `${lang}/`;
      return {
        code: lang,
        label: lang.toUpperCase(),
        link: `${toRoot}${folder}${baseOutputPath}`,
        aria: (locales[currentLang].lang_switcher_aria || 'Switch to {lang}').replace('{lang}', lang.toUpperCase())
      };
    });
}

runBuild();
