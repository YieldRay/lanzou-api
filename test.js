import LanzouAPI from "./lib/lanzou.js";

const cookie = `
cookie
`.trim();

const lanzou = new LanzouAPI(cookie);
// lanzou.uploadFile(4999410, "test.zip").then(console.log);
LanzouAPI.queryShareInfo("https://upload.lanzouj.com/ii5ZQ01qmpqb").then(console.log);
LanzouAPI.queryShareLink("https://upload.lanzouj.com/ii5ZQ01qmpqb").then(console.log);
// lanzou.createFolder().then(({ zt, info, text }) => {
//     console.log(zt, info, text);
//     if (zt) {
//         lanzou.deleteFolder(Number(text)).then(console.log);
//     }
// });
