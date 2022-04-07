import {
    fetchText,
    fetchJSON,
    downloadRedirect,
    findByRE,
    getTypeOfShareLink,
    objToURL,
    findTextBetween,
    LanzouAPIError,
} from "./utils.js";
import { headersObj } from "./data.js";
import { queryShareFileResp, queryShareFolderResp, queryShareLinkResp } from "./types";

async function queryShareFileInfo(shareURL: string): Promise<queryShareFileResp> {
    try {
        const text = await fetchText(shareURL);
        const { type, requirePassword } = await getTypeOfShareLink(shareURL);
        if (type === "null") throw new LanzouAPIError("文件取消分享了");
        if (requirePassword) throw new LanzouAPIError("需要密码");
        if (type !== "file") throw new LanzouAPIError("不是文件分享链接");

        const name = findByRE(text, /<title>([^<]+)<\/title>/)?.replace(" - 蓝奏云", "") || "unknown";
        const size = findByRE(text, /<span class="p7">文件大小：<\/span>([^<]+)<br>/) || "unknown";
        const time = findByRE(text, /<span class="p7">上传时间：<\/span>([^<]+)<br>/) || "unknown";
        const user = findByRE(text, /<span class="p7">分享用户：<\/span><font>([^<]+)<\/font><br>/);
        const system = findByRE(text, /<span class="p7">运行系统：<\/span>([^<]+)<br>/);
        const description = findByRE(text, /<span class="p7">文件描述：<\/span>([^<]+)<br>/);
        return { zt: 1, info: { name, size, time, user, system, description }, text: null };
    } catch (e) {
        return { zt: 0, info: e, text: e.message };
    }
}

async function queryShareFileLink(shareURL: string): Promise<queryShareLinkResp> {
    try {
        const text = await fetchText(shareURL);
        const { type, requirePassword } = await getTypeOfShareLink(shareURL);
        if (type === "null") throw new LanzouAPIError("文件取消分享了");
        if (requirePassword) throw new LanzouAPIError("需要密码");
        if (type !== "file") throw new LanzouAPIError("不是文件分享链接");

        const referer =
            new URL(shareURL).origin + findByRE(text, /<iframe class="ifr2" name="(?:\d{2,})" src="(\/fn\?[^"]+)"/);
        const encryptPage = await fetchText(referer);
        const ajax = await fetchJSON("https://upload.lanzouj.com/ajaxm.php", {
            headers: Object.assign(
                {
                    "content-type": "application/x-www-form-urlencoded",
                    accept: "application/json, text/javascript, */*",
                    cookie: "codelen=1; pc_ad1=1",
                    referer,
                },
                headersObj
            ),
            body: objToURL({
                action: "downprocess",
                signs: "%3Fctdf",
                sign: findByRE(encryptPage, /'sign':'([^']+)'/),
                ves: 1,
                websign: "",
                websignkey: findByRE(encryptPage, /websignkey = '([^']+)'/), // var websignkey = 'ytpX';
            }),
            method: "POST",
        });
        const down_url = ajax.dom + "/file/" + ajax.url;
        return { zt: 1, info: await downloadRedirect(down_url), text: null };
    } catch (e) {
        return { zt: 0, info: e, text: e.message };
    }
}

// 查询信息无需密码
async function queryShareFileInfoWithPassword(shareURL: string): Promise<queryShareFileResp> {
    try {
        const text = await fetchText(shareURL);
        const { type, requirePassword } = await getTypeOfShareLink(shareURL);
        if (type === "null") throw new LanzouAPIError("文件取消分享了");
        if (!requirePassword) throw new LanzouAPIError("不需要密码");
        if (type !== "file") throw new LanzouAPIError("不是文件分享链接");

        const user = findByRE(text, /<span class="user-name">([^<]+)<\/span>/) || "unknown";
        const [, time, system] =
            text.match(
                /<div class="n_file_info"><span class="n_file_infos">([^<]+)<\/span> <span class="n_file_infos">([^<]+)<\/span>/
            ) || new Array(3).fill("unknown");
        const size = findByRE(text, /<div class="n_filesize">大小：([^<]+)<\/div>/) || "unknown";
        return { zt: 1, info: { name: "unknown", size, time, user, system, description: "" }, text: null };
    } catch (e) {
        return { zt: 0, info: e, text: e.message };
    }
}

async function queryShareFileLinkWithPassword(shareURL: string, password: string): Promise<queryShareLinkResp> {
    try {
        const text = await fetchText(shareURL);
        const { type, requirePassword } = await getTypeOfShareLink(shareURL);
        if (type === "null") throw new LanzouAPIError("文件取消分享了");
        if (!requirePassword) throw new LanzouAPIError("不需要密码");
        if (type !== "file") throw new LanzouAPIError("不是文件分享链接");

        const ajax = await fetchJSON("https://upload.lanzouj.com/ajaxm.php", {
            headers: {
                "content-type": "application/x-www-form-urlencoded",
                origin: new URL(shareURL).origin,
                referer: shareURL,
                ...headersObj,
            },
            body: findByRE(text, /data\W+:\W+'(action=downprocess&sign=[^&]+&p=)'/) + password,
            method: "POST",
        });
        if (ajax.zt === 1) {
            // 请求获取下载链接，成功
            const down_url = ajax.dom + "/file/" + ajax.url;
            return { zt: 1, info: await downloadRedirect(down_url), text: ajax.inf };
        } else {
            // 失败
            throw new LanzouAPIError("密码不正确 " + ajax.inf);
        }
    } catch (e) {
        return { zt: 0, info: e, text: e.message };
    }
}

async function queryShareFolderWithPassword(
    shareURL: string,
    password: string,
    pgs = 1
): Promise<queryShareFolderResp> {
    try {
        const text = await fetchText(shareURL);
        const { type, requirePassword } = await getTypeOfShareLink(shareURL);
        if (type === "null") throw new LanzouAPIError("文件夹取消分享了");
        if (!requirePassword) throw new LanzouAPIError("不需要密码");
        if (type !== "folder") throw new LanzouAPIError("不是文件夹分享链接");
        /*var pgs;
    两个随机加密参数写死在页面上，pgs参数控制分页
	var ib4cdh = '1649234801';
	var ih2ofa = '405b3bfb25a0f183d2a4e777a808df61';
	pgs =1;*/

        const part = findTextBetween(text, "var pgs;", "pgs =");
        if (!part) throw new LanzouAPIError("API异常，需要修复。无法找到加密参数");
        const match1 = part.match(/var (\w+) = '(\d+)';/);
        if (!(match1?.length === 3)) throw new LanzouAPIError("API异常，需要修复。无法解析加密参数1");
        const [part1, key1, val1] = match1;
        const match2 = part.replace(part1, "").match(/var (\w+) = '(\w+)';/);
        if (!(match2?.length === 3)) throw new LanzouAPIError("API异常，需要修复。无法解析加密参数2");
        const [part2, key2, val2] = match2;
        let jsonBody = findTextBetween(text, "data : ", "dataType : 'json',");
        if (!jsonBody) throw new LanzouAPIError("API异常，需要修复。无法获取加密json");
        jsonBody = jsonBody
            .replace("},", "}")
            .replace("pgs", String(pgs))
            .replace(key1, `"${val1}"`)
            .replace(key2, `"${val2}"`)
            .replace("'pwd':pwd", `"pwd":"${password}"`)
            .replace(/'/g, '"');
        const ajax = await fetchJSON("https://upload.lanzouj.com/filemoreajax.php", {
            headers: {
                "content-type": "application/x-www-form-urlencoded",
                origin: new URL(shareURL).origin,
                referer: shareURL,
                ...headersObj,
            },
            body: objToURL(JSON.parse(jsonBody)),
            method: "POST",
        });
        return {
            zt: 1,
            info: ajax.text.map((e: any) => {
                return { link: new URL(shareURL).origin + "/" + e.id, name: e.name_all, size: e.size, time: e.time };
            }),
            text: ajax.info,
        };
    } catch (e) {
        return { zt: 0, info: e, text: e.message };
    }
}

async function queryShareFolder(shareURL: string): Promise<queryShareFolderResp> {
    // !TODO 暂未实现
    try {
        const text = await fetchText(shareURL);
        const { type, requirePassword } = await getTypeOfShareLink(shareURL);
        if (type === "null") throw new LanzouAPIError("文件夹取消分享了");
        if (requirePassword) throw new LanzouAPIError("需要密码");
        if (type !== "folder") throw new LanzouAPIError("不是文件夹分享链接");
        throw new LanzouAPIError("暂未实现");
    } catch (e) {
        return { zt: 0, info: e, text: e.message };
    }
}

export {
    queryShareFileLink,
    queryShareFileLinkWithPassword,
    queryShareFileInfo,
    queryShareFileInfoWithPassword,
    queryShareFolder,
    queryShareFolderWithPassword,
};
