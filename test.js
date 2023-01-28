import LanzouAPI from "./lib/lanzou.js";
import "dotenv/config";

const cookie = process.env.LANZOU_COOKIE;

const lanzou = new LanzouAPI(cookie);

LanzouAPI.queryShareFileInfoWithPassword("https://upload.lanzouj.com/i95j302pbxeb").then(({ zt, info }) => {
    console.log(info);
});

LanzouAPI.queryShareFileLinkWithPassword("https://upload.lanzouj.com/i95j302pbxeb", "pass").then((resp) => {
    console.log(resp);
});

LanzouAPI.queryShareFolderWithPassword("https://upload.lanzouj.com/b036v4cxa", "3260").then((resp) => {
    console.log(resp);
});

lanzou.uploadFile(4999410, "test.zip").then(console.log);

lanzou.createFolder().then(({ zt, info, text }) => {
    // 测试：创建并删除文件夹
    console.log(zt, info, text);
    if (zt) {
        lanzou.deleteFolder(Number(text)).then(console.log);
    }
});
