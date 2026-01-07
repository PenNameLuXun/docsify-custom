import * as path from 'node:path';
import * as url from 'node:url';
import { rewriteRules } from './middleware.js';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Production (CDN URLs, watch disabled)
export const prodConfig = {
  ghostMode: false,
  hostname: '127.0.0.1',
  notify: false,
  open: false,
  port: 8080,
  server: {
    baseDir: './bst_docs/docs',
    index: 'index_release.html',
  },
  snippet: false,
  ui: false,
};
const GITLAB_TOKEN = 'SiydRjmmAS3wooadjrLg';
// Development (local URLs, watch enabled)
export const devConfig = {
  ...prodConfig,
  files: [
    'CHANGELOG.md',
    'bst_docs/docs/**/*',
    'dist/**/*',
  ],
  port: 3000,
  rewriteRules,
  reloadDebounce: 1000,
  reloadOnRestart: true,
  server: {
    ...prodConfig.server,
    index: '../index_debug.html',
    routes: {
      '/changelog.md': path.resolve(__dirname, 'CHANGELOG.md'),
      '/dist': path.resolve(__dirname, 'dist'),
      '/node_modules': path.resolve(__dirname, 'node_modules'), // Required for automated Vue tests
    },
    middleware: [
      // async (req, res, next) => {
      //   if (req.url.startsWith('/gitlab-raw/')) {
      //     // 假设你的请求格式是 /gitlab-raw/:project_id/:branch/:file_path
      //     // 例如: /gitlab-raw/123/main/src/index.js
      //     const rawPath = req.url.replace('/gitlab-raw/', ''); 

      //     // 去掉 ? 及其后面的参数
      //     const cleanPath = rawPath.split('?')[0];

      //     const pathParts = cleanPath.split('/');
      //     const projectId = pathParts[0];
      //     const branch = pathParts[1];
      //     let file_param = pathParts.slice(2).join('/')
      //     const filePath = encodeURIComponent(file_param);

      //     // 构建 GitLab API URL
      //     let gitlabUrl = `http://bstcd.stuffs.biz/api/v4/projects/${projectId}/repository/files/${filePath}/raw?ref=${branch}`;
      //     //let gitlabUrl = "http://bstcd.stuffs.biz/api/v4/projects/4136/repository/files/_sidebar.md/raw?ref=master"
      //     //console.log("gitlabUrl:",gitlabUrl,req.url)

      //     try {
      //       const response = await fetch(gitlabUrl, {
      //         headers: {
      //           // 推荐直接使用 PRIVATE-TOKEN Header
      //           'PRIVATE-TOKEN': GITLAB_TOKEN 
      //         },
      //       });

      //       if (!response.ok) {
      //         const errorText = await response.text();
      //         res.writeHead(response.status);
      //         console.log("!response.ok:",response.status,errorText,gitlabUrl)
      //         return res.end(`GitLab Error: ${errorText}`);
      //       }

      //       const data = await response.text();
      //       res.setHeader('Content-Type', 'text/plain; charset=utf-8'); // 或者根据文件类型动态设置
      //       res.end(data);
      //     } catch (err) {
      //       res.writeHead(500);
      //       res.end('Proxy error');
      //       console.log("Proxy error")
      //       console.error(err);
      //     }
      //   } else {
      //     next();
      //   }
      // }
      async (req, res, next) => {
        if (req.url.startsWith('/gitlab-raw/')) {
          const rawPath = req.url.replace('/gitlab-raw/', '').split('?')[0];
          const pathParts = rawPath.split('/');
          
          // 基础参数提取
          const projectId = pathParts[0];
          const branch = pathParts[1];
          const file_param = pathParts.slice(2).join('/');
          const filePath = encodeURIComponent(file_param);

          const gitlabUrl = `http://bstcd.stuffs.biz/api/v4/projects/${projectId}/repository/files/${filePath}/raw?ref=${branch}`;

          try {
            const response = await fetch(gitlabUrl, {
              headers: { 'PRIVATE-TOKEN': GITLAB_TOKEN },
            });

            if (!response.ok) {
              res.writeHead(response.status);
              return res.end(`GitLab Error: ${response.statusText}`);
            }

            // --- 关键改进点 1: 动态转发 Content-Type ---
            // 获取 GitLab 返回的原始文件类型（image/png, application/pdf 等）
            const contentType = response.headers.get('content-type');
            if (contentType) {
              res.setHeader('Content-Type', contentType);
            }

            // --- 关键改进点 2: 使用 ArrayBuffer 处理二进制数据 ---
            // 注意：不要使用 .text()
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            res.end(buffer);

          } catch (err) {
            console.error("Proxy error:", err);
            if (!res.headersSent) {
              res.writeHead(500);
              res.end('Proxy error');
            }
          }
        } else {
          next();
        }
      }
    ],
  },
  snippet: true,
};

export const devOrgConfig = {
  ...prodConfig,
  files: [
    'CHANGELOG.md',
    'docs/**/*',
    'dist/**/*',
  ],
  port: 3002,
  rewriteRules,
  reloadDebounce: 1000,
  reloadOnRestart: true,
  server: {
    ...prodConfig.server,
    baseDir: './docs',
    index: 'index.html',
    routes: {
      '/changelog.md': path.resolve(__dirname, 'CHANGELOG.md'),
      '/dist': path.resolve(__dirname, 'dist'),
      '/node_modules': path.resolve(__dirname, 'node_modules'), // Required for automated Vue tests
    },
  },
  snippet: true,
};

// Test (local URLs, watch disabled)
export const testConfig = {
  ...devConfig,
  port: 4000,
  server: {
    ...devConfig.server,
    middleware: [
      // Blank page required for test environment
      {
        route: '/_blank.html',
        handle(req, res, next) {
          res.setHeader('Content-Type', 'text/html');
          res.end('<!DOCTYPE html><html><body></body></html>');
          next();
        },
      },
    ],
  },
  snippet: false,
  watch: false,
};
