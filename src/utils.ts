import fetch from "node-fetch";
import fs from "node:fs";
import { headersObj } from "./data.js";

class LanzouAPIError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "LanzouAPIError";
    }
}

class CacheQueue<K, V> {
    protected array: [K, V][] = [];
    protected capacity: number;
    constructor(capacity = 8) {
        this.capacity = capacity;
    }
    public has(key: K): boolean {
        return this.array.some(([k]) => k === key);
    }
    public set(key: K, value: V): boolean {
        if (this.has(key)) {
            return false;
        }
        if (this.array.length >= this.capacity) {
            this.array.shift();
        }
        this.array.push([key, value]);
        return true;
    }
    public get(key: K): V | undefined {
        const index = this.array.findIndex(([k]) => k === key);
        if (index === -1) {
            return undefined;
        }
        return this.array[index][1];
    }
    public delete(key: K): boolean {
        const index = this.array.findIndex(([k]) => k === key);
        if (index === -1) {
            return false;
        }
        this.array.splice(index, 1);
        return true;
    }
    public clear(): void {
        this.array = [];
    }
    public keys(): K[] {
        return this.array.map(([k]) => k);
    }
    public values(): V[] {
        return this.array.map(([, v]) => v);
    }
}

const cacheQueue = new CacheQueue<RequestInfo, string>(16);
async function fetchText(...args: [RequestInfo, RequestInit?]): Promise<string> {
    // 请求会缓存
    if (cacheQueue.has(args[0])) {
        return cacheQueue.get(args[0]) as string;
    }
    const resp = await (fetch as any)(...args);
    if (resp.ok) {
        const text = resp.text();
        cacheQueue.set(args[0], text);
        return text;
    } else {
        throw new LanzouAPIError("网络请求错误 " + resp.statusText);
    }
}

async function fetchJSON(...args: [RequestInfo, RequestInit?]): Promise<any> {
    // 请求不会缓存
    const resp = await (fetch as any)(...args);
    if (resp.ok) {
        return resp.json();
    } else {
        throw new LanzouAPIError("网络请求错误 " + resp.statusText);
    }
}

function objToURL(obj: any): string {
    const sp = new URLSearchParams();
    for (let i in obj) {
        sp.append(i, obj[i]);
    }
    return sp.toString();
}

function findByRE(str: string, re: RegExp): string | undefined {
    const match = str.match(re);
    if (match) {
        return match[1];
    } else {
        return undefined;
    }
}

function findTextBetween(text: string, startText: string, endText: string): string | null {
    const start = text.indexOf(startText);
    const end = text.indexOf(endText, start);
    if (start === -1 || end === -1) return null;
    return text.slice(start + startText.length, end);
}

async function downloadRedirect(link: string): Promise<string> {
    // 获取真实下载链接
    return await (fetch as any)(link, {
        headers: headersObj,
        body: null,
        method: "GET",
    }).then((res: any) => res.url);
}

function isShareLink(url: string): boolean {
    return /https?:\/\/[A-Za-z0-9]+\.lanzou\w\.com\/[A-Za-z0-9]+/.test(url);
}

interface ShareType {
    type: "file" | "folder" | "null"; // null表示文件取消分享
    requirePassword: boolean;
}

async function getTypeOfShareLink(url: string): Promise<ShareType> {
    if (!isShareLink(url)) return { type: "null", requirePassword: false };
    // 为了减少请求次数，传入html
    const html: string = await fetchText(url);
    if (
        html.includes(`<div class="off"><div class="off0"><div class="off1"></div></div>来晚啦...文件取消分享了</div>`)
    ) {
        return {
            type: "null",
            requirePassword: false,
        };
    }
    if (html.includes(`frameborder="0" scrolling="no"></iframe>`)) {
        return {
            type: "file",
            requirePassword: false,
        };
    }
    if (html.includes(`id="filenajax">文件</div>`)) {
        return {
            type: "file",
            requirePassword: true,
        };
    }
    if (html.includes(`<div id="infomores"><span id="filemore" onclick="more();">显示更多文件</span></div>`)) {
        return {
            type: "folder",
            requirePassword: true,
        };
    }
    throw new LanzouAPIError("无法获取分享类型");
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

export { LanzouAPIError, findByRE, isShareLink, getTypeOfShareLink, findTextBetween };
export { isFileExists, isFile }; // file tools
export { basename as getBasename } from "path"; // file tools
export { createReadStream } from "fs";
export { fetch, fetchJSON, objToURL, fetchText, downloadRedirect }; // network tools
