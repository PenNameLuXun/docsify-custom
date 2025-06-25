import { Docsify } from '../core/Docsify';

/* bst sidebar custom */
function install(hook, vm) {
  const dom = Docsify.dom;

  function isVisibleInAside(el, aside, off_h = 0) {
    // var height = sidebar.clientHeight;
    // var active_top = top;
    // var active_bot = active_top + el.clientHeight;
    // var sidebar_top_border = sidebar.scrollTop;
    // var sidebar_bot_border = sidebar.scrollTop + height - 30;
    // var isInView = active_top >= sidebar_top_border && active_bot <= sidebar_bot_border;

    const elRect = el.getBoundingClientRect();
    const asideRect = aside.getBoundingClientRect();

    // 判断 el 是否完全或部分出现在 aside 的可视范围内
    const verticallyVisible =
      elRect.bottom > asideRect.top && elRect.top < asideRect.bottom - off_h;
    const horizontallyVisible =
      elRect.right > asideRect.left && elRect.left < asideRect.right;

    return verticallyVisible && horizontallyVisible;
  }
  function scrollToActive(el) {
    if (el) {
      var sidebar = document.querySelector('.sidebar');
      var sidebar_toggle = document.querySelector('.sidebar-toggle');
      // var off_h = sidebar_toggle
      //   ? sidebar_toggle.getBoundingClientRect().height
      //   : 0;
      // off_h += 20;
      var off_h = 20;
      var active = sidebar.querySelector('li.active');
      active && active.classList.remove('active');
      el.classList.add('active');
      if (!isVisibleInAside(el, sidebar, off_h)) {
        const top = el.getBoundingClientRect().top;
        //尽量显示到中间位置
        const off_height =
          top -
          (sidebar.getBoundingClientRect().top +
            sidebar.getBoundingClientRect().height / 2);

        console.log(
          'set sidebar.scrollTop to = ',
          sidebar.scrollTop + off_height,
          off_height,
        );
        sidebar.scrollTop = sidebar.scrollTop + off_height;
      }
    }
  }

  function openActiveSubSidebar() {
    requestAnimationFrame(function () {
      let active = document.querySelector('.app-sub-sidebar > .active');
      if (active) {
        // 递归展开所有上级子菜单
        let parent = active.parentNode;
        while (
          parent &&
          parent.classList &&
          parent.classList.contains('app-sub-sidebar') &&
          parent.classList.contains('collapse')
        ) {
          parent.classList.remove('collapse');
          parent = parent.parentNode;
        }
      }
    });
  }

  // 支持多层查找最近的指定标签元素
  function findParent(el, tagName) {
    tagName = tagName.toUpperCase();
    while (el && el.tagName !== tagName) {
      el = el.parentNode;
    }
    return el;
  }

  function isVaidClick(event) {
    const clickY = event.clientY;
    if (event.target.tagName === 'LI') {
      const li = event.target;
      const firstP = li.querySelector('p');
      if (!firstP) return false;
      const rect = firstP.getBoundingClientRect();
      return clickY >= rect.top && clickY <= rect.bottom;
    } else if (event.target.tagName === 'UL') {
      const firstA = event.target.querySelector('a');
      if (!firstA) return false;
      const rect = firstA.getBoundingClientRect();
      return clickY >= rect.top && clickY <= rect.bottom;
    }
    //console.log("event.target.tagName",event.target.tagName);
    return true;
  }
  function handleSidebarClick(e) {
    // console.log("content = ", "222", e.target,e.target.tagName,"clickedEl = ",clickedEl);
    if (!isVaidClick(e)) {
      return;
    }
    // 找到点击元素最近的 LI
    const li = findParent(e.target, 'LI');
    if (!li) return;

    if (li.classList.contains('folder')) {
      if (!li.classList.contains('collapse')) {
        li.classList.add('collapse');
      } else {
        // // 打开当前 li，关闭同级其他 open 状态
        // const siblings = Array.from(li.parentNode.children).filter(child => child !== li);
        // siblings.forEach(sib => {
        //   sib.classList.add("collapse");
        // });
        li.classList.remove('collapse');
        // 确保父级全部展开
        let parent = li.parentNode;
        while (
          parent &&
          parent.classList &&
          parent !== document.querySelector('.sidebar-nav')
        ) {
          if (
            parent.classList.contains('app-sub-sidebar') ||
            parent.tagName === 'LI'
          ) {
            parent.classList.remove('collapse');
          }
          parent = parent.parentNode;
        }
      }
    }
  }

  function getActiveItem() {
    let el = document.querySelector('.sidebar-nav .active');
    if (!el) {
      const hashLink = decodeURIComponent(location.hash).replace(/ /g, '%20');
      const link = document.querySelector(`.sidebar-nav a[href="${hashLink}"]`);
      if (link) {
        el = findParent(link, 'LI');
        if (el) el.classList.add('active');
      }
    }
    return el;
  }

  function open_it_list(el) {
    if (!el) return;
    //el.classList.remove("collapse");
    // 递归展开所有父级
    let parent = el.parentNode;
    while (parent && parent !== document.querySelector('.sidebar-nav')) {
      if (
        parent.classList &&
        (parent.classList.contains('app-sub-sidebar') ||
          parent.tagName === 'LI')
      ) {
        parent.classList.remove('collapse');
      }
      parent = parent.parentNode;
    }
  }

  function clearActiveState(el) {
    if (!el) return;
    el.classList.remove('active', 'open');
    let parent = el.parentNode;
    while (parent && parent !== document.querySelector('.sidebar-nav')) {
      if (
        parent.classList &&
        (parent.classList.contains('app-sub-sidebar') ||
          parent.tagName === 'LI')
      ) {
        parent.classList.remove('open');
        parent.classList.add('collapse');
      }
      parent = parent.parentNode;
    }
  }

  document.addEventListener('scroll', openActiveSubSidebar);

  const STORAGE_KEY = 'DOCSIFY_SIDEBAR_PIN_FLAG';

  function toggleSidebarPin() {
    const pinned = localStorage.getItem(STORAGE_KEY) === 'true';
    localStorage.setItem(STORAGE_KEY, !pinned);
    const sidebar = document.querySelector('.sidebar');
    if (pinned) {
      sidebar.style.transform = 'translateX(0)';
    } else {
      sidebar.style.transform = 'translateX(300px)';
    }
  }

  (function () {
    if (document.documentElement.clientWidth <= 768) {
      localStorage.setItem(STORAGE_KEY, 'false');
      const pinBtn = document.createElement('button');
      pinBtn.classList.add('sidebar-pin');
      pinBtn.onclick = toggleSidebarPin;
      document.body.append(pinBtn);

      window.addEventListener('load', () => {
        const content = document.querySelector('.content');
        document.body.onclick = content.onclick = e => {
          if (
            (e.target === document.body || e.currentTarget === content) &&
            localStorage.getItem(STORAGE_KEY) === 'true'
          ) {
            toggleSidebarPin();
          }
        };
      });
    }
  })();

  function resolveDuplicateLinks(content, aliasMap = {}) {
    const regex = /\[[^\]]+]\(([^)]+?)\)/g; // 捕获所有 [xxx](path.xxx) 样式的链接
    const pathCount = {};

    const newContent = content.replace(regex, (match, path) => {
      if (!pathCount[path]) {
        pathCount[path] = 1;
        return match;
      }

      const count = pathCount[path]++;
      const newPath = path.replace(/(\.[^./?#]+)([#?]?.*)$/, `_${count}$1$2`);

      console.log('replace path = ', path, newPath);

      aliasMap[newPath.replace('.md', '')] = path.replace('.md', '');
      return match.replace(path, newPath);
    });

    return newContent;
  }

  var bst_force_loose = false;
  function bst_sidebar_render(text) {
    bst_force_loose = true;
    return resolveDuplicateLinks(text, vm.compiler.config.alias);
  }
  var other_li = null;
  var other_li_ul = null;

  function bst_sidebar_rendered() {
    console.log('bst_sidebar_rendered');
    bst_force_loose = false;
    document.querySelectorAll('.sidebar-nav li').forEach(li => {
      if (li.querySelector('ul')) {
        li.classList.add('folder', 'collapse');

        const has_p = li.querySelector(':scope>p');
        if (!has_p) {
          //添加一个p包裹
          //console.log("li no p:",li,li.innerHTML)
          for (const node of li.childNodes) {
            if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim()) {
              const p = document.createElement('p');
              p.textContent = node.nodeValue.trim();
              li.replaceChild(p, node);
              break;
            }
          }
        }

        const hasLink = li.querySelector(':scope>p>a');
        // if(!hasLink){
        //   hasLink = li.querySelector(':scope>a');
        // }
        if (hasLink) li.classList.add('hascontent');
      } else {
        li.classList.add('file');
      }
    });
    // 找到类名是 sidebar-nav 的第一个元素
    const sidebarNav = document.querySelector('.sidebar-nav');
    // 找到 sidebar-nav 下的第一个 ul
    const firstUl = sidebarNav.querySelector('ul');
    // 创建新的 li 元素
    const newLi = document.createElement('li');
    // 创建 p 元素
    const newP = document.createElement('p');
    newP.textContent = '其他';
    // 把 p 放进 li
    newLi.appendChild(newP);
    other_li_ul = document.createElement('ul');
    newLi.appendChild(other_li_ul);
    // 把 li 添加到 ul 里
    firstUl.appendChild(newLi);
    newLi.classList.add('folder', 'collapse');
    other_li = newLi;
  }

  function on(el, type, handler) {
    // isFn(type)
    //   ? window.addEventListener(el, type)
    //   : el.addEventListener(type, handler);
    el.addEventListener(type, handler);
  }
  function btn(el) {
    var toggle = function (_) { return document.body.classList.toggle('close'); };

    //el = getNode(el);
    if (el === null || el === undefined) {
      return;
    }

    on(el, 'click', function (e) {
      e.stopPropagation();
      toggle();
    });

    // isMobile &&
    //   on(
    //     document.body,
    //     'click',
    //     function (_) { return body.classList.contains('close') && toggle(); }
    //   );
  }

  hook.mounted(_ => {
    // const div = dom.create('div');
    // div.id = 'gitalk-container';
    // const main = dom.getNode('#main');
    // div.style = `width: ${main.clientWidth}px; margin: 0 auto 20px;`;
    // dom.appendTo(dom.find('.content'), div);

    const toggleElm = document.querySelector('button.sidebar-toggle');
    console.log("toggleElm:",toggleElm)

    btn(toggleElm, vm.router);
  });
  hook.init(_ => {
    window.bst_sidebar_rendered = bst_sidebar_rendered;
    window.bst_sidebar_render = bst_sidebar_render;
    window.bst_force_loose = bst_force_loose;

    // const toggleElm = document.querySelector('button.sidebar-toggle');
    // console.log("toggleElm:",toggleElm)

    // btn(toggleElm, vm.router);
  });

  hook.doneEach((content, next) => {
    var current_li = null;
    var hash = decodeURI(vm.router.toURL(vm.router.getCurrentPath()));
    var curFileName = vm.router.parse().file;
    var fileNameOnly = curFileName.split('/').pop();
    var context_header = vm.compiler.cacheTOC[curFileName]
      ? vm.compiler.cacheTOC[curFileName][0]
      : null;
    var title = context_header ? context_header.title : fileNameOnly;
    document.querySelectorAll('.sidebar-nav li').forEach(li => {
      var a_in_li = li.querySelector('a');
      if (a_in_li) {
        var hrefValue = decodeURI(a_in_li.getAttribute('href'));

        hash = hash.replace(/\?id.*/, '');
        if (hrefValue === hash) {
          current_li = li;
        }
      }
    });
    //console.log("current_li = ",current_li)
    if (!current_li && other_li_ul) {
      var temp_li = document.createElement('li');
      temp_li.innerHTML = `<p><a href='${hash}'>${title}</a></p>`;
      other_li_ul.appendChild(temp_li);
      current_li = temp_li;
    }
    if (current_li) {
      //找到了这个相关的导航节点,那么展开它
      open_it_list(current_li);
      scrollToActive(current_li);
    }
    next(content);
  });
  hook.ready(function () {
    document
      .querySelector('.sidebar-nav')
      .addEventListener('click', handleSidebarClick);
  });
  var last_sidebar = null;
  hook.on_fetch(function (route, next) {
    if (vm.config.loadSidebar) {
      var path = window.Docsify.util.getParentPath(route.path);
      const qs = window.Docsify.util.stringifyQuery(route.query, ['id']);
      var sidebar_file = vm.router.getFile(path + vm.config.loadSidebar) + qs;

      if (last_sidebar != sidebar_file) {
        window.Docsify.get(sidebar_file, false, vm.config.requestHeaders).then(
          function (sidebar_content) {
            resolveDuplicateLinks(sidebar_content, vm.compiler.config.alias);
            next();
          },
          next,
        );
        last_sidebar = sidebar_file;
      } else {
        next();
      }
    }
  });
}

window.$docsify = window.$docsify || {};
$docsify.plugins = [install, ...($docsify.plugins || [])];
