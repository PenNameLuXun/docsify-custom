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

var default_server = 'http://10.28.10.175:5000/translate';

var current_lang = 'zh';
var target_lang = null;

var first_trans = true;

function translateText(text, current_lang, targetLang, apiUrl) {
  //console.log('apiUrl:', apiUrl);
  return fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: text,
      //source: 'auto',
      source: 'zh',
      target: targetLang,
      format: 'text',
    }),
  })
    .then(res => res.json())
    .then(res => res.translatedText);
}

function translateHtml(
  text,
  targetLang,
  callback = null,
  apiUrl = default_server,
) {
  return fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: text,
      source: 'zh',
      target: targetLang,
      format: 'html',
    }),
  })
    .then(res => res.json())
    .then(res => {
      const translated = res.translatedText;
      if (typeof callback === 'function') {
        callback(translated); // ✅ 执行回调函数
      }
      return translated; // 同时继续返回 Promise 值
    })
    .catch(err => {
      console.error('翻译出错:', err);
      if (typeof callback === 'function') {
        callback(null, err); // 传递错误给回调函数
      }
    });
}

function traverseAndTranslate(config) {
  const nodes = document.querySelectorAll('.wait-translate');

  let index = 0;

  function processNext() {
    if (index >= nodes.length) return;

    const node = nodes[index++];
    const originalText = node.getAttribute('data-text-original');

    translateText(
      originalText,
      config.current_lang,
      config.targetLang,
      config.apiUrl,
    )
      .then(translated => {
        //console.log('originalText:', originalText, 'translated:', translated);
        node.textContent = translated;
        processNext();
      })
      .catch(err => {
        console.warn('Translation error:', err);
        processNext();
      });
  }

  processNext();
}

function createLangSwitcher(initialLang, onLangChange) {
  // 创建浮动div
  const switcher = document.createElement('div');
  switcher.id = 'langSwitcher';
  switcher.style.position = 'fixed';
  switcher.style.top = '20px';
  switcher.style.right = '20px';
  switcher.style.width = '150px';
  switcher.style.background = 'white';
  switcher.style.border = '1px solid #ccc';
  switcher.style.borderRadius = '4px';
  switcher.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
  switcher.style.userSelect = 'none';
  switcher.style.cursor = 'grab';
  switcher.style.zIndex = 9999;
  switcher.style.fontFamily = 'sans-serif';

  // 创建header
  const header = document.createElement('header');
  header.textContent = '拖动这里移动';
  header.style.padding = '8px 12px';
  header.style.background = '#f0f0f0';
  header.style.borderBottom = '1px solid #ccc';
  header.style.cursor = 'grab';
  switcher.appendChild(header);

  // 创建select
  const select = document.createElement('select');
  select.id = 'languageSelect';
  select.setAttribute('aria-label', '选择语言');
  select.style.width = '100%';
  select.style.padding = '8px 12px';
  select.style.border = 'none';
  select.style.outline = 'none';
  select.style.cursor = 'pointer';
  select.style.fontSize = '14px';
  select.style.borderRadius = '0 0 4px 4px';

  const languages = [
    { code: 'zh', name: '中文' },
    { code: 'en', name: 'English' },
    // { code: 'ja', name: '日本語' },
    // { code: 'ko', name: '한국어' },
    // { code: 'es', name: 'Español' },
    // { code: 'de', name: 'Deutsch' },
    // { code: 'fr', name: 'Français' },
    // { code: null, name: '原文' },
  ];

  languages.forEach(({ code, name }) => {
    const option = document.createElement('option');
    option.value = code;
    option.textContent = name;
    if (code === initialLang) option.selected = true;
    select.appendChild(option);
  });

  switcher.appendChild(select);
  document.body.appendChild(switcher);

  // 拖拽逻辑
  let isDragging = false;
  let startX, startY, startLeft, startTop;

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
    let newLeft = startLeft + dx;
    let newTop = startTop + dy;
    const maxLeft = window.innerWidth - switcher.offsetWidth;
    const maxTop = window.innerHeight - switcher.offsetHeight;
    newLeft = Math.min(Math.max(0, newLeft), maxLeft);
    newTop = Math.min(Math.max(0, newTop), maxTop);
    switcher.style.left = newLeft + 'px';
    switcher.style.top = newTop + 'px';
    switcher.style.right = 'auto';
    switcher.style.bottom = 'auto';
  });

  window.addEventListener('mouseup', e => {
    if (isDragging) {
      isDragging = false;
      header.style.cursor = 'grab';
    }
  });

  // 语言切换回调
  select.addEventListener('change', e => {
    const contentEl = document.querySelector('.content');
    onLangChange(contentEl,e.target.value);
  });
}

function changeLangTo(contentEl,targetLang,force=false) {
  if (targetLang === current_lang && !force) return;
  if (targetLang) {
    //const config = window.$docsify.translate || {};
    var apiUrl = default_server;

    //const contentEl = document.querySelector('.content');
    if (contentEl) {
      traverseAndTranslate({ current_lang, targetLang, apiUrl });
    }
  }
  current_lang = targetLang;
}

function markTranslatableNodes(el) {
  //const el = document.querySelector('.content');
  function processNode(node) {
    if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim()) {
      const span = document.createElement('span');
      span.className = 'wait-translate';
      span.setAttribute('data-text-original', node.nodeValue.trim());
      span.textContent = node.nodeValue;
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

function initTranslate(hook, vm) {
  hook.init(function () {
    createLangSwitcher(current_lang, changeLangTo);
    window.translate_fun = function(el){
        markTranslatableNodes(el)
        changeLangTo(el,current_lang,true)
    }
  });

//   hook.afterEach(function (html, next) {
//     translateHtml(html, 'en', next);
//   });
  hook.doneEach(() => {
    const contentEl = document.querySelector('.content');
    //逐元素翻译
    markTranslatableNodes(contentEl)
    changeLangTo(contentEl,current_lang,true)
  });
}

window.$docsify = window.$docsify || {};
window.$docsify.plugins = (window.$docsify.plugins || []).concat(initTranslate);
