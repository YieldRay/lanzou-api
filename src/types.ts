interface LanzouFile {
    icon: string;
    id: string;
    name_all: string;
    name: string;
    size: string;
    time: string;
    downs: string;
    onof: string;
}

interface ListFile extends LanzouFile {
    is_lock: string;
    filelock: string;
    is_copyright: number;
    is_bakdownload: number;
    bakdownload?: string;
    is_des: number;
    is_ico: number;
}

interface UploadFile extends LanzouFile {
    is_newd: string;
    f_id: string;
}

interface ShareFile {
    pwd: string;
    onof: string;
    f_id: string;
    taoc: string;
    is_newd: string;
}

interface LanzouFolder {
    name: string;
    onof: string;
}

interface ListFolder extends LanzouFolder {
    folderlock: string;
    is_lock: string;
    is_copyright: string;
    fol_id: string;
    folder_des: string;
}

interface ShareFolder extends LanzouFolder {
    des: string;
    pwd: string;
    taoc: string;
    is_newd: string;
    new_url: string;
}

// Response

interface LanzouResponse<Info = any, Text = any> {
    zt: number;
    info: Info;
    text: Text;
}

type LanzouResp<Info = any, Text = any> = LanzouResponse<Info | Error, Text | string | null>; // response基本类型

type UploadFileResp = LanzouResp<string, UploadFile[]>;
type ListFileResp = LanzouResp<any[], ListFile[]>; // 目前蓝奏云返回的是空数组
type ListFolderResp = LanzouResp<any[], ListFolder[]>; // 目前蓝奏云返回的是空数组

type OperateResp = LanzouResp<string, null>;
type CreateFolderResp = LanzouResp<string, string>;
type PasswordResp = LanzouResp<string, number>;

type SimpleFolder = { folder_name: string; foldr_id: string };
type MoveFileTargetResp = LanzouResp<SimpleFolder[], null>;
type MoveFileActionResp = LanzouResp<string, null>;
// 分享自己的文件
type ShareFileResp = LanzouResp<ShareFile, null>;
type ShareFolderResp = LanzouResp<ShareFolder, null>;

//  查询分享文件夹，信息文件夹没有嵌套
interface QueryShareFolderInfo {
    name: string;
    time: string; // 时间不是详细时间，仅供展示用
    files: {
        link: string; // 分享链接
        name: string;
        size: string;
        time: string; // 时间不是详细时间，仅供展示用
    }[];
}

// 查询分享文件信息
interface QueryShareFileInfo {
    name: string;
    size: string;
    time: string; // 时间不是详细时间，仅供展示用
    user?: string;
    system?: string;
    description?: string;
}

type QueryShareFileResp = LanzouResp<QueryShareFileInfo, string>;
type QueryShareFolderResp = LanzouResp<QueryShareFolderInfo | Error, string>;
// {zt: 0|1, info: 成功数据|Error, text: null|string}
type QueryShareLinkResp = LanzouResp<string, string>;

export {
    ListFile,
    ShareFile,
    UploadFile,
    ListFolder,
    ShareFolder,
    LanzouResp,
    UploadFileResp,
    CreateFolderResp,
    ListFileResp,
    ListFolderResp,
    ShareFileResp,
    ShareFolderResp,
    OperateResp,
    MoveFileTargetResp,
    MoveFileActionResp,
    PasswordResp,
    QueryShareLinkResp,
    QueryShareFileInfo,
    QueryShareFolderInfo,
    QueryShareFileResp,
    QueryShareFolderResp,
};
