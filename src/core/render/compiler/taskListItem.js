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
    const isTaskItem = /^(<input.*type="checkbox"[^>]*>)/.test(text);
    //console.log("list text :",text)
    const html = isTaskItem
      ? /* html */ `<li class="task-list-item"><label>${text}</label></li>`
      : /* html */ `<li>${text}</li>`;

    return html;
  }

  const isTaskItem = /^(<input.*type="checkbox"[^>]*>)/.test(text);
  //console.log("list text :",text)
  const html = isTaskItem
    ? /* html */ `<li class="task-list-item "${classNames.join(' ')}"><label>${text}</label></li>`
    : /* html */`<li class="${classNames.join(' ')}">${text}</li>`;

  return html;
}


export const taskListItemCompiler = ({ renderer }) =>
  (renderer.listitem = function (item) {
    //item.loose=true;
    if(renderer?.bst_options?.force_loose||renderer?.bst_options?.sidebar_compiling){
      item.loose=true
    }
    let text = '';
    if (item.task) {
      const checkbox = this.checkbox?.({ checked: !!item.checked });
      if (item.loose) {
        if (item.tokens.length > 0 && item.tokens[0].type === 'paragraph') {
          item.tokens[0].text = checkbox + ' ' + item.tokens[0].text;
          if (
            item.tokens[0].tokens &&
            item.tokens[0].tokens.length > 0 &&
            item.tokens[0].tokens[0].type === 'text'
          ) {
            item.tokens[0].tokens[0].text =
              checkbox + ' ' + item.tokens[0].tokens[0].text;
          }
        } else {
          item.tokens.unshift({
            type: 'text',
            raw: checkbox + ' ',
            text: checkbox + ' ',
          });
        }
      } else {
        text += checkbox + ' ';
      }
    }

    text += this.parser?.parse(item.tokens, !!item.loose);

    // //console.log("taskListItemCompiler text:",item,renderer);

    const isTaskItem = /^(<input.*type="checkbox"[^>]*>)/.test(text);
    //console.log("list text :",text)
    const html = isTaskItem
      ? /* html */ `<li class="task-list-item"><label>${text}</label></li>`
      : /* html */ `<li>${text}</li>`;

    return html;

    //return bst_class_helper(renderer,text);
  });
