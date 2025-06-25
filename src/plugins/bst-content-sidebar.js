var context_sidebar = null;

function tpl(defaultValue = '') {
  // 1. 创建右侧固定侧栏元素

  const sidebar = Docsify.dom.create('div');
  Docsify.dom.toggleClass(sidebar, 'content_sidebar');

  // 2. 获取 .content 容器
  const main = Docsify.dom.find('.content');

  // 3. 创建新的包装容器，用来包住正文和占位元素
  const wrapper = Docsify.dom.create('div');
  Docsify.dom.toggleClass(wrapper, 'content-wrapper'); // 自定义一个类名，方便写 CSS

  /* 4. 把 .content 里现有的所有节点
   **依次移动**到 wrapper 中 */
  while (main.firstChild) {
    wrapper.appendChild(main.firstChild); // 每次把第一个子节点移进去
  }

  // const sidebar_placeholder = Docsify.dom.create('div');
  // Docsify.dom.toggleClass(sidebar_placeholder, 'sidebar-placeholder');
  // wrapper.appendChild(sidebar_placeholder);

  main.appendChild(wrapper);

  wrapper.appendChild(sidebar);

  context_sidebar = sidebar;
}

function buildSidebarTree(tocs, subMaxLevel = 7) {
  const container = document.createElement('ul');
  container.className = 'content_sidebar-tree';
  if (tocs) {
    const stack = [{ depth: 0, ul: container }];

    tocs.forEach(item => {
      if (item.depth <= subMaxLevel) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = item.slug;
        li.className = `content_sidebar-lv${item.depth}`;
        a.innerHTML = item.title; // 使用 innerHTML 保留 HTML 标签（如 <strong>）

        li.appendChild(a);

        // 找到当前 item 应该插入的父级 <ul>
        while (stack.length && item.depth <= stack[stack.length - 1].depth) {
          stack.pop();
        }

        const parentUL = stack[stack.length - 1].ul;
        parentUL.appendChild(li);

        // 如果下一项更深，就把当前 li 的 ul 推入栈
        const nextItem = tocs[tocs.indexOf(item) + 1];
        if (nextItem && nextItem.depth > item.depth) {
          const childUL = document.createElement('ul');
          li.appendChild(childUL);
          stack.push({ depth: item.depth, ul: childUL });
        }
      }
    });
  }

  return container;
}
function isElementVisible(el, off_h = 78) {
  const rect = el.getBoundingClientRect();
  var viewHeight = window.innerHeight || document.documentElement.clientHeight;
  viewHeight -= -off_h;

  return rect.top < viewHeight && rect.bottom > 0;
}
function isVisibleInAside(el, aside, off_h = 0) {
  const elRect = el.getBoundingClientRect();
  const asideRect = aside.getBoundingClientRect();

  // 判断 el 是否完全或部分出现在 aside 的可视范围内
  const verticallyVisible =
    elRect.bottom > asideRect.top && elRect.top < asideRect.bottom - off_h;
  // const horizontallyVisible =
  //   elRect.right > asideRect.left && elRect.left < asideRect.right;

  return verticallyVisible;
}
var cur_vm = null;
function get_content_anchor() {
  const height = window.innerHeight;
  //console.log("窗口高度:", height);

  var node;
  var doc_anchors = document.querySelectorAll('.anchor');

  var doc = document.documentElement;
  var top = ((doc && doc.scrollTop) || document.body.scrollTop) - 0;

  var last_node = null;
  for (var i = 0, len = doc_anchors.length; i < len; i += 1) {
    node = doc_anchors[i];
    if (node.offsetTop > top) {
      if (last_node) {
        var distance_1 = top - last_node.offsetTop;
        var distance_2 = node.offsetTop - top;
        node =
          distance_1 > distance_2 && isElementVisible(node) ? node : last_node;
        node = last_node;
      }
      break;
    } else {
      last_node = node;
    }
  }
  return node;
}

function getParentLevelHref(href, tocs) {
  if (!tocs) return href;
  var node_depth = 1;
  var end_i = 0;
  for (var i = 0, len = tocs.length; i < len; i += 1) {
    var item = tocs[i];
    if (item.slug === href) {
      //找到了，那么它的上一级node是?
      node_depth = item.depth;
      end_i = i;
      break;
    }
  }
  for (var i = end_i - 1; i >= 0; i -= 1) {
    var item = tocs[i];
    var depth = item.depth;
    if (depth < node_depth) {
      return item.slug;
    }
  }
  return href;
}

function active_hightlight(tocs, href = null) {
  //console.log("active_hightlight:")
  var target_href = href;
  if (!target_href) {
    var node = get_content_anchor();
    if (!node) {
      return;
    }
    target_href = node.getAttribute('href');
  }
  var anchors = context_sidebar.querySelectorAll('a');

  // 移除旧的高亮
  var last_a = context_sidebar.querySelector('a.current_ctx_tag');
  if (last_a) {
    last_a.classList.remove('current_ctx_tag');
  }
  var current_a = null;
  for (var i = 0; i < anchors.length; i++) {
    var a = anchors[i];
    if (a.getAttribute('href') === target_href) {
      current_a = a;
      break;
    }
  }

  if (!current_a) {
    var new_target_href = null;
    while (!current_a) {
      new_target_href = getParentLevelHref(target_href, tocs);
      if (new_target_href == target_href) {
        break;
      }
      for (var i = 0; i < anchors.length; i++) {
        var a = anchors[i];
        if (a.getAttribute('href') === new_target_href) {
          current_a = a;
          break;
        }
      }
    }
  }

  // 添加高亮
  if (current_a) {
    current_a.classList.add('current_ctx_tag');
    // if (!isVisibleInAside(current_a, context_sidebar)) {
    //   current_a.scrollIntoView({
    //     behavior: 'smooth',
    //     block: 'start',
    //   });
    // }
  }
}
function getTocs(vm) {
  var curFileName = vm.router.parse().file;
  var tocs = vm.compiler.cacheTOC[curFileName];
  return tocs;
}

var timer = null;
function install(hook, vm) {
  function init$1(vm) {
    var keywords = vm.router.parse().query.s;
    tpl(keywords);
    cur_vm = vm;
  }

  hook.mounted(function (_) {
    init$1(vm);
    document.addEventListener('scroll', function () {
      if (timer) {
        clearTimeout(timer);
      }
      //timer = setTimeout(() => 
      {
        active_hightlight(getTocs(vm));
        timer = null;
      }
      //}, 5);
    });
  });

  hook.doneEach(function (content, next) {
    var tocs = getTocs(vm);
    var level = vm.config.subMaxLevel;
    var ul_el = buildSidebarTree(tocs, 3);

    context_sidebar.innerHTML = '';

    const sidebar_tile = Docsify.dom.create('p', '页内导航');
    Docsify.dom.toggleClass(sidebar_tile, 'content_sidebar_title');
    context_sidebar.appendChild(sidebar_tile);
    context_sidebar.appendChild(ul_el);

    next(content);

    active_hightlight(tocs);
  });
}

window.$docsify = window.$docsify || {};
$docsify.plugins = [install, ...($docsify.plugins || [])];
