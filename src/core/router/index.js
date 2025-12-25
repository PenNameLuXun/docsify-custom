import * as dom from '../util/dom.js';
import { noop } from '../util/core.js';
import { HashHistory } from './history/hash.js';
import { HTML5History } from './history/html5.js';

/**
 * @typedef {{
 *   path?: string
 * }} Route
 */

/** @type {Route} */
let lastRoute = {};

/** @typedef {import('../Docsify.js').Constructor} Constructor */

/**
 * @template {!Constructor} T
 * @param {T} Base - The class to extend
 */
export function Router(Base) {
  return class Router extends Base {
    route = {};

    updateRender() {
      this.router.normalize();
      this.route = this.router.parse();
      dom.body.setAttribute('data-page', this.route.file);
    }

    isOnlyIdChanged(url1, url2) {

      if(!url1 || !url2)return false;
      const u1 = new URL(url1);
      const u2 = new URL(url2);

      // 1. hash 路由路径必须一致（不含 query）
      const [path1] = u1.hash.split('?');
      const [path2] = u2.hash.split('?');
      if (path1 !== path2) return false;

      // 2. 解析 hash 中的 query
      const q1 = new URLSearchParams(u1.hash.split('?')[1] || '');
      const q2 = new URLSearchParams(u2.hash.split('?')[1] || '');

      // 3. id 必须存在，且值不同
      if (!q1.has('id') || !q2.has('id')) return false;
      if (q1.get('id') === q2.get('id')) return false;

      // 4. 去掉 id 后，其余参数必须完全一致
      q1.delete('id');
      q2.delete('id');

      return q1.toString() === q2.toString();
    }

    initRouter() {
      const config = this.config;
      const mode = config.routerMode || 'hash';
      let router;

      if (mode === 'history') {
        router = new HTML5History(config);
      } else {
        router = new HashHistory(config);
      }

      this.router = router;
      this.updateRender();
      lastRoute = this.route;

      router.onchange(params => {
        this.updateRender();
        this._updateRender();
        console.log("lastRoute.path:",params.event.oldURL)
        console.log("    route.path:",params.event.newURL)
        const onlyIdChanged = this.isOnlyIdChanged(params.event.oldURL,params.event.newURL);
        //if (lastRoute.path === this.route.path) 
        if(onlyIdChanged)
        {
          this.onNavigate(params.source, false);
          return;
        }

        this.$fetch(noop, this.onNavigate.bind(this, params.source));
        lastRoute = this.route;
      });
    }
  };
}
