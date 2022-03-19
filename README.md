# Lanzou API

蓝奏云 API node.js 版本，目前实现了大部分功能  
typescript 编写，API 返回值已用 type 表示

仅供测试，勿用于非法行为

# 构建

```sh
$ tsc

$ npm run doc # 生成文档
```

# 使用

```js
import LanzouAPI from "./lib/lanzou.js";
const lanzou = new LanzouAPI(cookie);
await console.log(lanzou.getFiles());
await console.log(LanzouAPI.getDownloadLink("https://upload.lanzouj.com/iYA4q01oui7g").link); // 静态方法，无需cookie
// ...
```

API 返回对象符合以下接口，zt 为 1 代表成功，0 代表失败。
蓝奏云的接口有点混乱，但一般来说 info 表示操作结果或返回值，text 提供额外信息或 null  
./src/types.ts 已经对所有返回值进行了描述

```ts
interface response<info, text> {
    zt: 0 | 1;
    info: info;
    text: text;
}
```

## 文档

所有 API 参见文档，由 typedoc 自动生成  
<https://yieldray.github.io/lanzou-api/>
