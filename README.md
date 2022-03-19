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
await console.log(LanzouAPI.getDownloadLink("https://upload.lanzouj.com/iYA4q01oui7g").link);
// ...
```

## 文档

所有 API 参见文档，typedoc 自动生成  
<https://yieldray.github.io/lanzou-api/>
