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

function buildSidebarTree(tocs) {
  const container = document.createElement('ul');
  container.className = 'content_sidebar-tree';
  if (tocs) {
    const stack = [{ level: 0, ul: container }];

    tocs.forEach(item => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = item.slug;
      li.className = `content_sidebar-lv${item.level}`;
      a.innerHTML = item.title; // 使用 innerHTML 保留 HTML 标签（如 <strong>）

      li.appendChild(a);

      // 找到当前 item 应该插入的父级 <ul>
      while (stack.length && item.level <= stack[stack.length - 1].level) {
        stack.pop();
      }

      const parentUL = stack[stack.length - 1].ul;
      parentUL.appendChild(li);

      // 如果下一项更深，就把当前 li 的 ul 推入栈
      const nextItem = tocs[tocs.indexOf(item) + 1];
      if (nextItem && nextItem.level > item.level) {
        const childUL = document.createElement('ul');
        li.appendChild(childUL);
        stack.push({ level: item.level, ul: childUL });
      }
    });
  }

  return container;
}

var cur_vm = null;
function get_content_anchor() {
  var node;
  var doc_anchors = document.querySelectorAll('.anchor');

  var doc = document.documentElement;
  var top = ((doc && doc.scrollTop) || document.body.scrollTop) - 0;

  var last_node = null;
  for (var i = 0, len = doc_anchors.length; i < len; i += 1) {
    node = doc_anchors[i];
    if (node.offsetTop > top) {
      if (last_node) node = last_node;
      break;
    } else {
      last_node = node;
    }
  }
  return node;
}
function active_hightlight() {
  var node = get_content_anchor();
  if (!node) {
    return;
  }
  var target_href = node.getAttribute('href');
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
  // 添加高亮
  if (current_a) {
    current_a.classList.add('current_ctx_tag');
  }
}
function install(hook, vm) {
  function init$1(vm) {
    var keywords = vm.router.parse().query.s;
    //style();
    tpl(keywords);
    window.active_hightlight = active_hightlight;
    cur_vm = vm;
  }

  hook.mounted(function (_) {
    init$1(vm);
  });

  hook.doneEach(function (content, next) {
    var curFileName = vm.router.parse().file;

    var tocs = vm.compiler.cacheTOC[curFileName];
    console.log('tocs = ', tocs.length, tocs);
    var ul_el = buildSidebarTree(tocs);

    context_sidebar.innerHTML = '';

    const sidebar_tile = Docsify.dom.create('p', '页内导航');
    Docsify.dom.toggleClass(sidebar_tile, 'content_sidebar_title');
    context_sidebar.appendChild(sidebar_tile);
    context_sidebar.appendChild(ul_el);

    active_hightlight();

    next(content);
  });
}

window.$docsify = window.$docsify || {};
$docsify.plugins = [install, ...($docsify.plugins || [])];
