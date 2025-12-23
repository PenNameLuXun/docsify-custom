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

    function removeHash(url) {
      return url.split('#')[0];
    }

    const newContent = content.replace(regex, (match, path) => {
      path = removeHash(path)
      if (!pathCount[path]) {
        pathCount[path] = 1;
        return match;
      }

      const count = pathCount[path]++;
      
      const newPath = path.replace(/(\.[^./?#]+)([#?]?.*)$/, `_${count}$1$2`);

      //console.log('replace path = ', path, newPath);

      aliasMap[newPath.replace('.md', '')] = path.replace('.md', '');
      return match.replace(path, newPath);
    });

    return newContent;
  }


  var g_components = []
  var g_components_user_config={}

  function save_compoients(){
    localStorage.setItem('componentInfo', JSON.stringify(g_components_user_config));
  }


  function parseHashQuery(hash) {
  if (!hash) return {};

  // 去掉开头 #
  const clean = hash.startsWith('#') ? hash.slice(1) : hash;

  // 拆 path 和 query
  const idx = clean.indexOf('?');
  if (idx === -1) return {};

  const queryStr = clean.slice(idx + 1);
  const params = new URLSearchParams(queryStr);

  const result = {};
  for (const [k, v] of params.entries()) {
    result[k] = v;
  }

  return result;
}

  function load_compoients(){
    const str = localStorage.getItem('componentInfo');
    //console.log("str:",str)

    g_components_user_config = str ? JSON.parse(str) : null;

    if(!g_components_user_config){
      console.log("init  g_components_user_config to object.");
      g_components_user_config={};
    }
    console.log("init window url:",window.location.hash)

    //let href_1 = vm.router.toURL(window.location.hash, null, vm.router.getCurrentPath());

    const { cid, ver } = parseHashQuery(window.location.hash);
    if (cid && ver) {
      if (!g_components_user_config[cid]) {
        g_components_user_config[cid] = {};
      }
      g_components_user_config[cid].current_user_version = ver;
    }
    //console.log("g_components_user_config:",g_components_user_config)
  }

   var bst_force_loose = false;
  // function bst_sidebar_render(text,callback=noop) {
  //   text = parse_compoments(text,callback);
  //   //bst_force_loose = true;
  //   //return resolveDuplicateLinks(text, vm.compiler.config.alias);

  //   callback(text)
  // }

  function do_resolveDuplicateLinks(text){
    bst_force_loose = true;
    return resolveDuplicateLinks(text, vm.compiler.config.alias);
  }

function indentSidebar(md, indent,level = 1) {
  let prefix = '  '.repeat(level);
  prefix+=indent
  return md
    .split('\n')
    .map(line => line.trim() ? prefix + line : line)
    .join('\n');
}
function injectComponentSidebars(text, components) {
  components.forEach(comp => {
    const placeholder = `<!-- BST-COMPONENT:${comp.stringId} -->`;


//     console.log(
//   'sidebars snapshot:',
//   JSON.parse(JSON.stringify(comp.sidebars))
// );
    // 示例：只用第一个版本
    const current_version = g_components_user_config[comp.stringId].current_user_version
    const sidebar = comp.sidebars[current_version] || '';

    //console.log("comp.stringId:",comp.stringId,"sidebar:\n",sidebar,comp.versions[0],comp.sidebars[comp.versions[0]],comp.sidebars)

    const injected = indentSidebar(sidebar, comp.indent,1);

    text = text.replace(placeholder, injected);
  });

  return text;
}
  function parse_compoments(content) {

  const fetchTasks = []; // 保存所有异步任务

  content = content.replace(
    ///^\s*\*\s*@@([^@]+?)@@.*$/gm,
    /^(\s*)\*\s*@@([^@]+?)@@.*$/gm,
    (match, indent,raw) => {

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
        indent,
        vpaths:{},
        sidebars: {} // version -> sidebar content
      };

      let current_user_version = versions[0];
      if(g_components_user_config[stringId] && g_components_user_config[stringId].current_user_version){
        current_user_version=g_components_user_config[stringId].current_user_version;
        if(!versions.includes(current_user_version)){
          current_user_version = versions[0];
        }
      }else{
        if(!g_components_user_config[stringId]){
          g_components_user_config[stringId]={};
        }
        g_components_user_config[stringId]["current_user_version"] = current_user_version;
      }

      g_components_user_config[stringId]["raw"]=raw
      

      // 为每个版本创建 fetch 任务
      versions.forEach((version, idx) => {
        if(!g_components_user_config[stringId][version]){
          g_components_user_config[stringId][version] = {}
        }
        var abs_path = component.paths[idx];
        //console.log("abs_path:",abs_path)
        component.vpaths[version]=abs_path;
        const sidebarFile = paths[idx] + '/_sidebar.md';
        // 包装成 Promise
        //if(current_user_version == version)
          {
        const task = new Promise(resolve => {
            const thenable = window.Docsify.get(sidebarFile, false, vm.config.requestHeaders);
            
            thenable.then(
              (content) => {
                //针对content中的路径还得更新成
                //...todo
                function replace_path(content, abs_path) {
                  // 捕获 Markdown 中 [text](path) 的链接
                  const regex = /\[([^\]]+)]\(([^)]+?)\)/g;

                  const newContent = content.replace(regex, (match, text, path) => {
                    
                    // 如果 path 已经是绝对 URL 或以 / 开头，不加前缀
                    if (/^(https?:)?\/\//.test(path) || path.startsWith('/')) {
                      return match;
                    }

                    // 拼接绝对路径
                    const newPath = `${abs_path.replace(/\/$/, '')}/${path.replace(/^\.?\//, '')}`;

                    //console.log("1path:",path,newPath)

                    //if()
                    //:fragment=demo
                    const params = `cid=${stringId} ver=${version}`
                    // 返回替换后的 Markdown
                    return `[${text}](${newPath}){${params}}`;
                  });

                  return newContent;
                }

                content=replace_path(content,abs_path);

                component.sidebars[version] = content;
                g_components_user_config[stringId][version]["content"] = content;
                resolve(content); // 标准 Promise resolve
              },
              (err) => {
                component.sidebars[version] = '';
                g_components_user_config[stringId][version]["content"]="";
                console.warn(`[docsify-component] sidebar 加载失败: ${sidebarFile}`);
                resolve(''); // 即使失败也 resolve
              }
            );
          });
        //console.log("task instanceof Promise:",task instanceof Promise,window.Docsify.get); // 必须输出 true
        fetchTasks.push(task);
        }
      });

      g_components.push(component);

      // 同步阶段只负责生成 Markdown
      //console.log("raw:",raw);
      return `${indent}* @@${raw}\n<!-- BST-COMPONENT:${stringId} -->`;
    }
  );

  return {
    text: content,
    promises: fetchTasks
  };
}

  function bst_sidebar_render(text, callback) {

    const result = parse_compoments(text);

    function do_call_back(text){
      vm.compiler.renderer.options["force_loose"]=true
      callback(text);
      vm.compiler.renderer.options["force_loose"]=false
    }

    // 没有异步任务，直接继续
    if (!result.promises.length) {
      var finalText=do_resolveDuplicateLinks(result.text);
      do_call_back(finalText);
      return;
    }

    // 等待所有组件目录加载完成
    Promise.all(result.promises)
      .then(() => {
        //console.log('ALL sidebars:', JSON.parse(JSON.stringify(components)));
        // 所有 sidebar 已就绪
      var finalText = injectComponentSidebars(
        result.text,
        g_components
      );
      
      //console.log("parse_compoments finished:\n",vm.compiler.renderer);
        // 所有 sidebar 已就绪
        finalText = do_resolveDuplicateLinks(finalText);
        do_call_back(finalText);
      })
      .catch(err => {
        console.error('[docsify-component] sidebar 加载异常', err);
        // 即使异常，也不能阻断 Docsify
        finalText = do_resolveDuplicateLinks(result.text);
        do_call_back(finalText);
      });
  }


  function add_has_context_class(li_list = document.querySelectorAll('.sidebar-nav li')){
    li_list.forEach(li => {
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
        if (hasLink) li.classList.add('hascontent');
      } else {
        li.classList.add('file');
      }
    });
  }

function replaceUlWithComponentLis(parentEl, newUlHtml) {
  if (!parentEl) return;

  const ul = parentEl.querySelector(':scope > ul');
  if (!ul) return;

  /* 1️⃣ 解析 newUlHtml */
  const temp = document.createElement('div');
  temp.innerHTML = newUlHtml.trim();

  const newUl = temp.querySelector('ul');
  if (!newUl) return;

  const newLis = Array.from(newUl.children).filter(
    el => el.tagName === 'LI'
  );

  /* 2️⃣ 遍历原 ul 的直接 li */
  const originLis = Array.from(ul.children);

  originLis.forEach(li => {
    const p = li.querySelector(':scope > p.component');

    if (!p) {
      /* ❌ 不符合条件 → 删除 */
      li.remove();
      return;
    }

    /* ✅ 符合条件 → 插入新 li */
    newLis.forEach(newLi => {
      ul.insertBefore(newLi.cloneNode(true), li);
    });
  });
}


  function addVersionSelectorToTopLevelLi() {
    const select_nodes = document.querySelectorAll('.version-select');
    select_nodes.forEach(select=>{
      select.addEventListener('click', e => e.stopPropagation());
      select.addEventListener('change', e => {
            const selectEl = e.target;
            const option = selectEl.selectedOptions[0]; // 当前选中的 option

            const version = option.value;
            const path = option.dataset.path;
            const cname = option.dataset.cname;
            const cid = option.dataset.cid;

            g_components_user_config[cid]["current_user_version"]= version;
            console.log('component:', cname,cid);
            console.log('version:', version);
            console.log('path:', path);
            console.log("g_components_user_config for ",cid,":",g_components_user_config[cid])

            const new_sidebar  = g_components_user_config[cid][version].content;

            const new_ul_html = vm.compiler.sidebar(new_sidebar,5);

            function replaceFirstUl(parentEl, newUlHtml) {
              if (!parentEl) return;

              const ul = parentEl.querySelector(':scope > ul');
              if (!ul) return;

              ul.outerHTML = newUlHtml;
            }
            const pp_node = selectEl.parentNode.parentNode;

            replaceUlWithComponentLis(pp_node,new_ul_html);

            //为新添加的节点设置对应的 class 名字（folder file collapse），从而实现 sidebar 区域文件夹的收起和折叠
            add_has_context_class(pp_node.querySelectorAll('li'));

            //从当前切换的区域内查找可能存在的当前路径，如果不存在，那么跳转到当前区域的第一个文件去
            hight_sidebar_tag_by_current_path(pp_node.querySelectorAll('.file'),true);

            save_compoients();
            
          });
      
      select_nodes.forEach(selectEl => {
        const cid = selectEl.selectedOptions[0].dataset.cid;
        //console.log("cid:",cid)
        if (!cid) return;

        const config = g_components_user_config[cid];
        //console.log("config.current_user_version:",config.current_user_version)
        if (!config || !config.current_user_version) return;

        selectEl.value = config.current_user_version;
      });


    })

    return;

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

  function add_default_other_container(){
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

  function bst_sidebar_rendered() {
    console.log('bst_sidebar_rendered,base path:',vm.compiler.config);

    bst_force_loose = false;
    
    add_has_context_class();

    add_default_other_container()

    /* 新增：版本选择框 */
    addVersionSelectorToTopLevelLi();

    hight_sidebar_tag_by_current_path();
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
    //console.log("toggleElm:",toggleElm)

    btn(toggleElm, vm.router);

    //console.log("vm compiler:",vm.compiler,vm)
    //return;
    vm.compiler._marked.use({
      extensions: [{
        name: 'paramLink',
        level: 'inline',
        start(src) {
          return src.indexOf(']{');
        },
        tokenizer(src) {
          const match = /^\[([^\]]+)\]\(([^)]+)\)\{([^}]+)\}/.exec(src);
          if (!match) return;

          

          const [, text, href, paramStr] = match;
          const params = Object.fromEntries(
            paramStr.split(/\s+/).map(p => p.split('='))
          );

          let href_1 = vm.router.toURL(href, null, vm.router.getCurrentPath());
          if (!href_1.includes('?')) {
            href_1 += '?';
          } else {
            href_1 += '&';
          }
          //console.log("params.cid:",params.cid,"params.version:",params.version,params.ver)

          href_1+=`cid=${params.cid}&ver=${params.ver}`
          //console.log("href--:",href,href_1,params);
          
          return {
            type: 'paramLink',
            raw: match[0],
            text,
            href:href_1,
            params
          };
        },
        renderer(token) {
          //console.log("token.href:",token.href)
          return `<a href="${token.href}" data-cid="${token.params.cid}" data-version="${token.params.ver}">${token.text}</a>`;
        }
      }]
    });
  });
  hook.init(_ => {



    window.bst_sidebar_rendered = bst_sidebar_rendered;
    window.bst_sidebar_render = bst_sidebar_render;
    window.bst_force_loose = bst_force_loose;

    load_compoients();

    

    // const toggleElm = document.querySelector('button.sidebar-toggle');
    // console.log("toggleElm:",toggleElm)

    // btn(toggleElm, vm.router);
  });


  function normalizeHash(hash) {
    if (!hash) return '';

    // 去掉开头 #
    const clean = hash.startsWith('#') ? hash.slice(1) : hash;

    // 分离 path 和 query
    const idx = clean.indexOf('?');
    return idx === -1 ? `#${clean}` : `#${clean.slice(0, idx)}`;
  }
  function hight_sidebar_tag_by_current_path(top_node = document.querySelectorAll('.sidebar-nav .file'),choose_first_file_if_not_found = false){
    var current_li = null;
    var hash = decodeURI(vm.router.toURL(vm.router.getCurrentPath()));
    console.log("hight_sidebar_tag_by_current_path hash=======",hash);
    var curFileName = vm.router.parse().file;
    var fileNameOnly = curFileName.split('/').pop();
    var context_header = vm.compiler.cacheTOC[curFileName]
      ? vm.compiler.cacheTOC[curFileName][0]
      : null;
    var title = context_header ? context_header.title : fileNameOnly;
    const lis = top_node;
    console.log("hight_sidebar_tag_by_current_path:",lis.length);

    let first_li_href;
    for (const li of lis) {
      const a_in_li = li.querySelector('a');
      if (!a_in_li) continue;

      const hrefValue = decodeURI(a_in_li.getAttribute('href'));
      if(!first_li_href)first_li_href=hrefValue

      if (hash === hrefValue) {
        //console.log("hrefValue1:",hrefValue);
        current_li = li;
        break;
      }

      //const cleanHash = hash.replace(/\?id.*/, '');
      const cleanHash = normalizeHash(hash);
      if (normalizeHash(hrefValue) === cleanHash) {
        //console.log("hrefValue2:",hrefValue);
        current_li = li;
        break;
      }
    }
    //console.log("current_li = ",current_li,hash)
    if(!current_li){
      if(choose_first_file_if_not_found){
        //current_li = first_li;
        window.location.hash = first_li_href;
      }else{
        if(other_li_ul){
          var temp_li = document.createElement('li');
          temp_li.innerHTML = `<p><a href='${hash}'>${title}</a></p>`;
          other_li_ul.appendChild(temp_li);
          current_li = temp_li;
        }
      }
    }
    if (current_li) {
      //找到了这个相关的导航节点,那么展开它
      open_it_list(current_li);
      scrollToActive(current_li);
    }
  }

  hook.doneEach((content, next) => {
    hight_sidebar_tag_by_current_path();
    console.log("hook.doneEach:",vm.compiler.config)
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
            bst_sidebar_render(sidebar_content,(text)=>{
              resolveDuplicateLinks(text, vm.compiler.config.alias);
              next();
            });
            
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
