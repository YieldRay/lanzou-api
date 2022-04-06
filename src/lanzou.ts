import { fetchJSON, objToURL, LanzouAPIError, isShareLink, getTypeOfShareLink } from "./utils.js";
import { getBasename, isFileExists } from "./utils.js";
import {
    queryShareFileLink,
    queryShareFileLinkWithPassword,
    queryShareFileInfo,
    queryShareFileInfoWithPassword,
    queryShareFolder,
    queryShareFolderWithPassword,
} from "./query.js";

import { allowList, headersObj } from "./data.js";
import { FormData, fileFromSync } from "node-fetch";
// 实测 fileFromSync 性能比 fs.createReadStream(from-data库) 更好
import {
    anyResp,
    uploadFileResp,
    createFolderResp,
    listFileResp,
    listFolderResp,
    shareFileResp,
    shareFolderResp,
    operateResp,
    moveFileTargetResp,
    moveFileActionResp,
    passwordResp,
} from "./types";

class LanzouAPI {
    private cookie: string;

    public static allowList = allowList;

    /**
     * @param cookie 在 https://pc.woozooo.com/mydisk.php 获取 cookie，有效期约两天
     * @returns LanzouAPI 实例
     */
    public static of(cookie: string): LanzouAPI {
        return new LanzouAPI(cookie);
    }

    /**
     * @param cookie 在 https://pc.woozooo.com/mydisk.php 获取 cookie，有效期约两天
     */
    constructor(cookie: string) {
        this.cookie = cookie;
    }

    /**
     * @description 判断是否为蓝奏云文件分享页链接，请求会进行一定的缓存
     * @param url 分享链接
     * @returns 布尔值，是否为蓝奏云文件分享页链接
     */
    static isShareLink = isShareLink;

    /**
     * @description 判断文件分享页的类型
     * @param url 分享链接
     * @returns 返回 {type: "file"|"folder"|null, requirePassword: true|false}
     */
    static getTypeOfShareLink = getTypeOfShareLink;

    /**
     * @description 生成随机分享密码
     * @param length 密码长度
     */
    static genRandomPassword(length: number = 4): string {
        const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let text = "";
        for (let i = 0; i < length; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
    }

    private async fetchLanzou(bodyObj: object): Promise<anyResp> {
        try {
            const json = await fetchJSON("https://pc.woozooo.com/doupload.php", {
                headers: {
                    accept: "application/json, text/javascript, */*; q=0.01",
                    "cache-control": "no-cache",
                    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                    cookie: this.cookie,
                    ...headersObj,
                },
                body: objToURL(bodyObj),
                method: "POST",
            });
            if (Reflect.has(json, "zt") && json.zt === undefined) {
                // 蓝奏云API异常处理
                json.zt = 0;
            }
            return json;
        } catch (e) {
            return { zt: 0, info: e, text: e.message };
        }
    }

    /**
     * @description 按页获取指定目录文件
     * @param folder_id 目录id，默认为根目录
     * @param pg 页数，默认为1
     * @returns 成功值 {"zt":1,"info":[],"text": [{},{},...]}
     */
    async getFiles(folder_id = -1, pg = 1): Promise<listFileResp> {
        if (!folder_id) folder_id = -1;
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
     * @returns 成功值 {"zt":1,"info": [{},{},...],"text":null}
     */
    async getFolders(folder_id = -1, pg = 1): Promise<listFolderResp> {
        if (!folder_id) folder_id = -1;
        return await this.fetchLanzou({
            task: 47,
            folder_id,
            pg,
        });
    }

    /**
     * @description 获取文件的分享地址
     * @param file_id 文件id
     * @returns 成功值 {"zt":1,"info":{"pwd":"访问密码","onof":"0","f_id":"ii5ZQ01qmpqb","taoc":"","is_newd":"https:\/\/upload.lanzouj.com"},"text":null}
     */
    async shareFile(file_id: number): Promise<shareFileResp> {
        return await this.fetchLanzou({
            task: 22,
            file_id,
        });
    }

    /**
     * @description 获取文件夹的分享地址
     * @param folder_id 文件夹id
     * @returns 成功值 {"zt":1,"info":{"name":"文件夹名称","des":"文件夹描述","pwd":"访问密码","onof":"1","taoc":"","is_newd":"https:\/\/upload.lanzouj.com","new_url":"https:\/\/upload.lanzouj.com\/xxxx"},"text":null}
     */
    async shareFolder(folder_id: number): Promise<shareFolderResp> {
        return await this.fetchLanzou({
            task: 18,
            folder_id,
        });
    }

    /**
     * @description 删除指定文件
     * @param file_id 文件id
     * @returns 成功值 {"zt":1,"info":"已删除","text":null}
     */
    async deleteFile(file_id: number): Promise<operateResp> {
        return await this.fetchLanzou({
            task: 6,
            file_id,
        });
    }

    /**
     * @description 删除指定文件夹，注意蓝奏云只能删除没有子文件夹的文件夹
     * @param folder_id 文件夹id
     * @returns 成功值 {"zt":1,"info":"删除成功","text":null}
     */
    async deleteFolder(folder_id: number): Promise<operateResp> {
        return await this.fetchLanzou({
            task: 3,
            folder_id,
        });
    }

    /**
     * @description 创建文件夹，文件夹名称可以重复
     * @param parent_id 父目录id，默认为根目录
     * @param folder_name 文件夹名称，默认为 "新建文件夹"
     * @param folder_description 文件夹描述，默认为空
     * @returns 成功值 {"zt":1,"info":"创建成功","text":"生成的文件夹id字符串"}
     */
    async createFolder(
        parent_id: number = 0,
        folder_name: string = "新建文件夹",
        folder_description: string = ""
    ): Promise<createFolderResp> {
        if (!parent_id) parent_id = 0;
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
     * @returns 成功值 {"zt":1,"info":"修改成功","text":null}
     */
    async renameFolder(
        folder_id: number,
        folder_name: string = "新建文件夹",
        folder_description: string = ""
    ): Promise<operateResp> {
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
     * @returns {"zt":1,"info":"文件名称","text":""}
     */
    async getFileNameByID(file_id: number): Promise<anyResp> {
        return await this.fetchLanzou({
            task: 12,
            file_id,
            type: 1,
        });
    }

    /**
     * @description 只有会员才能重命名文件。
     * @param file_id 文件id
     * @param file_name 新的文件名称
     * @returns 失败值 {"zt":0,"info":"此功能仅会员使用，请先开通会员","text":null}
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
     * @returns 成功值 {"zt":1,"info":[{folder_name:"name",folder_id:"id"},...],"text":null}
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
     * @returns 成功值 {"zt":1,"info":"移动成功","text":null}
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
     * @returns 成功值 {"zt":1,"info":"设置成功","text":null}
     */
    async setFileDescription(file_id: number, desc: string = ""): Promise<operateResp> {
        return await this.fetchLanzou({
            task: 11,
            file_id,
            desc,
        });
    }
    /**
     * @description 设置文件是否公开，或设置文件访问密码。上传的文件默认不需要密码，非会员用户无法取消密码
     * @param file_id 文件id
     * @param shows 是否需要密码，1需要，0不需要，如果需要密码但没有传入shownames则自动生成。非会员用户无法取消密码（即传入0无效）
     * @param shownames 访问密码，长度在2-6之间，shows为0时无需传入
     * @returns 成功值 {"zt":1,"info":"设置/修改成功","text":0无密码/1有密码} 失败值，注意zt原本为null，但api将其设置为0以保证一致性 {"zt":null,"info":"此功能仅会员使用（个人中心 - 会员个性化）","text":null}
     */
    async setFilePassword(file_id: number, shows: 0 | 1, shownames?: string): Promise<passwordResp> {
        if (shows) {
            if (shownames) {
                if (shownames.length < 2 || shownames.length > 6) throw new LanzouAPIError("密码长度必须在2-6之间");
            } else {
                shownames = LanzouAPI.genRandomPassword();
            }
        } else {
            shownames = "";
        }
        return await this.fetchLanzou({
            task: 23,
            file_id,
            shownames,
            shows,
        });
    }

    /**
     * @description 设置文件夹是否公开，或设置文件夹访问密码。文件夹默认不需要密码，非会员用户无法取消密码
     * @param folder_id 文件夹id
     * @param shows 是否需要密码，1需要，0不需要，非会员用户无法取消密码（即传入0无效）
     * @param shownames 访问密码，长度在2-6之间
     * @returns 成功值 {"zt":1,"info":"修改成功","text":1} 失败值，注意zt原本为null，但api将其设置为0以保证一致性 {"zt":null,"info":"此功能仅会员使用（个人中心 - 会员个性化）","text":null}
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
     * @description 上传本地文件。注意文件上传受到限制，普通用户只能上传100M以下的文件，文件后缀也受限制。
     * @param folder_id 存放的文件夹id，默认为根目录
     * @param filepath 文件路径
     * @returns 成功值 {"zt":1,"info":"上传成功","text":[{"icon":"zip","id":"65107976","f_id":"iMnMi01qglvg","name_all":"test.zip","name":"test.zip","size":"100.0 M","time":"0 秒前","downs":"0","onof":"0","is_newd":"https://upload.lanzouj.com"}]}
     */
    async uploadFile(folder_id = -1, filepath: string): Promise<uploadFileResp> {
        try {
            if (!(await isFileExists(filepath))) {
                throw new LanzouAPIError(`文件 ${filepath} 不存在`);
            }
            if (!folder_id) folder_id = -1;
            const filename = getBasename(filepath);
            if (!LanzouAPI.allowList.includes(filename.split(".").pop())) {
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
        } catch (e) {
            return { zt: 0, info: e.message, text: e };
        }
    }

    static queryShareFileLink = queryShareFileLink;
    static queryShareFileLinkWithPassword = queryShareFileLinkWithPassword;
    static queryShareFileInfo = queryShareFileInfo;
    static queryShareFileInfoWithPassword = queryShareFileInfoWithPassword;
    static queryShareFolder = queryShareFolder;
    static queryShareFolderWithPassword = queryShareFolderWithPassword;
}

export default LanzouAPI;
