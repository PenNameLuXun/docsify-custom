import { create } from 'browser-sync';
import { devConfig, prodConfig,devOrgConfig } from './server.configs.js';
import fs from 'fs';
import path from 'path';

/**
 * 拷贝多个文件到目标目录
 * @param {string[]} fileList - 要拷贝的源文件路径数组
 * @param {string} destDir - 目标目录
 */
function copyFiles(fileList, destDir) {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  fileList.forEach(filePath => {
    const fileName = path.basename(filePath);
    const destPath = path.join(destDir, fileName);

    fs.copyFile(filePath, destPath, (err) => {
      if (err) {
        console.error(`拷贝失败: ${filePath} -> ${destPath}`, err);
      } else {
        console.log(`已拷贝: ${filePath} -> ${destPath}`);
      }
    });
  });
}

// // 示例使用
// const filesToCopy = [
//   './source/file1.txt',
//   './source/file2.jpg',
//   './source/file3.pdf'
// ];

// const destinationDir = './target';

// copyFiles(filesToCopy, destinationDir);
//const bst
//copyFiles()


function isLocal(c){
    return (c === devConfig||c === devOrgConfig)
}

function getConfig(arg){
    if(arg.includes('--devOrg')){
        return devOrgConfig
    }
    return arg.includes('--dev') ? devConfig : prodConfig
}

const bsServer = create();
const args = process.argv.slice(2);

const config = getConfig(args);

const configName = isLocal(config) ? 'development' : 'production';
const isWatch = Boolean(config.files) && config.watch !== false;
const urlType = isLocal(config) ? 'local' : 'CDN';

// if(config != devOrgConfig){
//     const filesToCopy = [
//       './src/themes/bst/bst.css',
//       './src/themes/bst/vue.css',
//     ];
//     copyFiles(filesToCopy,'./bst_docs/docs/vendor/themes')
// }

// prettier-ignore
console.log(`\nStarting ${configName} server (${urlType} URLs, watch: ${isWatch})\n`);

bsServer.init(config);
