# Lanzou API

蓝奏云 API node.js 版本，目前实现了大部分功能，推荐 node.js >= 14

理论上程序能够容易地转换为 Deno 版本和浏览器版本（浏览器需解除 fetch 限制）

typescript 编写，仅供学习，勿用于非法行为

# 构建

```sh
$ npm install --production
$ npx tsc

$ npm run doc # 生成文档
```

# 使用

在 https://pc.woozooo.com/mydisk.php 获取 cookie，有效期约两天  
基于 Promise 的 API，程序仅对蓝奏云请求接口做了简单的封装，返回数据大致为蓝奏云接口原始数据

```js
import LanzouAPI from "./lib/lanzou.js";
LanzouAPI.queryShareFileInfoWithPassword("https://upload.lanzouj.com/i95j302p", "bxeb").then(console.log);
const lanzou = LanzouAPI.of(cookie); // new LanzouAPI(cookie)
lanzou.getFolders().then(({ zt, info, text }) => {
    if (zt === 1) {
        console.log(info);
    } else {
        console.error(info);
    }
});
// more...
```

蓝奏云的接口有点混乱，但一般来说 info 表示操作结果或返回值，text 提供额外信息或 null

`./src/types.ts` 已经对所有返回值进行了描述

**正常情况下所有的 API 都不会抛出异常（即使是网络错误）且返回以下接口**

```ts
interface<Info> {
    zt: number; // 状态码： 0 失败  1 成功 等等
    info: Info | Error; // 成功时为操作结果或返回值，失败时返回 Error 对象
    text string | null; // 成功时可能返回额外信息或 null，失败时返回失败信息（字符串）
}
```

失败时可以通过检测 `info` 来获取程序捕获的异常

```js
const { zt, info, text } = await lanzou.getFolders();
if (zt === 1) {
    // success
} else {
    if (info instanceof Error) {
        // ...
    }
}
```

## 文档

API 参见文档，由 typedoc 自动生成  
<https://yieldray.github.io/lanzou-api/classes/lanzou.default.html>
