import { Docsify } from "../core/Docsify";

function getConfigAlias(url, vm) {
  //var config = vm.compiler.router.config;
  //url = config.alias ? vm.router.getAlias(url) : url;
  //return url;
  return vm.router.getAlias(url);
}

var isAbsolutePath = function (path) {
  //return /(:|(\/{2}))/g.test(path);
  // console.log("Docsify:",window.Docsify)
  return window.Docsify.util.isAbsolutePath(path)
};

var getParentPath = function (path) {
  return window.Docsify.util.getParentPath(path)
};


function extractAndRemoveTagPs(content) {
  //const regex = /<p\s+hide="tags:\{([^}]*)\}"(?:\s*\/>|>[\s\S]*?<\/p>)/g;
  const regex = /<p\s+hide\s*=\s*["“”]\s*tags:\{([^}]*)\}\s*["“”]\s*(?:\s*\/>|>[\s\S]*?<\/p>)/g
  const matches = [];
  let match;

  // 提取所有匹配项，并记录
  while ((match = regex.exec(content)) !== null) {
    matches.push({
      fullMatch: match[0],     // 整个 <p>...</p>
      tagContent: match[1],    // {...} 中的内容
    });
  }

  // 删除所有匹配到的 <p> 元素
  const cleaned_content = content.replace(regex, '');

  return {
    cleaned_content,
    tagBlocks: matches, // 你可以提取/处理 tag 内容
  };
}


/* eslint-disable no-unused-vars */
/**
 * 预处理 Markdown：
 * 1) 将相对路径替换为绝对路径              （<img|video|a> 与 ![]()）
 * 2) 规范化代码块语言，并收集去重后的列表
 *
 * 返回：
 *   { markdown: '处理后内容', codeLanguages: ['cpp','js', ...] }
 */
function preprocessMarkdown(markdown, vm) {
  // 1️⃣ 语言映射表（可按需扩展）
  const langMap = {
    'c++': 'cpp',
    cxx: 'cpp',
  };

  const langSet = new Set(); // 用于去重

  /* ---------- 处理代码围栏 ---------- */
  // (^|\n) 保证是行首       (```|~~~) 围栏标记
  // ([\w#+-]+)?  捕获语言，允许字母/数字/+/#/-
  //const fenceRe = /(|\n)(```|~~~)([\w#+-]+)?/g;
  const fenceRe = /(^|\n)[ \t]*(```|~~~)([\w#+-]*)/g;

  //console.log("markdown = ",markdown)
  markdown = markdown.replace(fenceRe, (match, leading, fence, lang = '') => {
    if (lang) {
      //console.log("lang = ",lang)
      const canonical = langMap[lang.toLowerCase()] || lang;
      langSet.add(canonical);
      return `${leading}${fence}${canonical}`; // 用规范名替换
    }
    return match; // 无语言标注，原样返回
  });

  /* ---------- 处理 <img>|<video>|<a> 标签 ---------- */
  const tagPatterns = [
    { tag: 'img', attr: 'src' },
    { tag: 'video', attr: 'src' },
    { tag: 'a', attr: 'href' },
  ];

  tagPatterns.forEach(({ tag, attr }) => {
    const re = new RegExp(
      `<${tag}\\s[^>]*?${attr}\\s*=\\s*"([^"]+)"[^>]*?>`,
      'gi',
    );
    markdown = markdown.replace(re, (m, href) => {
      if (!isAbsolutePath(href)) {
        let abs = window.Docsify.util.getPath(
          vm.compiler.contentBase,
          getParentPath(vm.compiler.router.getCurrentPath()),
          href,
        );
        abs = getConfigAlias(abs, vm);
        return m.replace(href, abs);
      }
      return m;
    });
  });

  /* ---------- 处理 Markdown 图片语法 ---------- */
  markdown = markdown.replace(/!\[.*?]\((.*?)\)/g, (m, href) => {
    let abs = href.includes(' ') ? href.replace(/ /g, '%20') : href;
    abs = getConfigAlias(abs, vm);
    return m.replace(href, abs);
  });

  var result = extractAndRemoveTagPs(markdown);
  markdown = result.cleaned_content
  //console.log("result:",result)
  return markdown;
}

function install(hook, vm) {
  hook.beforeEach(function (markdown, next) {
    //markdown = replace_relative2_abs(markdown, vm);
    markdown = preprocessMarkdown(markdown, vm);
    next(markdown);
  });
}

window.$docsify = window.$docsify || {};
$docsify.plugins = [install, ...($docsify.plugins || [])];
