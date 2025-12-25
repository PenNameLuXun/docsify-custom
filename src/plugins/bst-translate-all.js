/**
 * 依赖三方web服务：LibreTranslate 
 * 1.使用docker安装LibreTranslate:
 *    docker run -d   -p 5000:5000   -e LT_HOST=0.0.0.0   -e LT_LOAD_ONLY=zh,en   -e http_proxy=http://10.28.2.62:8118   -e https_proxy=http://10.28.2.62:8118   --name libretranslate   libretranslate/libretranslate
 *    注意运行后会自动下载 '中文到英文'的模型，需要等待一定时间才能成功运行起来
 * 2.默认仅下载了中文到英文的模型，如需要更多那么需要进入容器下载模型：
 *      docker exec -it libretranslate /bin/sh
        cd /app/argos-translate/packages
        wget https://github.com/argosopentech/argos-translate/releases/download/v1.0.0/zh_en.argosmodel
        wget https://github.com/argosopentech/argos-translate/releases/download/v1.0.0/ja_en.argosmodel
        wget https://github.com/argosopentech/argos-translate/releases/download/v1.0.0/ko_en.argosmodel
        wget https://github.com/argosopentech/argos-translate/releases/download/v1.0.0/es_en.argosmodel
        wget https://github.com/argosopentech/argos-translate/releases/download/v1.0.0/de_en.argosmodel
        wget https://github.com/argosopentech/argos-translate/releases/download/v1.0.0/fr_en.argosmodel

        python3 -m argostranslate.package install zh_en.argosmodel
        python3 -m argostranslate.package install ja_en.argosmodel
        python3 -m argostranslate.package install ko_en.argosmodel
        python3 -m argostranslate.package install es_en.argosmodel
        python3 -m argostranslate.package install de_en.argosmodel
        python3 -m argostranslate.package install fr_en.argosmodel
    3. 测试
        curl -X POST http://localhost:5000/translate \
            -H 'Content-Type: application/json' \
            -d '{"q":"你好，世界","source":"zh","target":"ja","format":"text"}'
 */

// var default_server = 'http://10.28.10.175:5000/translate';
var default_server = 'https://translate.argosopentech.com/translate';
var current_lang = 'zh'; // 当前页面语言（保持不变）
var target_lang = null;  // 当前选择的目标语言
var translation_cache = {}; // 缓存已翻译文本

function translateBatch(texts, targetLang, apiUrl = default_server) {
  return fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: texts, // ✅ 使用数组
      source: 'zh',
      target: targetLang,
      format: 'text',
    }),
  })
    .then(res => res.json())
    .then(res => res.translatedText); // 已是数组
}


function markTranslatableNodes(el) {
  function processNode(node) {
    if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim()) {
      const text = node.nodeValue.trim();
      const span = document.createElement('span');
      span.className = 'wait-translate';
      span.setAttribute('data-text-original', text);
      span.textContent = text;
      node.parentNode.replaceChild(span, node);
    } else if (
      node.nodeType === Node.ELEMENT_NODE &&
      !['CODE', 'PRE', 'SCRIPT', 'SELECT'].includes(node.tagName)
    ) {
      Array.from(node.childNodes).forEach(processNode);
    }
  }
  processNode(el);
}

function traverseAndBatchTranslate(config) {
  const nodes = Array.from(document.querySelectorAll('.wait-translate'));
  const texts = [];
  const nodeMap = [];

  nodes.forEach(node => {
    const original = node.getAttribute('data-text-original');
    if (original && !translation_cache[`${config.targetLang}:${original}`]) {
      texts.push(original);
      nodeMap.push(node);
    }
  });

  if (texts.length === 0) {
    // 直接从缓存渲染
    nodes.forEach(node => {
      const original = node.getAttribute('data-text-original');
      const translated = translation_cache[`${config.targetLang}:${original}`];
      if (translated) node.textContent = translated;
    });
    return;
  }

  translateBatch(texts, config.targetLang, config.apiUrl)
    .then(translatedList => {
      translatedList.forEach((translated, i) => {
        const node = nodeMap[i];
        const original = texts[i];
        if (!node || !original || translated === undefined) return;
        translation_cache[`${config.targetLang}:${original}`] = translated;
        node.textContent = translated;
      });

      // 处理剩余的缓存项
      nodes.forEach(node => {
        const original = node.getAttribute('data-text-original');
        const translated = translation_cache[`${config.targetLang}:${original}`];
        if (translated) node.textContent = translated;
      });
    })
    .catch(err => console.warn('翻译失败:', err));
}

function createLangSwitcher(initialLang, onLangChange) {
  const switcher = document.createElement('div');
  switcher.id = 'langSwitcher';
  Object.assign(switcher.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    width: '150px',
    background: 'white',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    userSelect: 'none',
    cursor: 'grab',
    zIndex: 9999,
    fontFamily: 'sans-serif',
  });

  const header = document.createElement('header');
  header.textContent = '拖动这里移动';
  header.style.cssText = 'padding:8px 12px;background:#f0f0f0;border-bottom:1px solid #ccc;cursor:grab;';
  switcher.appendChild(header);

  const select = document.createElement('select');
  select.style.cssText = 'width:100%;padding:8px 12px;border:none;outline:none;cursor:pointer;font-size:14px;border-radius:0 0 4px 4px;';
  [
    { code: 'zh', name: '中文' },
    { code: 'en', name: 'English' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'es', name: 'Español' },
    { code: 'de', name: 'Deutsch' },
    { code: 'fr', name: 'Français' },
  ].forEach(({ code, name }) => {
    const opt = document.createElement('option');
    opt.value = code;
    opt.textContent = name;
    if (code === initialLang) opt.selected = true;
    select.appendChild(opt);
  });

  switcher.appendChild(select);
  document.body.appendChild(switcher);

  // 拖拽逻辑
  let isDragging = false, startX, startY, startLeft, startTop;
  header.addEventListener('mousedown', e => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    const rect = switcher.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;
    header.style.cursor = 'grabbing';
    e.preventDefault();
  });
  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    let newLeft = Math.min(Math.max(0, startLeft + dx), window.innerWidth - switcher.offsetWidth);
    let newTop = Math.min(Math.max(0, startTop + dy), window.innerHeight - switcher.offsetHeight);
    Object.assign(switcher.style, { left: newLeft + 'px', top: newTop + 'px', right: 'auto', bottom: 'auto' });
  });
  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      header.style.cursor = 'grab';
    }
  });

  select.addEventListener('change', e => {
    const contentEl = document.querySelector('.content');
    onLangChange(contentEl, e.target.value);
  });
}

function changeLangTo(contentEl, targetLang, force = false) {
  if (targetLang === current_lang && !force) return;
  const apiUrl = default_server;
  if (contentEl) {
    traverseAndBatchTranslate({ current_lang, targetLang, apiUrl });
  }
  current_lang = targetLang;
}

function initTranslate(hook, vm) {
  hook.init(() => {
    createLangSwitcher(current_lang, changeLangTo);
    window.translate_fun = el => {
      markTranslatableNodes(el);
      changeLangTo(el, current_lang, true);
    };
  });

  hook.doneEach(() => {
    const contentEl = document.querySelector('.content');
    markTranslatableNodes(contentEl);
    changeLangTo(contentEl, current_lang, true);
  });
}

window.$docsify = window.$docsify || {};
window.$docsify.plugins = (window.$docsify.plugins || []).concat(initTranslate);
