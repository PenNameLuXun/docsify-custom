import { Docsify } from '../core/Docsify';
import { noop } from '../core/util';

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
  function isSidebarVisibal() {
    const sidebar = document.querySelector('.sidebar-nav');

    function isVisible(el) {
      return !!(el && el.offsetParent !== null);
    }

    return isVisible(sidebar); // true 表示可见
  }
  function scrollToActive(el) {
    if(!isSidebarVisibal())return;
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


  var components = []
  // function parse_compoments(content,callback){

  //   content = content.replace(
  //     /^\s*\*\s*@@([^@]+?)@@.*$/gm,
  //     (match, raw) => {

  //       const parts = raw.trim().split('|');
  //       console.log("parts:",parts,"raw:",raw);

  //       // 防御性校验
  //       if (parts.length !== 4) {
  //         console.warn('[docsify-component] 非法组件定义:', raw);
  //         return ''; // 删除该行
  //       }

  //       const [stringId, name, versionStr, pathStr] = parts;

  //       const versions = versionStr.split(',').map(v => v.trim());
  //       const paths = pathStr.split(',').map(p => p.trim());


  //       var compose_sidebar;
  //       //1.根据版本去fetch对应的文件夹中的sidebar文件内容
  //       //2.将获取到的内容作为组件的二级目录填充到后续中
  //       //var path = window.Docsify.util.getParentPath(route.path);
  //       //const qs = window.Docsify.util.stringifyQuery(route.query, ['id']);
  //       //var sidebar_file = vm.router.getFile(path + vm.config.loadSidebar) + qs;

  //       var sidebar_file = paths[0]+"/_sidebar.md";

  //       window.Docsify.get(sidebar_file, false, vm.config.requestHeaders)
  //       .then(
  //           function (sidebar_content) {
  //             //resolveDuplicateLinks(sidebar_content, vm.compiler.config.alias);
  //             noop;
  //           },
  //           noop,
  //         );

  //       components.push({
  //         stringId,
  //         name,
  //         versions,
  //         paths
  //       });

  //       // 核心：删除组件声明行（包括 @@）
  //       return `* ${name}`;
  //     }
  //   );

  //   return content
  // }
   var bst_force_loose = false;
  // function bst_sidebar_render(text,callback=noop) {
  //   text = parse_compoments(text,callback);
  //   //bst_force_loose = true;
  //   //return resolveDuplicateLinks(text, vm.compiler.config.alias);

  //   callback(text)
  // }

function indentSidebar(md, level = 1) {
  const prefix = '  '.repeat(level);
  return md
    .split('\n')
    .map(line => line.trim() ? prefix + line : line)
    .join('\n');
}
function injectComponentSidebars(text, components) {
  components.forEach(comp => {
    const placeholder = `<!-- BST-COMPONENT:${comp.stringId} -->`;


    console.log(
  'sidebars snapshot:',
  JSON.parse(JSON.stringify(comp.sidebars))
);
    // 示例：只用第一个版本
    const sidebar = comp.sidebars[comp.versions[0]] || '';

    //console.log("comp.stringId:",comp.stringId,"sidebar:\n",sidebar,comp.versions[0],comp.sidebars[comp.versions[0]],comp.sidebars)

    const injected = indentSidebar(sidebar, 1);

    text = text.replace(placeholder, injected);
  });

  return text;
}
  function parse_compoments(content) {

  const fetchTasks = []; // 保存所有异步任务

  content = content.replace(
    /^\s*\*\s*@@([^@]+?)@@.*$/gm,
    (match, raw) => {

      const parts = raw.split('|').map(p => p.trim());

      if (parts.length !== 4) {
        console.warn('[docsify-component] 非法组件定义:', raw);
        return '';
      }

      const [stringId, name, versionStr, pathStr] = parts;

      const versions = versionStr.split(',').map(v => v.trim());
      const paths = pathStr.split(',').map(p => p.trim());

      const component = {
        stringId,
        name,
        versions,
        paths,
        vpaths:{},
        sidebars: {} // version -> sidebar content
      };

      // paths.forEach((path,idx)=>{
      //   vpaths[path]=
      // });

      // 为每个版本创建 fetch 任务
      versions.forEach((version, idx) => {
        component.vpaths[version]=component.paths[idx];
        //const sidebarFile = paths[idx] + '/_sidebar.md';
        const sidebarFile = "/overview/_sidebar.md"
        // 包装成 Promise
        const task = new Promise(resolve => {
            const thenable = window.Docsify.get(sidebarFile, false, vm.config.requestHeaders);
            
            thenable.then(
              (content) => {
                component.sidebars[version] = content;
                resolve(content); // 标准 Promise resolve
              },
              (err) => {
                component.sidebars[version] = '';
                console.warn(`[docsify-component] sidebar 加载失败: ${sidebarFile}`);
                resolve(''); // 即使失败也 resolve
              }
            );
          });
        console.log("task instanceof Promise:",task instanceof Promise,window.Docsify.get); // 必须输出 true
        fetchTasks.push(task);
      });

      components.push(component);

      // 同步阶段只负责生成 Markdown
      return `* ${name}\n<!-- BST-COMPONENT:${stringId} -->`;
    }
  );

  return {
    text: content,
    promises: fetchTasks
  };
}

  function bst_sidebar_render(text, callback) {

    const result = parse_compoments(text);

    // 没有异步任务，直接继续
    if (!result.promises.length) {
      callback(result.text);
      return;
    }

    // 等待所有组件目录加载完成
    Promise.all(result.promises)
      .then(() => {
        console.log('ALL sidebars:', JSON.parse(JSON.stringify(components)));
        // 所有 sidebar 已就绪
      const finalText = injectComponentSidebars(
        result.text,
        components
      );
      //console.log("finalText:\n",finalText);
        // 所有 sidebar 已就绪
        callback(finalText);
      })
      .catch(err => {
        console.error('[docsify-component] sidebar 加载异常', err);
        // 即使异常，也不能阻断 Docsify
        callback(result.text);
      });
  }

  function addVersionSelectorToTopLevelLi() {
    const topLis = document.querySelectorAll('.sidebar-nav > ul > li');

    topLis.forEach(li => {
      // 防止重复添加
      if (li.querySelector('.version-select')) return;

      const p = li.querySelector(':scope > p');
      if (!p) return;

      p.nodeValue;
      //console.log("p:",p,"textContent:",p.textContent);
      var component = vm.compiler.config.components[p.textContent];
      if(component){
        console.log("component = ",component);
        const cname = p.textContent;
        p.textContent=component.title;

        if(component.versions){
          const select = document.createElement('select');
          select.className = 'version-select';

          Object.entries(component.versions).forEach(([version, path]) => {
            const option = document.createElement('option');
            option.value = version;        // v1.0.0
            option.textContent = version;  // 显示版本号
            option.dataset.path = path;    // 保存文档路径（非常关键）
            option.dataset.cname = cname  //组件名字
            select.appendChild(option);
          });
          // 阻止触发折叠
          select.addEventListener('click', e => e.stopPropagation());

          // 版本切换逻辑（示例）
          
          select.addEventListener('change', e => {
            const selectEl = e.target;
            const option = selectEl.selectedOptions[0]; // 当前选中的 option

            const version = option.value;
            const path = option.dataset.path;
            const cname = option.dataset.cname;

            console.log('component:', cname);
            console.log('version:', version);
            console.log('path:', path);
          });

          p.appendChild(select);
        }
      }
      
      

      


      
    });
}
  var other_li = null;
  var other_li_ul = null;

  function bst_sidebar_rendered() {
    console.log('bst_sidebar_rendered,base path:',vm.compiler.config);
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
    /* 新增：版本选择框 */
    addVersionSelectorToTopLevelLi();
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
    }else{
      next();
    }
  });
}

window.$docsify = window.$docsify || {};
$docsify.plugins = [install, ...($docsify.plugins || [])];
