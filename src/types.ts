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

interface response<info, text> {
    zt: number;
    info: info;
    text: text;
}

type uploadFileResp = response<string, uploadFile[]>;
type listFileResp = response<any[], listFile[]>;
type listFolderResp = response<any[], listFolder[]>;
type infoFileResp = response<infoFile, null>;
type infoFolderResp = response<infoFolder, null>;

type deleteResp = response<string, null>; // {zt: 1, info: '已删除', text: null}
type renameResp = response<string, null>; // {zt: 1, info: "修改成功", text: null}
type createFolderResp = response<string, string>; // {zt: 1, info: "创建成功", text: "5000111"} // 5000111是folder_id，文件夹名字可以重复

type passwordResp = response<string, number>; // {zt: 1, info: "设置/修改成功", text: 1} // 1有密码，0没有密码

type simpleFolder = { folder_name: string; foldr_id: string };
type moveFileTargetResp = response<simpleFolder[], null>;
type moveFileActionResp = response<string, null>; // {zt: 1, info: "移动成功", text: null}

interface downloadInfo {
    title: string;
    size: string;
    time: string;
    user: string;
    system: string;
    description: string;
}
interface normalDownloadInfo extends downloadInfo {
    encryptPageURL: string;
}
interface passwordDownloadInfo extends downloadInfo {
    encryptBody: string;
}

interface downloadResp {
    zt: number;
    dom: string;
    url: string;
    inf: number;
    link: string;
}

export {
    response,
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
};
