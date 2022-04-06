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
    let text: string;
    try {
        text = await fetchText(shareURL);
    } catch (e) {
        return { zt: 0, info: e.message, text: e };
    }
    const { type, requirePassword } = await getTypeOfShareLink(shareURL);
    if (type === "null") return { zt: 0, info: "文件取消分享了", text: null };
    if (requirePassword) return { zt: 0, info: "需要密码", text: null };
    if (type !== "file") return { zt: 0, info: "链接不是文件分享链接", text: null };

    const name = findByRE(text, /<title>([^<]+)<\/title>/)?.replace(" - 蓝奏云", "") || "unknown";
    const size = findByRE(text, /<span class="p7">文件大小：<\/span>([^<]+)<br>/) || "unknown";
    const time = findByRE(text, /<span class="p7">上传时间：<\/span>([^<]+)<br>/) || "unknown";
    const user = findByRE(text, /<span class="p7">分享用户：<\/span><font>([^<]+)<\/font><br>/);
    const system = findByRE(text, /<span class="p7">运行系统：<\/span>([^<]+)<br>/);
    const description = findByRE(text, /<span class="p7">文件描述：<\/span>([^<]+)<br>/);
    return { zt: 1, info: { name, size, time, user, system, description }, text: null };
}

async function queryShareFileLink(shareURL: string): Promise<queryShareLinkResp> {
    try {
        const text = await fetchText(shareURL);
        const { type, requirePassword } = await getTypeOfShareLink(shareURL);
        if (type === "null") return { zt: 0, info: "文件取消分享了", text: null };
        if (requirePassword) return { zt: 0, info: "需要密码", text: null };
        if (type !== "file") return { zt: 0, info: "不是文件分享链接", text: null };

        const referer =
            new URL(shareURL).origin + findByRE(text, /<iframe class="ifr2" name="(?:\d{2,})" src="(\/fn\?[^"]+)"/);
        const encryptPage = await fetchText(referer);
        const ajax = await fetchJSON("https://upload.lanzouj.com/ajaxm.php", {
            headers: {
                "content-type": "application/x-www-form-urlencoded",
                accept: "application/json, text/javascript, */*",
                cookie: "codelen=1; pc_ad1=1",
                referer,
                ...headersObj,
            },
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
        return { zt: 0, info: e.message, text: e };
    }
}

// 查询信息无需密码
async function queryShareFileInfoWithPassword(shareURL: string): Promise<queryShareFileResp> {
    try {
        const text = await fetchText(shareURL);
        const { type, requirePassword } = await getTypeOfShareLink(shareURL);
        if (type === "null") return { zt: 0, info: "文件取消分享了", text: null };
        if (!requirePassword) return { zt: 0, info: "不需要密码", text: null };
        if (type !== "file") return { zt: 0, info: "不是文件分享链接", text: null };

        const user = text.match(/<span class="user-name">([^<]+)<\/span>/)[1] || "unknown";
        const [, time, system] =
            text.match(
                /<div class="n_file_info"><span class="n_file_infos">([^<]+)<\/span> <span class="n_file_infos">([^<]+)<\/span>/
            ) || new Array(3).fill("unknown");
        const size = text.match(/<div class="n_filesize">大小：([^<]+)<\/div>/)[1];
        return { zt: 1, info: { name: "unknown", size, time, user, system, description: "" }, text: null };
    } catch (e) {
        return { zt: 0, info: e.message, text: e };
    }
}

async function queryShareFileLinkWithPassword(shareURL: string, password: string): Promise<queryShareLinkResp> {
    try {
        const text = await fetchText(shareURL);
        const { type, requirePassword } = await getTypeOfShareLink(shareURL);
        if (type === "null") return { zt: 0, info: "文件取消分享了", text: null };
        if (!requirePassword) return { zt: 0, info: "不需要密码", text: null };
        if (type !== "file") return { zt: 0, info: "不是文件分享链接", text: null };

        const ajax = await fetchJSON("https://upload.lanzouj.com/ajaxm.php", {
            headers: {
                "content-type": "application/x-www-form-urlencoded",
                origin: new URL(shareURL).origin,
                referer: shareURL,
                ...headersObj,
            },
            body: text.match(/data\W+:\W+'(action=downprocess&sign=[^&]+&p=)'/)[1] + password,
            method: "POST",
        });
        if (ajax.zt === 1) {
            // 请求获取下载链接，成功
            const down_url = ajax.dom + "/file/" + ajax.url;
            return { zt: 1, info: await downloadRedirect(down_url), text: ajax.inf };
        } else {
            // 失败
            return { zt: 0, info: "密码不正确", text: ajax.inf };
        }
    } catch (e) {
        return { zt: 0, info: e.message, text: e };
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
        if (type === "null") return { zt: 0, info: "文件取消分享了", text: null };
        if (!requirePassword) return { zt: 0, info: "不需要密码", text: null };
        if (type !== "folder") return { zt: 0, info: "不是文件夹分享链接", text: null };

        /*
    var pgs;
	var ib4cdh = '1649234801';
	var ih2ofa = '405b3bfb25a0f183d2a4e777a808df61';
	pgs =1;
        */
        // pgs =1
        const ib4cdh = findByRE(text, /var ib4cdh = '([^']+)';/);
        const ih2ofa = findByRE(text, /var ih2ofa = '([^']+)';/);
        const jsonBody = findTextBetween(text, "data : ", "dataType : 'json',")
            .replace("},", "}")
            .replace("'pwd':pwd", `'pwd':"${password}"`)
            .replace("pgs", String(pgs))
            .replace("ib4cdh", `"${ib4cdh}"`)
            .replace("ih2ofa", `"${ih2ofa}"`)
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
        console.log(ajax);
        return {
            zt: 1,
            info: ajax.text.map((e: any) => {
                return { link: new URL(shareURL) + "/" + e.id, name: e.name_all, size: e.size, time: e.time };
            }),
            text: ajax.info,
        };
    } catch (e) {
        return { zt: 0, info: e.message, text: e };
    }
}

async function queryShareFolder(shareURL: string): Promise<queryShareFolderResp> {
    // !TODO 暂未实现
    try {
        const text = await fetchText(shareURL);
        const { type, requirePassword } = await getTypeOfShareLink(shareURL);
        if (type === "null") return { zt: 0, info: "文件取消分享了", text: null };
        if (requirePassword) return { zt: 0, info: "需要密码", text: null };
        if (type !== "folder") return { zt: 0, info: "不是文件夹分享链接", text: null };
    } catch (e) {
        return { zt: 0, info: e.message, text: e };
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
