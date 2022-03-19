import LanzouAPI from "./lib/lanzou.js";

const cookie = `
myCookie
`.trim();

const lanzou = new LanzouAPI(cookie);
lanzou.uploadFile(4999410, "text.txt").then(console.log);
LanzouAPI.queryShareInfo("https://upload.lanzouj.com/iYA4q01oui7g", "random").then(console.log);
LanzouAPI.queryShareLink("https://upload.lanzouj.com/iYA4q01oui7g", "passwd").then(console.log);
lanzou.createFolder().then(({ zt, info, text }) => {
    console.log(zt, info, text);
    if (zt) {
        lanzou.deleteFolder(Number(text)).then(console.log);
    }
});
