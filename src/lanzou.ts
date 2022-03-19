import fetch from "node-fetch";
import FormData from "form-data";
import fs from "node:fs";
import path from "node:path";
import {
    uploadFileResp,
    createFolderResp,
    listFileResp,
    renameResp,
    listFolderResp,
    infoFileResp,
    infoFolderResp,
    deleteResp,
    moveFileTargetResp,
    moveFileActionResp,
    passwordResp,
    normalDownloadInfo,
    passwordDownloadInfo,
    downloadResp,
} from "./types";
type fetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>;

class LanzouAPI {
    private cookie: string;
    /**
     * @param cookie 在 https://pc.woozooo.com/mydisk.php 获取 cookie，有效期约两天
     */
    constructor(cookie: string) {
        this.cookie = cookie;
    }
    /**
     * @param link 此函数内部使用，获取实际下载链接
     */
    static async download(link) {
        return await (fetch as fetch)(link, {
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
    async fetchLanzou(bodyObj) {
        return fetchJSON("https://pc.woozooo.com/doupload.php", {
            headers: {
                accept: "application/json, text/javascript, */*; q=0.01",
                "cache-control": "no-cache",
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                cookie: this.cookie,
            },
            body: objToURL(bodyObj),
            method: "POST",
        });
    }

    async getFiles(folder_id = -1, pg = 1): Promise<listFileResp> {
        return await this.fetchLanzou({
            task: 5,
            folder_id,
            pg,
        });
    }

    async getFolders(folder_id = -1, pg = 1): Promise<listFolderResp> {
        return await this.fetchLanzou({
            task: 47,
            folder_id,
            pg,
        });
    }
    async getFileInfo(file_id: number): Promise<infoFileResp> {
        return await this.fetchLanzou({
            task: 22,
            file_id,
        });
    }
    async getFolderInfo(folder_id: number): Promise<infoFolderResp> {
        return await this.fetchLanzou({
            task: 18,
            folder_id,
        });
    }
    async deleteFile(file_id: number): Promise<deleteResp> {
        return await this.fetchLanzou({
            task: 6,
            file_id,
        });
    }
    async deleteFolder(folder_id: number): Promise<deleteResp> {
        return await this.fetchLanzou({
            task: 3,
            folder_id,
        });
    }
    async createFolder(parent_id = 0, folder_name = "新建文件夹", folder_description = ""): Promise<createFolderResp> {
        return await this.fetchLanzou({
            task: 2,
            parent_id,
            folder_name,
            folder_description,
        });
    }
    async renameFolder(folder_id: number, folder_name = "新建文件夹", folder_description = ""): Promise<renameResp> {
        return await this.fetchLanzou({
            task: 4,
            folder_id,
            folder_name,
            folder_description,
        });
    }
    // 只有会员才能重命名文件，这里不实现
    /**
     * @description 先通过moveFileTarget找到指定文件夹，再通过moveFileAction移动文件到指定的文件夹
     */
    async moveFileTarget(file_id: number): Promise<moveFileTargetResp> {
        return await this.fetchLanzou({
            task: 19,
            file_id,
        });
    }
    /**
     * @description 先通过moveFileTarget找到指定文件夹，再通过moveFileAction移动文件到指定的文件夹
     */
    async moveFileAction(file_id: number, folder_id: number): Promise<moveFileActionResp> {
        return await this.fetchLanzou({
            task: 20,
            file_id,
            folder_id,
        });
    }
    /**
     * @description 文件描述如果之前已经有了就不能设置为空
     */
    async setFileDescription(file_id: number, desc: string): Promise<renameResp> {
        return await this.fetchLanzou({
            task: 11,
            file_id,
            desc,
        });
    }
    /**
     * @param shownames 访问密码
     * @param shows 是否需要密码，1需要，0不需要，上传的文件默认不需要密码，非会员用户无法取消密码
     */
    async setFilePassword(file_id: number, shownames: string, shows: 0 | 1): Promise<passwordResp> {
        return await this.fetchLanzou({
            task: 23,
            file_id,
            shownames,
            shows,
        });
    }

    /**
     * @param shownames 访问密码
     * @param shows 是否需要密码，1需要，0不需要，只有会员才能设置为不需要
     */
    async setFolderPassword(folder_id: number, shownames: string, shows: 0 | 1): Promise<passwordResp> {
        return await this.fetchLanzou({
            task: 16,
            folder_id,
            shownames,
            shows,
        });
    }
    /**
     * @description 获取分享文件信息，暂时只实现了普通分享链接
     * @param shareURL 蓝奏云分享链接
     */
    static async getDownloadInfo(shareURL: string): Promise<normalDownloadInfo> {
        const text = await (fetch as fetch)(shareURL).then((res) => res.text());
        const title = text.match(/<title>([^<]+)<\/title>/)[1].replace(" - 蓝奏云", "");
        const size = text.match(/<span class="p7">文件大小：<\/span>([^<]+)<br>/)[1];
        const [time, user] = text
            .match(
                /<span class="p7">上传时间：<\/span>([^<]+)<br><span class="p7">分享用户：<\/span><font>([^<]+)<\/font><br>/
            )
            .slice(1);
        const system = text.match(/<span class="p7">运行系统：<\/span>([^<]+)<br>/)[1];
        const description = text.match(/<span class="p7">文件描述([^<]+)<\/span><br>/)[1].slice(1);
        const encryptPage = text.match(/<iframe class="ifr2" name="(?:\d{2,})" src="(\/fn\?[^"]+)"/)[1];
        const encryptPageURL = new URL(shareURL).origin + encryptPage;
        return { title, size, time, user, system, description, encryptPageURL };
    }
    /**
     * @description 获取文件的下载链接，返回值为一对象，其link属性为真实下载链接
     * @param shareURL 蓝奏云分享链接
     */
    static async getDownloadLink(shareURL: string): Promise<downloadResp> {
        const { encryptPageURL } = await this.getDownloadInfo(shareURL);
        const inPage = await (fetch as fetch)(encryptPageURL).then((res) => res.text());
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
                Referer: encryptPageURL,
                "Referrer-Policy": "strict-origin-when-cross-origin",
            },
            body: objToURL({
                action: "downprocess",
                signs: "%3Fctdf",
                sign: inPage.match(/'sign':'([^']+)'/)[1],
                ves: 1,
                websign: "",
                websignkey: inPage.match(/websignkey = '([^']+)'/)[1], // var websignkey = 'ytpX';
            }),
            method: "POST",
        });
        const down_url = ajax.dom + "/file/" + ajax.url;
        return { ...ajax, link: await this.download(down_url) };
    }

    /**
     * @description 获取加密文件的信息，注意此函数不需要密码
     * @param shareURL 蓝奏云分享链接
     */
    static async getDownloadInfoWithPassword(shareURL: string): Promise<passwordDownloadInfo> {
        const text = await (fetch as fetch)(shareURL).then((res) => res.text());
        const user = text.match(/<span class="user-name">([^<]+)<\/span>/)[1];
        const time = text.match(/<span class="n_file_infos">([^<]+)<\/span>/)[1];
        const system = text.match(/<span class="n_file_infos">([^<]+)<\/span>/)[1];
        const size = text.match(/<div class="n_filesize">大小：([^<]+)<\/div>/)[1];
        const description = text.match(/<div class="n_box_des">([^<]+)<\/div>/)[1];
        const encryptBody = text.match(/data\W+:\W+'(action=downprocess&sign=[^&]+&p=)'/)[1];
        return { title: "unknown", size, time, user, system, description, encryptBody };
    }

    /**
     * @description 获取加密文件的下载链接，返回值为一对象，其link属性为真实下载链接
     * @param shareURL 蓝奏云加密分享链接
     */
    static async getDownloadLinkWithPassword(shareURL: string, password: string): Promise<downloadResp> {
        const ajax = await fetchJSON("https://upload.lanzouj.com/ajaxm.php", {
            headers: {
                "content-type": "application/x-www-form-urlencoded",
                origin: new URL(shareURL).origin,
                referer: shareURL,
            },
            body: (await this.getDownloadInfoWithPassword(shareURL)).encryptBody + password,
            method: "POST",
        });
        const down_url = ajax.dom + "/file/" + ajax.url;
        return { ...ajax, link: await this.download(down_url) };
    }
    /**
     * @description 注意文件上传受到限制，普通用户只能上传100M以下的文件，文件后缀也受限制
     * @param filepath 文件路径
     * @param filename 文件名，如果为空，则自动通过文件路径获取
     */
    async uploadFile(filepath: string, filename: string): Promise<uploadFileResp> {
        if (!filename) {
            filename = path.basename(filepath);
        }
        if (!fs.existsSync(filepath)) {
            throw new Error(`文件 ${filepath} 不存在`);
        }
        const allowList = `doc,docx,zip,rar,apk,ipa,txt,exe,7z,e,z,ct,ke,cetrainer,db,tar,gz,pdf,w3x
        epub,mobi,azw,azw3,osk,osz,xpa,cpk,lua,jar,dmg,ppt,pptx,xls,xlsx,mp3
        ipa,iso,img,gho,ttf,ttc,txf,dwg,bat,imazingapp,dll,crx,xapk,conf
        deb,rp,rpm,rplib,mobileconfig,appimage,lolgezi,flac
        cad,hwt,accdb,ce,xmind,enc,bds,bdi,ssf,it`
            .replace(/\r\n|\r|\n/g, ",")
            .replace(/ +/g, "")
            .split(",");
        if (!allowList.includes(filename.split(".").pop())) {
            throw new Error("文件类型不允许上传");
        }
        const fd = new FormData();
        fd.append("task", "1");
        fd.append("ve", "2");
        fd.append("id", "WU_FILE_0");
        fd.append("name", filename);
        fd.append("folder_id_bb_n", "-1");
        fd.append("upload_file", fs.createReadStream(filepath), {
            filename,
        });
        return await (fetchJSON as any)("https://pc.woozooo.com/fileup.php", {
            headers: {
                cookie: this.cookie,
            },
            body: fd,
            method: "POST",
        });
    }
}

async function fetchJSON(...args: [RequestInfo, RequestInit?]) {
    const resp = await (fetch as fetch)(...args);
    if (resp.ok) {
        return resp.json();
    } else {
        return null;
    }
}

function objToURL(obj): string {
    const sp = new URLSearchParams();
    for (let i in obj) {
        sp.append(i, obj[i]);
    }
    return sp.toString();
}

export default LanzouAPI;
