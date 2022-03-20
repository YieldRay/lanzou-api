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

interface infoFile {
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

interface infoFolder extends folder {
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
type shareFileResp = response<infoFile, null>;
type shareFolderResp = response<infoFolder, null>;

type operateResp = response<string, null>; // {zt: 1, info: '已删除/...', text: null}
type createFolderResp = response<string, string>; // {zt: 1, info: "创建成功", text: "5000111"} // 5000111是folder_id，文件夹名字可以重复
type passwordResp = response<string, number>; // {zt: 1, info: "设置/修改成功", text: 1} // 1有密码，0没有密码

type simpleFolder = { folder_name: string; foldr_id: string };
type moveFileTargetResp = response<simpleFolder[], null>;
type moveFileActionResp = response<string, null>; // {zt: 1, info: "移动成功", text: null}

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
