<!-- <p align="center">
  <a href="https://docsify.js.org">
    <img alt="docsify" src="./docs/_media/icon.svg">
  </a>
</p>

<p align="center">
  A magical documentation site generator.
</p>

<p align="center">
  <a href="#backers"><img alt="Backers on Open Collective" src="https://opencollective.com/docsify/backers/badge.svg?style=flat-square"></a>
  <a href="#sponsors">
    <img alt="Sponsors on Open Collective" src="https://opencollective.com/docsify/sponsors/badge.svg?style=flat-square"></a>
  <a href="https://github.com/docsifyjs/docsify/actions/workflows/test.yml"><img src="https://github.com/docsifyjs/docsify/actions/workflows/test.yml/badge.svg" alt="Build & Test"></a>
  <a href="https://www.npmjs.com/package/docsify"><img alt="npm" src="https://img.shields.io/npm/v/docsify.svg?style=flat-square"></a>
  <a href="https://discord.gg/3NwKFyR"><img alt="Join Discord community and chat about Docsify" src="https://img.shields.io/discord/713647066802421792.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2&cacheSeconds=60"></a>
  <a href="https://gitpod.io/#https://github.com/docsifyjs/docsify"><img src="https://img.shields.io/badge/Gitpod-ready--to--code-blue?logo=gitpod" alt="Gitpod Ready-to-Code"></a>
</p>

<p align="center">Gold Sponsor via <a href="https://opencollective.com/docsify">Open Collective</a></p>

<p align="center">
  <a href="https://opencollective.com/docsify/order/3254">
    <img src="https://opencollective.com/docsify/tiers/gold-sponsor.svg?avatarHeight=48">
  </a>
</p>

Docsify turns one or more Markdown files into a Website, with no build process required.

## Features

- No statically built html files
- Simple and lightweight
- Smart full-text search plugin
- Multiple themes
- Useful plugin API
- Emoji support

## Quick Start

Get going fast by using a static web server or GitHub Pages with this ready-to-use [Docsify Template](https://github.com/docsifyjs/docsify-template), review the [quick start tutorial](https://docsify.js.org/#/quickstart) or jump right into a CodeSandbox example site with the button below.

[![Edit 307qqv236](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/307qqv236)

## Showcase

A large collection of showcase projects are included in [awesome-docsify](https://github.com/docsifyjs/awesome-docsify#showcase).

## Links

- [Documentation](https://docsify.js.org)
- [Docsify CLI (Command Line Interface)](https://github.com/docsifyjs/docsify-cli)
- CDN: [UNPKG](https://unpkg.com/docsify/) | [jsDelivr](https://cdn.jsdelivr.net/npm/docsify/) | [cdnjs](https://cdnjs.com/libraries/docsify)
- [`develop` branch preview](https://docsify-preview.vercel.app/)
- [Awesome docsify](https://github.com/docsifyjs/awesome-docsify)
- [Community chat](https://discord.gg/3NwKFyR)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Backers

Thank you to all our backers! 🙏 [[Become a backer](https://opencollective.com/docsify/contribute)]

<a href="https://opencollective.com/docsify#backers" target="_blank"><img src="https://opencollective.com/docsify/backers.svg?width=890"></a>

## Sponsors

Thank you for supporting this project! ❤️ [[Become a sponsor](https://opencollective.com/docsify/contribute)]

<img src="https://opencollective.com/docsify/sponsors.svg?width=890" />

## Contributors

This project exists thanks to all the people who contribute. [[Contribute](CONTRIBUTING.md)].

<a href="https://github.com/docsifyjs/docsify/graphs/contributors"><img src="https://opencollective.com/docsify/contributors.svg?width=890" /></a>

## License

[MIT](LICENSE) -->


# 介绍
这是一个基于[docsify](https://github.com/docsifyjs/docsify)的克隆仓库，分支`feat-for-bst`实现了额外的适配，以满足BST的产品文档需要。


# 二次开发
如有需求变化，或者功能修复，视情况基于原仓库代码[docsify](https://github.com/docsifyjs/docsify)进行再次适配，或者直接基于`feat-for-bst`进行开发。接下来介绍开发步骤。

## 安装node
初次开发需要安装`node`,推荐使用`nvm`工具来安装`node`，因为可以实现版本管理
```bash
# 安装nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash

# 安装最新node
nvm install --lts

# 安装当前的node版本v22.16.0
nvm install v22.16.0

# 使用 node版本v22.16.0
nvm use v22.16.0
```
注意最好使用`v22.16.0`版本的node 避免一些依赖问题。安装好后就可以使用`npm`命令了，这是一个`node.js`栈下的包管理工具。


## 依赖安装
```bash
rm -rf ./node_modules package-lock.json

# 使用代理(可选)
export all_proxy=http://10.28.2.62:8118 

# 安装依赖
npm install
```

## 运行dev
默认情况下将使用`./bst_doc`下的文档作为内容进行展示(查询`server.configs.js`文件)，所以如果`./bst_doc`目录下为空将看不到文档内容。
因此需要提前将内容准备好，可以通过如下命令抓取c1200文档：

```bash
mkdir bst_docs
cd ./bst_docs
# 抓取 master 分支的文档
repo init -u http://bstcd.stuffs.biz/docs/c1200_struct_docs.git --repo-url=http://bstcd.stuffs.biz/bsp/thirdparty/git_repo --no-repo-verify --repo-rev=stable

# 将repo拉取道德docs中的内容移动到 bst_docs 目录
mv ./docs/* ./
```

接下来就执行命令即可开始调试开发:
```bash
npm run dev
```

直接修改`src`中的源码就是进行开发了。

## 提交代码
```bash
# --no-verify避免 git hook 执行各种检查，不需要
git commit -m "xxxx" --no-verify
```