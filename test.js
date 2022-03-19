import LanzouAPI from "./lib/lanzou.js";

const cookie = `
lanzouCookie
`.replace(/\W+/g, "");

const lanzou = new LanzouAPI(cookie);
// lanzou.uploadFile("redis-6.0.6.tar.gz").then(console.log);
// lanzou.getDownloadLinkWithPassword("https://upload.lanzouj.com/ihnRj01olr6f", "passwd").then(console.log);
// LanzouAPI.getDownloadLink("https://upload.lanzouj.com/iYA4q01oui7g").then(console.log);
LanzouAPI.getDownloadLink("https://upload.lanzouj.com/iYA4q01oui7g", "passwd").then(console.log);
