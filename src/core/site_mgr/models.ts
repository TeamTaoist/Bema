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

    createdAt: number;
    updatedAt: number;

    constructor(name: string, description: string) {
        this.siteId = uuidv4();
        this.name = name;
        this.description = description;
        this.createdAt = Date.now();
        this.updatedAt = Date.now();
    }

    upinsertMedia(mediaMetadata: SiteMediaMetadata) {
        if (this.medias === undefined) {
            this.medias = {};
        }
        this.medias[mediaMetadata.mediaId] = mediaMetadata;
    };

    async saveToDisk(siteDir: string, override: boolean) {
        const filePath = await join(siteDir, metadataFileName)
        if (override || !exists(filePath)) {
            await writeTextFile(filePath, JSON.stringify(this));
        } else {
            console.error("site metadata file existing and override option is false");
        }
    }
}

export async function loadSiteMetadataFile(filePath: string): Promise<SiteMetadata> {
    const content = await readTextFile(filePath);
    const foobar = Object.assign(new SiteMetadata("", ""), JSON.parse(content) as SiteMetadata);
    console.log(foobar);
    return foobar;
}

export class SiteMediaMetadata {
    mediaId: string
    title: string
    description: string
    tags: [string]
    entryUrl: string

    createdAt: number
    updatedAt: number
}


// Request models
export class UploadMediaRequest {
    siteId: string
    title: string
    description: string
    tags: [string]

    // tmpMediaPath saves temp path for media after uploaded by user
    tmpMediaPath: string
}
