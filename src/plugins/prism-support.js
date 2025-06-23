function isFn(fn) {
  return typeof fn === 'function';
}

function escapeHtml(str) {
  const map = {
    ' ': '&nbsp;',
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '"': '&quot;',
    "'": '&apos;',
  };
  return str.replace(/[ <>'"&]/g, m => map[m]);
}

// docsify 全局配置
window.$docsify = window.$docsify || {};
const userCfg = window.$docsify.docsifyPrism || {};

function install(hook, vm) {
  // 1) 扩展 Markdown 渲染器
  hook.init(function () {
    const mdCfg = vm.config.markdown || {};
    const renderer = mdCfg.renderer || {};

    renderer.code = function (codeContent, infoString = '', escaped) {
      // 👉 兼容 Marked v5：codeContent 可能是对象
      let lang = '';
      if (
        typeof codeContent === 'object' &&
        codeContent !== null &&
        'text' in codeContent
      ) {
        lang = codeContent.lang || '';
        codeContent = codeContent.text || '';
      } else {
        codeContent = codeContent == null ? '' : String(codeContent);
        lang = (infoString || '').trim().split(/\s+/)[0] || '';
      }

      if (isFn(userCfg.beforeRender)) {
        codeContent = userCfg.beforeRender(codeContent, lang);
      }

      const html = `<pre v-pre data-lang="${lang}"><code class="lang-${lang}">${escapeHtml(codeContent)}</code></pre>`;
      return isFn(userCfg.afterRender) ? userCfg.afterRender(html) : html;
    };

    // 将新的 renderer 写回 Docsify 配置
    vm.config.markdown = Object.assign({}, mdCfg, { renderer });

    // 用户自定义初始化
    if (isFn(userCfg.init)) userCfg.init();
  });

  // 2) 每次路由渲染完成后，调用 Prism 高亮
  hook.doneEach(function () {
    const main = document.getElementById('main');
    if (window.Prism && main) {
      Prism.highlightAllUnder(main);
    }
  });
}

window.$docsify = window.$docsify || {};
$docsify.plugins = [install, ...($docsify.plugins || [])];
