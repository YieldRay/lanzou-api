import fetch from "node-fetch";
import fs from "fs";
import { shareResp, linkResp } from "./types";

class LanzouAPIError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "LanzouAPIError";
    }
}

async function fetchJSON(...args: [RequestInfo, RequestInit?]) {
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
        headers: {
            accept: "*/*",
            "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
            "cache-control": "no-cache",
            pragma: "no-cache",
            "sec-ch-ua": '" Not A;Brand";v="99", "Chromium";v="99", "Microsoft Edge";v="99"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "cross-site",
            "Referrer-Policy": "strict-origin-when-cross-origin",
        },
        body: null,
        method: "GET",
    }).then((res) => res.url);
}

async function getShareInfo(shareURL: string): Promise<shareResp> {
    const text = await (fetch as any)(shareURL).then((res) => res.text());
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
        const text = await (fetch as any)(shareURL).then((res) => res.text());
        const referer =
            new URL(shareURL).origin + text.match(/<iframe class="ifr2" name="(?:\d{2,})" src="(\/fn\?[^"]+)"/)[1];
        const encryptPage = await (fetch as any)(referer).then((res) => res.text());
        const ajax = await fetchJSON("https://upload.lanzouj.com/ajaxm.php", {
            headers: {
                accept: "application/json, text/javascript, */*",
                "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
                "cache-control": "no-cache",
                "content-type": "application/x-www-form-urlencoded",
                pragma: "no-cache",
                "sec-ch-ua": '" Not A;Brand";v="99", "Chromium";v="99", "Microsoft Edge";v="99"',
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": '"Windows"',
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-requested-with": "XMLHttpRequest",
                cookie: "codelen=1; pc_ad1=1",
                referer,
                "Referrer-Policy": "strict-origin-when-cross-origin",
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
    const text = await (fetch as any)(shareURL).then((res) => res.text());
    try {
        const user = text.match(/<span class="user-name">([^<]+)<\/span>/)[1];
        // <div class="n_file_info"><span class="n_file_infos">3 小时前</span> <span class="n_file_infos">Win桌面</span></div>
        const [, time, system] =
            text.match(
                /<div class="n_file_info"><span class="n_file_infos">([^<]+)<\/span> <span class="n_file_infos">([^<]+)<\/span>/
            ) || new Array(3).fill("unknown");
        const size = text.match(/<div class="n_filesize">大小：([^<]+)<\/div>/)[1];
        // const description = text.match(/<div class="n_box_des">([^<]+)<\/div>/)[1];
        return { zt: 1, info: { title: "unknown", size, time, user, system, description: "" }, text: null };
    } catch (e) {
        return { zt: 0, info: e.message, text: e };
    }
}

async function getPasswordShareLink(shareURL: string, password: string): Promise<linkResp> {
    let ajax: any;
    try {
        const text = await (fetch as any)(shareURL).then((res) => res.text());
        ajax = await fetchJSON("https://upload.lanzouj.com/ajaxm.php", {
            headers: {
                "content-type": "application/x-www-form-urlencoded",
                origin: new URL(shareURL).origin,
                referer: shareURL,
            },
            body: text.match(/data\W+:\W+'(action=downprocess&sign=[^&]+&p=)'/)[1] + password,
            method: "POST",
        });
        if (ajax.zt) {
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

export { fetch, fetchJSON, objToURL, LanzouAPIError };
export { getPasswordShareInfo, getPasswordShareLink, getShareLink, getShareInfo };
export { basename as getBasename } from "path";
export { createReadStream } from "fs";
export { isFileExists, isFile };
