export enum StorageBackend {
    IPFS = 0,
}

export class SiteManagerConfig {
    // onchain storage configuration
    storageBackend: StorageBackend
    storageNodeURL: string

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
    siteId: string
    name: string
    description: string

    createdAt: number
    updatedAt: number
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
