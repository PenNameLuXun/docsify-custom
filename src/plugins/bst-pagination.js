// 全局对象引用
var globalObj =
  typeof window !== 'undefined'
    ? window
    : typeof global !== 'undefined'
      ? global
      : typeof self !== 'undefined'
        ? self
        : {};

// 简化 DOM 查询的工具函数模块
var query = (function () {
  function one(selector, context) {
    return (context || document).querySelector(selector);
  }

  one.all = function (selector, context) {
    return (context || document).querySelectorAll(selector);
  };

  one.engine = function (engine) {
    if (!engine.one) throw new Error('.one callback required');
    if (!engine.all) throw new Error('.all callback required');
    one = engine.one;
    one.all = engine.all;
    return one;
  };

  return one;
})();

// matches 选择器匹配函数
var elementProto = (globalObj.Element && globalObj.Element.prototype) || {};
var matches =
  elementProto.matches ||
  elementProto.webkitMatchesSelector ||
  elementProto.mozMatchesSelector ||
  elementProto.msMatchesSelector ||
  elementProto.oMatchesSelector;

function matchesSelector(el, selector) {
  if (!el || el.nodeType !== 1) return false;
  if (matches) return matches.call(el, selector);

  // 兼容 fallback：遍历查找
  var all = query.all(selector, el.parentNode);
  for (var i = 0; i < all.length; ++i) {
    if (all[i] === el) return true;
  }
  return false;
}

// 向上查找符合 selector 的 DOM 节点
function closest(el, selector, root) {
  root = root || document.documentElement;
  while (el && el !== root) {
    if (matchesSelector(el, selector)) return el;
    el = el.parentNode;
  }
  return matchesSelector(el, selector) ? el : null;
}


var css1 = `.docsify-pagination-container{display:flex;flex-wrap:wrap;justify-content:space-between;overflow:hidden;margin:5em 0 1em;border-top:1px solid rgba(0,0,0,.07)}
            .pagination-item{margin-top:2.5em}
            .pagination-item a,.pagination-item a:hover{text-decoration:none}
            .pagination-item a{color:currentColor}
            .pagination-item a:hover .pagination-item-title{text-decoration:underline}
            .pagination-item:not(:last-child) a .pagination-item-label,.pagination-item:not(:last-child) a .pagination-item-subtitle,.pagination-item:not(:last-child) a .pagination-item-title{opacity:.3;transition:all .2s}
            .pagination-item:last-child .pagination-item-label,.pagination-item:not(:last-child) a:hover .pagination-item-label{opacity:.6}
            .pagination-item:not(:last-child) a:hover .pagination-item-title{opacity:1}
            .pagination-item-label{font-size:.8em}
            .pagination-item-label>*{line-height:1;vertical-align:middle}
            .pagination-item-label svg{height:.8em;width:auto;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round;stroke-width:1px}
            .pagination-item--next{margin-left:auto;text-align:right}
            .pagination-item--next svg{margin-left:.5em}
            .pagination-item--previous svg{margin-right:.5em}
            .pagination-item-title{font-size:1.6em}
            .pagination-item-subtitle{text-transform:uppercase;opacity:.3}`


function set_css() {
  if (typeof document !== 'undefined') {
    var styleEl = document.createElement('style');
    styleEl.type = 'text/css';
    styleEl.appendChild(document.createTextNode(css1));
    (document.head || document.getElementsByTagName('head')[0]).appendChild(
      styleEl,
    );
  }
}


// 工具类，用于生成分页信息
function PaginationLink(anchorEl) {
  if (!(this instanceof PaginationLink)) throw new TypeError("Use 'new'");
  if (!anchorEl) return;
  var li = closest(anchorEl, 'div > ul > li');
  this.chapter = query('p', li);
  this.hyperlink = anchorEl.href ? anchorEl : query('a', anchorEl);
}

PaginationLink.prototype.toJSON = function () {
  if (!this.hyperlink) return;
  return {
    name: this.hyperlink.innerText,
    href: this.hyperlink.getAttribute('href'),
    chapterName: this.chapter ? this.chapter.innerText : '',
    isExternal: this.hyperlink.getAttribute('target') === '_blank',
  };
};

// 创建分页容器 HTML
function createPaginationContainer() {
  return '<div class="docsify-pagination-container"></div>';
}

// 生成分页 HTML 内容
function renderPagination(data, config) {
  var currentPath = config.route.path;
  var output = [];

  var prev = data.prev && new PaginationLink(data.prev).toJSON();
  var next = data.next && new PaginationLink(data.next).toJSON();

  if (prev) {
    output.push(`
        <div class="pagination-item pagination-item--previous">
          <a href="${prev.href}" ${prev.isExternal ? 'target="_blank"' : ''}>
            <div class="pagination-item-label">
              <svg width="10" height="16" viewBox="0 0 10 16"><polyline fill="none" vector-effect="non-scaling-stroke" points="8,2 2,8 8,14"/></svg>
              <span>${config.previousText}</span>
            </div>
            <div class="pagination-item-title">${prev.name}</div>
            ${config.crossChapterText ? `<div class="pagination-item-subtitle">${prev.chapterName}</div>` : ''}
          </a>
        </div>
      `);
  }

  if (next) {
    output.push(`
        <div class="pagination-item pagination-item--next">
          <a href="${next.href}" ${next.isExternal ? 'target="_blank"' : ''}>
            <div class="pagination-item-label">
              <span>${config.nextText}</span>
              <svg width="10" height="16" viewBox="0 0 10 16"><polyline fill="none" vector-effect="non-scaling-stroke" points="2,2 8,8 2,14"/></svg>
            </div>
            <div class="pagination-item-title">${next.name}</div>
            ${config.crossChapterText ? `<div class="pagination-item-subtitle">${next.chapterName}</div>` : ''}
          </a>
        </div>
      `);
  }

  return output.filter(Boolean).join('');
}
function install(hook, vm) {
  var config = Object.assign(
    {
      previousText: 'PREVIOUS',
      nextText: 'NEXT',
      crossChapter: false,
      crossChapterText: false,
    },
    vm.config.pagination || {},
  );

  // 渲染分页组件
  function updatePagination() {
    var container = query('.docsify-pagination-container');
    if (!container) return;

    try {
      var currentPath = vm.router.toURL(vm.route.path);
      var allLinks = Array.from(query.all('.sidebar-nav li a')).filter(
        link => !matchesSelector(link, '.section-link'),
      );

      var currentIndex = allLinks.findIndex(link => {
        var href = decodeURIComponent(link.getAttribute('href').split('?')[0]);
        return href === decodeURIComponent(currentPath);
      });

      var prevLink = allLinks[currentIndex - 1];
      var nextLink = allLinks[currentIndex + 1];

      //console.log('config.previousText:', config.previousText,currentPath,vm.route.path);
      //console.log('config.nextText:', config.nextText);

      

    //   if(!prevLink){
    //     prevLink = allLinks[allLinks.length - 1];
    //   }

    
      if (vm.route.path == '/') {
        if (!nextLink) {
          nextLink = allLinks[0];
          prevLink = null
        }
      }
      //console.log("prevLink:",prevLink,"nextLink:",nextLink,currentPath)

      var resolvedTexts = {};
      ['previousText', 'nextText'].forEach(function (key) {
        var rawVal = config[key];
        //console.log("rawVal:",rawVal)
        if (typeof rawVal === 'string') {
          resolvedTexts[key] = rawVal;
        } else if (typeof rawVal === 'object') {
          var matched = Object.keys(rawVal).find(function (prefix) {
            return vm.route.path && vm.route.path.startsWith(prefix);
          });
          resolvedTexts[key] = matched
            ? rawVal[matched]
            : Object.values(rawVal)[0];
        }
      });

      container.innerHTML = renderPagination(
        { prev: prevLink, next: nextLink },
        {
          route: vm.route,
          previousText: resolvedTexts.previousText,
          nextText: resolvedTexts.nextText,
          crossChapterText: config.crossChapterText,
        },
      );
    } catch (err) {
      console.warn('Docsify pagination error:', err);
    }
  }

  hook.init(function(){
    set_css()
  });

  

  hook.afterEach(function (html) {
    return html + createPaginationContainer();
  });
  hook.ready(updatePagination)

  hook.doneEach(function(){
    //setTimeout(() => {
        updatePagination();
    //}, 1000);
  });
}

window.$docsify = window.$docsify || {};
$docsify.plugins = [install, ...($docsify.plugins || [])];
