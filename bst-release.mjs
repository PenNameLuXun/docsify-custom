import fs from 'fs/promises';
import path from 'path';
import fg from 'fast-glob';

// 根目录
const rootDir = process.cwd();

// 路径定义
const srcHtml = path.join(rootDir, 'bst_docs/index_debug.html');
const destHtml = path.join(rootDir, 'bst_docs/docs/index.html');

const distDir = path.join(rootDir, 'dist');
const pluginDest = path.join(rootDir, 'bst_docs/docs/plugins');
const cssSrcGlob = 'dist/themes/bst/*.css';
const cssDest = path.join(rootDir, 'bst_docs/docs/vendor/themes');

// 拷贝 HTML
async function copyIndexHtml() {
  let content = await fs.readFile(srcHtml, 'utf-8');
  // 替换所有 js 路径为 plugins/xxx.js
  content = content.replace(/<script\s+src=["'](.*?)["']><\/script>/g, (match, srcPath) => {
    const filename = path.basename(srcPath);
    return `<script src="plugins/${filename}"></script>`;
  });
  await fs.writeFile(destHtml, content, 'utf-8');
  console.log(`✅ 拷贝并修改 HTML: ${srcHtml} -> ${destHtml}`);
}

// 拷贝 JS 文件
async function copyJS() {
  const jsFiles = await fg(['dist/*.js', 'dist/plugins/*.js']);
  await fs.mkdir(pluginDest, { recursive: true });

  for (const file of jsFiles) {
    const filename = path.basename(file);
    const dest = path.join(pluginDest, filename);
    await fs.copyFile(file, dest);
    console.log(`✅ 拷贝 JS: ${file} -> ${dest}`);
  }
}

// 拷贝 CSS 文件
async function copyCSS() {
  const cssFiles = await fg(cssSrcGlob);
  for (const file of cssFiles) {
    const relPath = path.relative('dist/themes/bst', file); // e.g. bst/foo.css
    const dest = path.join(cssDest, relPath);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(file, dest);
    console.log(`✅ 拷贝 CSS: ${file} -> ${dest}`);
  }
}

await copyIndexHtml();
await copyJS();
await copyCSS();

console.log('\n🚀 bst_release 完成！');
