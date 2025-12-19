import { helper as helperTpl } from '../tpl.js';

export const paragraphCompiler = ({ renderer }) =>
  (renderer.paragraph = function ({ tokens }) {
    const text = this.parser.parseInline(tokens);
    
    let result;

    if (text.startsWith('!&gt;')) {
      result = helperTpl('callout important', text);
    } else if (text.startsWith('?&gt;')) {
      result = helperTpl('callout tip', text);
    } else if(text.startsWith('@@')){
      console.log("paragraph text:",text,tokens);
      const text1 = text.slice(2).trim();
      return /* html */ `<p class="folder group">${text1}</p>`;
    } 
    else {
      result = /* html */ `<p>${text}</p>`;
    }

    return result;
  });
