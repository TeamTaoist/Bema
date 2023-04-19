import { exists, writeTextFile, readTextFile } from "@tauri-apps/api/fs"
import { join } from "@tauri-apps/api/path"
import { v4 as uuidv4 } from 'uuid';

export const metadataFileName = 'metadata.json';

export enum StorageBackend {
    IPFS = 0,
}

export class SiteManagerConfig {
    // onchain storage configuration
    storageBackend: StorageBackend

    // saves 
    storageBaseDir: string

    // userId identifies owner of this site manager
    userId: string

    // dataDir saves data before uploading to storageBackend,
    // and all contents in this directory will be uploaded recursivly
    dataDir: string
}

export class UserMetadata {
    userId: string

    createdAt: number
    updatedAt: number
}

export class SiteMetadata {
    siteId: string;
    name: string;
    description: string;
    medias?: Record<string, SiteMediaMetadata>;
    sorted_media_ids?: Array<string> // Save medias id by insert order

    createdAt: number;
    updatedAt: number;

    constructor(name: string, description: string) {
        this.siteId = uuidv4();
        this.name = name;
        this.description = description;
        this.createdAt = Date.now();
        this.updatedAt = Date.now();
    }

    // Includes post tasks for loading data from JSON string
    postTasksAfterJsonParse() {
        this.sorted_media_ids = Object.keys(this.medias);
    }

    upinsertMedia(mediaMetadata: SiteMediaMetadata) {
        if (this.medias === undefined) {
            this.medias = {};
            this.sorted_media_ids = [];
        }
        this.medias[mediaMetadata.mediaId] = mediaMetadata;
        this.sorted_media_ids.push(mediaMetadata.mediaId);
    };

    async saveToDisk(siteDir: string, override: boolean) {
        const filePath = await join(siteDir, metadataFileName)
        if (override || !exists(filePath)) {
            await writeTextFile(filePath, JSON.stringify(this));
        } else {
            console.error("site metadata file existing and override option is false");
        }
    }

    getPagedMedias(pageCnt: number, pageSize: number) {
        const lIndex = pageSize * (pageCnt - 1);
        console.log(this.sorted_media_ids);

        if (pageCnt < 0 || lIndex > this.sorted_media_ids.length) {
            return {}
        }
        const rIndex = pageSize * pageCnt;
        const seletedMediaIds = this.sorted_media_ids.slice(lIndex, rIndex);

        var rslt = {}
        for (const mediaId of seletedMediaIds) {
            rslt[mediaId] = this.medias[mediaId];
        }

        return rslt;
    }
}

export async function loadSiteMetadataFile(filePath: string): Promise<SiteMetadata> {
    const content = await readTextFile(filePath);
    const siteMetadata = Object.assign(new SiteMetadata("", ""), JSON.parse(content) as SiteMetadata);
    if (siteMetadata.medias === undefined) {
        siteMetadata.medias = {};
    }
    siteMetadata.postTasksAfterJsonParse();
    console.log(siteMetadata);
    return siteMetadata;
}

export class SiteMediaMetadata {
    mediaId: string
    title: string
    cover: string
    description: string
    tags: [string]
    entryUrl: string
    rawMediaUrl: string

    createdAt: number
    updatedAt: number
}


// Request models
export class UploadMediaRequest {
    siteId: string
    title: string
    cover: string
    description: string
    tags?: [string]

    // tmpMediaPath saves temp path for media after uploaded by user
    tmpMediaPath: string
}
