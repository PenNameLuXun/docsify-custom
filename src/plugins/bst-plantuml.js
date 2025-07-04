// ---------http://10.28.10.175:8080/svg/----------------------
// 1.默认的 https://www.plantuml.com/plantuml/svg/ 可能被墙
// 2.可以使用 docker run -d -p 8080:8080 plantuml/plantuml-server 搭建一个服务，地址如http://127.0.0.1:8080/svg/
/* 3.可以在index.html中配置服务地址：
    plantuml:{
        server:"http://10.28.10.175:8080/svg/"
      }
 */
  // 简版 deflate 实现（来自 plantuml-encoder）
  // -------------------------------
  function encode6bit(b) {
    if (b < 10) return String.fromCharCode(48 + b);
    b -= 10;
    if (b < 26) return String.fromCharCode(65 + b);
    b -= 26;
    if (b < 26) return String.fromCharCode(97 + b);
    b -= 26;
    if (b === 0) return '-';
    if (b === 1) return '_';
    return '?';
  }

  function append3bytes(b1, b2, b3) {
    const c1 = b1 >> 2;
    const c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
    const c3 = ((b2 & 0xf) << 2) | (b3 >> 6);
    const c4 = b3 & 0x3f;
    return (
      encode6bit(c1 & 0x3f) +
      encode6bit(c2 & 0x3f) +
      encode6bit(c3 & 0x3f) +
      encode6bit(c4 & 0x3f)
    );
  }

  function encode64(data) {
    let r = '';
    for (let i = 0; i < data.length; i += 3) {
      if (i + 2 === data.length) {
        r += append3bytes(data[i], data[i + 1], 0);
      } else if (i + 1 === data.length) {
        r += append3bytes(data[i], 0, 0);
      } else {
        r += append3bytes(data[i], data[i + 1], data[i + 2]);
      }
    }
    return r;
  }

  // 使用 CompressionStream（现代浏览器支持）
  async function deflate(text) {
    const cs = new CompressionStream('deflate-raw');
    const writer = cs.writable.getWriter();
    writer.write(new TextEncoder().encode(text));
    writer.close();
    const compressed = await new Response(cs.readable).arrayBuffer();
    return new Uint8Array(compressed);
  }

  function set_css() {
    var css1 = `.plantumlImg{display:block;margin:auto;}`
    if (typeof document !== 'undefined') {
      var styleEl = document.createElement('style');
      styleEl.type = 'text/css';
      styleEl.appendChild(document.createTextNode(css1));
      (document.head || document.getElementsByTagName('head')[0]).appendChild(
        styleEl,
      );
    }
  }

  async function encodePlantUML(text) {
    const deflated = await deflate(text);
    return encode64(deflated);
  }

  function renderPlantUMLBlock(source,org,server) {
    return encodePlantUML(source).then(encoded => {
        const data_org = encodeURIComponent(org);
        return `<p><img src="${server}${encoded}" alt="PlantUML Diagram" class="plantumlImg"></p>\n`;
        return `<p><img src="${server}${encoded}" alt="PlantUML Diagram" class="plantumlImg" onerror="this.parentNode.innerHTML = window.renderPlantUmlFallback(\`${data_org}\`)"></p>\n`;
    })
  }
  function extractPlantUMLBlocks(markdown) {
    const regex = /```plantuml([\s\S]*?)```/g;
    const blocks = [];
    let match;
    while ((match = regex.exec(markdown)) !== null) {
      blocks.push(match);
    }
    return blocks;
  }


  // 插件安装函数
  function install(hook, vm) {
    const server = (vm.config.plantuml && vm.config.plantuml.server) ||
      'https://www.plantuml.com/plantuml/svg/';

    hook.beforeEach(async function (markdown, next) {
      const blocks = extractPlantUMLBlocks(markdown);

      for (const match of blocks) {
        const raw = match[1].trim();
        const imgHtml = await renderPlantUMLBlock(raw,match[0], server);
        markdown = markdown.replace(match[0], imgHtml);
      }

      next(markdown);
    });
    hook.init(function(){
        set_css();
        window.renderPlantUmlFallback = function (source) {
            const code = decodeURIComponent(source);
            const rendered = window.marked.parse(code);
            return rendered;
        };
    })

  }

  window.$docsify = window.$docsify || {};
  $docsify.plugins = [].concat(install, $docsify.plugins || []);