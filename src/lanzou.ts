import { fetchJSON, objToURL, LanzouAPIError } from "./util.js";
import { getPasswordShareInfo, getPasswordShareLink, getShareLink, getShareInfo } from "./util.js";
import { getBasename, createReadStream, isFileExists } from "./util.js";
import { FormData, fileFromSync } from "node-fetch";
import {
    anyResp,
    uploadFileResp,
    createFolderResp,
    listFileResp,
    listFolderResp,
    infoFileResp,
    infoFolderResp,
    operateResp,
    moveFileTargetResp,
    moveFileActionResp,
    passwordResp,
    shareResp,
    linkResp,
} from "./types";

class LanzouAPI {
    private cookie: string;
    /**
     * @param cookie 在 https://pc.woozooo.com/mydisk.php 获取 cookie，有效期约两天
     */
    constructor(cookie: string) {
        this.cookie = cookie;
    }

    private async fetchLanzou(bodyObj): Promise<anyResp> {
        try {
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
        } catch (e) {
            return { zt: 0, info: e, text: e.message };
        }
    }
    /**
     * @description 按页获取指定目录文件
     * @param folder_id 目录id，默认为根目录
     * @param pg 页数，默认为1
     */
    async getFiles(folder_id = -1, pg = 1): Promise<listFileResp> {
        return await this.fetchLanzou({
            task: 5,
            folder_id,
            pg,
        });
    }

    /**
     * @description 按页获取指定目录文件夹
     * @param folder_id 目录id，默认为根目录
     * @param pg 页数，默认为1
     */
    async getFolders(folder_id = -1, pg = 1): Promise<listFolderResp> {
        return await this.fetchLanzou({
            task: 47,
            folder_id,
            pg,
        });
    }

    /**
     * @description 获取指定文件的详细信息
     * @param file_id 文件id
     */
    async getFileInfo(file_id: number): Promise<infoFileResp> {
        return await this.fetchLanzou({
            task: 22,
            file_id,
        });
    }

    /**
     * @description 获取指定文件夹的详细信息
     * @param folder_id 文件夹id
     */
    async getFolderInfo(folder_id: number): Promise<infoFolderResp> {
        return await this.fetchLanzou({
            task: 18,
            folder_id,
        });
    }

    /**
     * @description 删除指定文件
     * @param file_id 文件id
     */
    async deleteFile(file_id: number): Promise<operateResp> {
        return await this.fetchLanzou({
            task: 6,
            file_id,
        });
    }

    /**
     * @description 删除指定文件夹
     * @param folder_id 文件夹id
     */
    async deleteFolder(folder_id: number): Promise<operateResp> {
        return await this.fetchLanzou({
            task: 3,
            folder_id,
        });
    }

    /**
     * @description 创建文件夹
     * @param parent_id 父目录id，默认为根目录
     * @param folder_name 文件夹名称，默认为 "新建文件夹"
     * @param folder_description 文件夹描述，默认为空
     */
    async createFolder(parent_id = 0, folder_name = "新建文件夹", folder_description = ""): Promise<createFolderResp> {
        return await this.fetchLanzou({
            task: 2,
            parent_id,
            folder_name,
            folder_description,
        });
    }

    /**
     * @description 重命名文件夹和修改文件夹描述
     * @param folder_id 文件夹id
     * @param folder_name 重命名的文件夹名称，默认为 "新建文件夹"
     * @param folder_description 文件夹描述，默认为空
     */
    async renameFolder(folder_id: number, folder_name = "新建文件夹", folder_description = ""): Promise<operateResp> {
        return await this.fetchLanzou({
            task: 4,
            folder_id,
            folder_name,
            folder_description,
        });
    }

    /**
     * @description 通过文件id获取文件的名称
     * @param file_id 文件id
     */
    async queryFileNameByID(file_id: number): Promise<anyResp> {
        return await this.fetchLanzou({
            task: 46,
            file_id,
            type: 1,
        });
    }

    /**
     * @description 只有会员才能重命名文件。 非会员返回：此功能仅会员使用，请先开通会员
     * @param file_id 文件id
     * @param file_name 新的文件名称
     */
    async renameFile(file_id: number, file_name: string): Promise<operateResp> {
        return await this.fetchLanzou({
            task: 46,
            file_id,
            file_name,
            type: 2,
        });
    }
    /**
     * @description 先通过moveFileTarget找到指定文件夹，再通过moveFileAction移动文件到指定的文件夹
     * @param file_id 文件id
     */
    async moveFileTarget(file_id: number): Promise<moveFileTargetResp> {
        return await this.fetchLanzou({
            task: 19,
            file_id,
        });
    }
    /**
     * @description 先通过moveFileTarget找到指定文件夹，再通过moveFileAction移动文件到指定的文件夹
     * @param file_id 文件id
     * @param folder_id 目标文件夹id
     */
    async moveFileAction(file_id: number, folder_id: number): Promise<moveFileActionResp> {
        return await this.fetchLanzou({
            task: 20,
            file_id,
            folder_id,
        });
    }
    /**
     * @description 设置文件描述。如果之前已经有了就不能设置为空
     * @param file_id 文件id
     * @param desc 文件描述
     */
    async setFileDescription(file_id: number, desc: string): Promise<operateResp> {
        return await this.fetchLanzou({
            task: 11,
            file_id,
            desc,
        });
    }
    /**
     * @description 设置文件是否公开，或设置文件访问密码。上传的文件默认不需要密码，非会员用户无法取消密码
     * @param shows 是否需要密码，1需要，0不需要，非会员用户无法取消密码（即传入0无效）
     * @param shownames 访问密码，长度在2-6之间，shows为0时无需传入
     */
    async setFilePassword(file_id: number, shows: 0 | 1, shownames?: string): Promise<passwordResp> {
        if (shows && shownames && (shownames.length < 2 || shownames.length > 6))
            throw new LanzouAPIError("密码长度必须在2-6之间");
        return await this.fetchLanzou({
            task: 23,
            file_id,
            shownames,
            shows,
        });
    }

    /**
     * @description 设置文件夹是否公开，或设置文件夹访问密码。文件夹默认不需要密码，非会员用户无法取消密码
     * @param shows 是否需要密码，1需要，0不需要，非会员用户无法取消密码（即传入0无效）
     * @param shownames 访问密码，长度在2-6之间
     */
    async setFolderPassword(folder_id: number, shows: 0 | 1, shownames?: string): Promise<passwordResp> {
        if (shows && shownames && (shownames.length < 2 || shownames.length > 6))
            throw new LanzouAPIError("密码长度必须在2-6之间");
        return await this.fetchLanzou({
            task: 16,
            folder_id,
            shownames,
            shows,
        });
    }

    /**
     * @description 上传本地文件。注意文件上传受到限制，普通用户只能上传100M以下的文件，文件后缀也受限制
     * @param folder_id 文件夹id
     * @param filepath 文件路径
     * @param filename 文件名，为空时自动通过文件路径获取
     */
    async uploadFile(folder_id = -1, filepath: string): Promise<uploadFileResp> {
        if (!(await isFileExists(filepath))) {
            throw new LanzouAPIError(`文件 ${filepath} 不存在`);
        }
        if (!folder_id) folder_id = -1;
        const filename = getBasename(filepath);
        const allowList = `doc,docx,zip,rar,apk,ipa,txt,exe,7z,e,z,ct,ke,cetrainer,db,tar,gz,pdf,w3x
        epub,mobi,azw,azw3,osk,osz,xpa,cpk,lua,jar,dmg,ppt,pptx,xls,xlsx,mp3
        ipa,iso,img,gho,ttf,ttc,txf,dwg,bat,imazingapp,dll,crx,xapk,conf
        deb,rp,rpm,rplib,mobileconfig,appimage,lolgezi,flac
        cad,hwt,accdb,ce,xmind,enc,bds,bdi,ssf,it`
            .replace(/\r\n|\r|\n/g, ",")
            .replace(/ +/g, "")
            .split(",");
        if (!allowList.includes(filename.split(".").pop())) {
            throw new LanzouAPIError("文件类型不允许上传");
        }
        const fd = new FormData();
        fd.append("task", "1");
        fd.append("ve", "2");
        fd.append("id", "WU_FILE_0");
        fd.append("name", filename);
        fd.append("folder_id_bb_n", String(folder_id));
        fd.append("upload_file", fileFromSync(filepath));
        return await (fetchJSON as any)("https://pc.woozooo.com/fileup.php", {
            headers: {
                cookie: this.cookie,
            },
            body: fd,
            method: "POST",
        });
    }
    /**
     * @description 获取蓝奏云文件分享页信息
     * @param shareURL 蓝奏云文件分享页链接
     * @param password 分享密码，传入*任意*密码时将查询加密文件分享页信息，否则查询非加密文件分享页信息
     */
    static async queryShareInfo(shareURL: string, password?: string): Promise<shareResp> {
        if (password) {
            return await getPasswordShareInfo(shareURL, password);
        } else {
            return await getShareInfo(shareURL);
        }
    }

    /**
     * @description 获取蓝奏云文件分享的实际下载链接，失败时返回空字符串（或非URL）
     * @param shareURL 蓝奏云文件分享页链接
     * @param password 分享密码，传入正确密码时将查询加密文件分享页信息，否则查询非加密文件分享页信息
     */
    static async queryShareLink(shareURL: string, password?: string): Promise<linkResp> {
        if (password) {
            return await getPasswordShareLink(shareURL, password);
        } else {
            return await getShareLink(shareURL);
        }
    }
}

export default LanzouAPI;
