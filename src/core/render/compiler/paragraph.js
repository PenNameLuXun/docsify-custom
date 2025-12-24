import { helper as helperTpl } from '../tpl.js';



function parase_component(raw) {
  const parts = raw.split('|').map(p => p.trim());

  if (parts.length !== 4) {
    console.warn('[docsify-component] 非法组件定义:', raw);
    return '';
  }

  const [stringId, name, versionStr, pathStr] = parts;

  const versions = versionStr
    ? versionStr.split(',').map(v => v.trim()).filter(Boolean)
    : [];

  const paths = pathStr
    ? pathStr.split(',').map(p => p.trim()).filter(Boolean)
    : [];

  if (versions.length !== paths.length) {
    console.warn(
      `[docsify-component] versions 与 paths 数量不一致:`,
      { stringId, versions, paths }
    );
    return '';
  }

  // 生成 option
  let optionsHtml = '';
  versions.forEach((version, index) => {
    const path = paths[index];
    optionsHtml += `
      <option 
        value="${version}"
        data-path="${path}"
        data-cname="${name}"
        data-cid="${stringId}">
        ${version}
      </option>`;
  });

  // 如果没有版本，则不生成 select（可选策略）
  const selectHtml = versions.length
    ? `<select class="version-select">
         ${optionsHtml}
       </select>`
    : '';

  // 在 p 元素上标识 stringId
  return `
    <p class="folder group component"
       data-string-id="${stringId}">
      <span class="component-name">${name}</span>
      ${selectHtml}
    </p>
  `;
}

function bst_class_helper(renderer, text = '') {
  const classNames = [];

  if (renderer?.bst_options?.sidebar_compiling) {
    classNames.push('sidebar_tag');
  }

  if (renderer?.bst_options?.sidebar_tgg) {
    
    classNames.push('sidebar_compose_tag');
  }

  // 没有任何 class 时，直接返回原文本
  if (classNames.length === 0) {
    return `<p>${text}</p>`;
  }

  return `<p class="${classNames.join(' ')}">${text}</p>`;
}

export const paragraphCompiler = ({ renderer }) =>
  (renderer.paragraph = function ({ tokens }) {
    const text = this.parser.parseInline(tokens);
    
    let result;

    if (text.startsWith('!&gt;')) {
      result = helperTpl('callout important', text);
    } else if (text.startsWith('?&gt;')) {
      result = helperTpl('callout tip', text);
    } else if(text.startsWith('@@')){
      const text1 = text.slice(2).trim();
      //console.log("text1:",text1);
      return parase_component(text1);
    } 
    else {
      result = bst_class_helper(renderer,text);
    }

    return result;
  });
