# Lanzou API

蓝奏云 API node.js 版本，目前实现了大部分功能，推荐 node.js >= 14

typescript 编写，生成 d.ts 方便开发和访问接口  
理论上程序能够容易地转换为 Deno 版本和浏览器版本（浏览器需解除 fetch 限制）

仅供测试，勿用于非法行为

# 构建

```sh
$ tsc

$ npm run doc # 生成文档
```

# 使用

在 https://pc.woozooo.com/mydisk.php 获取 cookie，有效期约两天  
基于 Promise 的 API，程序仅对蓝奏云请求接口做了简单的封装，返回数据大致为蓝奏云接口原始数据

```js
import LanzouAPI from "./lib/lanzou.js";
LanzouAPI.queryShareLink("https://xxxxxx.lanzouj.com/xxxxxx", "passwd").then(console.log);
const lanzou = new LanzouAPI(cookie);
lanzou.getFolders().then(console.log);
// more...
```

蓝奏云的接口有点混乱，但一般来说 info 表示操作结果或返回值，text 提供额外信息或 null

./src/types.ts 已经对所有返回值进行了描述

操作成功(即 zt == 1)时返回值符合接口，失败时不符合，参见以下说明

**正常情况下所有的 API 都不会抛出异常且返回以下接口**

```ts
interface {
    zt: number; // 状态码： 0失败  1成功 等等
    info; // 成功时为操作结果或返回值，失败时返回失败信息
    text; // 成功时可能返回额外信息，失败时返回Error对象（本程序扩展）
}
```

失败时可以通过检测 text 来获取程序捕获的异常

```js
const { zt, info, text } = await api;
if (zt === 1) {
    // success
} else {
    if (text instanceof Error) {
        // ...
    }
}
```

## 文档

API 参见文档，由 typedoc 自动生成  
<https://yieldray.github.io/lanzou-api/classes/lanzou.default.html>
