import fetch from "node-fetch";
import fs from "fs";
import { headersObj } from "./data.js";
import { shareResp, linkResp } from "./types";

class LanzouAPIError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "LanzouAPIError";
    }
}

async function fetchText(...args: [RequestInfo, RequestInit?]): Promise<string> {
    const resp = await (fetch as any)(...args);
    if (resp.ok) {
        return resp.text();
    } else {
        throw new LanzouAPIError("网络请求错误 " + resp.statusText);
    }
}

async function fetchJSON(...args: [RequestInfo, RequestInit?]): Promise<any> {
    const resp = await (fetch as any)(...args);
    if (resp.ok) {
        return resp.json();
    } else {
        throw new LanzouAPIError("网络请求错误 " + resp.statusText);
    }
}

function objToURL(obj: Object): string {
    const sp = new URLSearchParams();
    for (let i in obj) {
        sp.append(i, obj[i]);
    }
    return sp.toString();
}

async function downloadRedirect(link: string): Promise<string> {
    return await (fetch as any)(link, {
        headers: headersObj,
        body: null,
        method: "GET",
    }).then((res) => res.url);
}

async function getShareInfo(shareURL: string): Promise<shareResp> {
    const text = await fetchText(shareURL);
    try {
        const title = text.match(/<title>([^<]+)<\/title>/)[1].replace(" - 蓝奏云", "");
        const size = text.match(/<span class="p7">文件大小：<\/span>([^<]+)<br>/)[1];
        const time = text.match(/<span class="p7">上传时间：<\/span>([^<]+)<br>/)?.[1] || "unknown";
        const user = text.match(/<span class="p7">分享用户：<\/span><font>([^<]+)<\/font><br>/)[1];
        const system = text.match(/<span class="p7">运行系统：<\/span>([^<]+)<br>/)[1];
        // <span class="p7">文件描述：</span><br>
        //   </td>
        // const description 这个有点难搞，先不实现
        return { zt: 1, info: { title, size, time, user, system, description: "" }, text: null };
    } catch (e) {
        return { zt: 0, info: e.message, text: e };
    }
}

async function getShareLink(shareURL: string): Promise<linkResp> {
    try {
        const text = await fetchText(shareURL);
        const referer =
            new URL(shareURL).origin + text.match(/<iframe class="ifr2" name="(?:\d{2,})" src="(\/fn\?[^"]+)"/)[1];
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
                sign: encryptPage.match(/'sign':'([^']+)'/)[1],
                ves: 1,
                websign: "",
                websignkey: encryptPage.match(/websignkey = '([^']+)'/)[1], // var websignkey = 'ytpX';
            }),
            method: "POST",
        });
        const down_url = ajax.dom + "/file/" + ajax.url;
        return { zt: 1, info: await downloadRedirect(down_url), text: null };
    } catch (e) {
        return { zt: 0, info: e.message, text: e };
    }
}

async function getPasswordShareInfo(shareURL: string, password?: string): Promise<shareResp> {
    try {
        const text = await fetchText(shareURL);
        if (text.includes("来晚啦...文件取消分享了")) {
            throw new LanzouAPIError("文件已取消分享");
        }
        const user = text.match(/<span class="user-name">([^<]+)<\/span>/)[1];
        const [, time, system] =
            text.match(
                /<div class="n_file_info"><span class="n_file_infos">([^<]+)<\/span> <span class="n_file_infos">([^<]+)<\/span>/
            ) || new Array(3).fill("unknown");
        const size = text.match(/<div class="n_filesize">大小：([^<]+)<\/div>/)[1];
        return { zt: 1, info: { title: "unknown", size, time, user, system, description: "" }, text: null };
    } catch (e) {
        return { zt: 0, info: e.message, text: e };
    }
}

async function getPasswordShareLink(shareURL: string, password: string): Promise<linkResp> {
    let ajax: any;
    try {
        const text = await fetchText(shareURL);
        if (text.includes("来晚啦...文件取消分享了")) {
            throw new LanzouAPIError("文件已取消分享");
        }
        ajax = await fetchJSON("https://upload.lanzouj.com/ajaxm.php", {
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
            const down_url = ajax.dom + "/file/" + ajax.url;
            return { zt: 1, info: await downloadRedirect(down_url), text: null };
        } else {
            return ajax;
        }
    } catch (e) {
        return { zt: 0, info: e.message, text: e };
    }
}

const isFileExists: (filePath: string) => Promise<boolean> = async (filePath) =>
    await fs.promises
        .access(filePath)
        .then(() => true)
        .catch((_) => false);

const isFile: (filePath: string) => Promise<boolean> = async (filePath) =>
    await fs.promises
        .stat(filePath)
        .then((stat) => stat.isFile())
        .catch((_) => false);

export { isFileExists, isFile };
export { fetch, fetchJSON, objToURL, LanzouAPIError };
export { getPasswordShareInfo, getPasswordShareLink, getShareLink, getShareInfo };
export { basename as getBasename } from "path";
export { createReadStream } from "fs";
