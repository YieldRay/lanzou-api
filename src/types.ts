interface file {
    icon: string;
    id: string;
    name_all: string;
    name: string;
    size: string;
    time: string;
    downs: string;
    onof: string;
}

interface listFile extends file {
    is_lock: string;
    filelock: string;
    is_copyright: number;
    is_bakdownload: number;
    bakdownload?: string;
    is_des: number;
    is_ico: number;
}

interface uploadFile extends file {
    is_newd: string;
    f_id: string;
}

interface shareFile {
    pwd: string;
    onof: string;
    f_id: string;
    taoc: string;
    is_newd: string;
}

interface folder {
    name: string;
    onof: string;
}

interface listFolder extends folder {
    folderlock: string;
    is_lock: string;
    is_copyright: string;
    fol_id: string;
    folder_des: string;
}

interface shareFolder extends folder {
    des: string;
    pwd: string;
    taoc: string;
    is_newd: string;
    new_url: string;
}

interface response<Info, Text> {
    zt: number;
    info: Info;
    text: Text;
}

type anyResp = response<any, any>;

type uploadFileResp = response<string, uploadFile[]>;
type listFileResp = response<any[], listFile[]>; // 目前蓝奏云返回的是空数组
type listFolderResp = response<any[], listFolder[]>; // 目前蓝奏云返回的是空数组
type shareFileResp = response<shareFile, null>;
type shareFolderResp = response<shareFolder, null>;

type operateResp = response<string, null>;
type createFolderResp = response<string, string>;
type passwordResp = response<string, number>;

type simpleFolder = { folder_name: string; foldr_id: string };
type moveFileTargetResp = response<simpleFolder[], null>;
type moveFileActionResp = response<string, null>;

interface shareInfo {
    title: string;
    size: string;
    time: string;
    user: string;
    system: string;
    description: string;
}

type shareResp = response<shareInfo | null, Error | null>;
// {zt: 0|1, info: 成功数据|null, text: null|Error}
type linkResp = response<string | null, Error | null>;

export {
    listFile,
    shareFile,
    uploadFile,
    listFolder,
    shareFolder,
    response,
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
    shareResp,
    shareInfo,
    linkResp,
};
