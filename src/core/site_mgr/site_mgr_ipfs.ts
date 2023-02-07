import { existsSync } from 'node:fs';
import fs from 'fs';
import path from 'path';
import { create as IpfsHttpClient } from 'ipfs-http-client'
import { IPFSHTTPClient } from 'ipfs-http-client/dist/src/types';
import { v4 as uuidv4 } from 'uuid';
import { L } from '@tauri-apps/api/event-2a9960e7';
import { F } from '@tauri-apps/api/path-e12e0e34';


const DefaultSiteConfig: SiteManagetConfig = {
    storageBackend: StorageBackend.IPFS,
    storageNodeURL: "http://127.0.0.1:5001",
    userId: "",
    dataDir: "",
};

class SiteManagerIPFS implements SiteManagerInterface {
    config: SiteManagetConfig;
    ipfsClient: IPFSHTTPClient;

    dataDirHash: string;

    constructor(config?: SiteManagetConfig) {
        if (config !== null) {
            this.config = { ...DefaultSiteConfig, ...config }
        } else {
            this.config = DefaultSiteConfig
        }

        console.log("merged config: ", this.config);

        // Prepare data directory for the user

        // Connect to IPFS node
        () => {
            this.initIpfsClient()
        }
    }

    async initIpfsClient() {
        const url = new URL(this.config.storageNodeURL);
        this.ipfsClient = IpfsHttpClient({
            host: url.host, port: parseInt(url.port), protocol: url.protocol
        });
    }

    getUserMetadata: (userId: string) => Promise<UserMetadata>;

    async createSite(siteName: string, description: string) {
        var siteMetadata: SiteMetadata = {
            siteId: uuidv4(),
            name: siteName,
            description: description,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }
        // Create a sub directory under data dir
        const siteDir = path.resolve(path.join(this.config.dataDir, siteMetadata.siteId));
        if (!existsSync(siteDir)) {
            fs.mkdirSync(siteDir);
        } else {
            console.error("Got same UUID, hmm.....");
        }

        this.saveSiteMetadata(siteMetadata, false);
        this.updateStorage();

        // TODO: confirm whether publishcation is required here

        return siteMetadata;
    }

    async updateSite(siteMetadata: SiteMetadata) {
        this.saveSiteMetadata(siteMetadata, true);
        this.updateStorage();
    };

    async deleteSite(siteId: string) {
        const siteMediaDir = this.getSiteDirViaSiteId(siteId);
        if (!siteMediaDir.includes(this.config.dataDir)) {
            console.error(`directory to be removed (${siteMediaDir}) seems not under dataDir (${this.config.dataDir}), please double check the code`);
        } else {
            fs.rmSync(siteMediaDir, { recursive: true, force: true });
        }
        this.updateStorage();
    };

    async getSite(siteId: string) {
        const siteMetafilePath = this.getSiteMetaFilePathViaSiteId(siteId);
        let siteMetadata = fs.readFileSync(siteMetafilePath);
        this.updateStorage();
        return JSON.parse(siteMetadata.toString());
    }

    async uploadMedia(reqData: UploadMediaRequest) {
        let mediaMetadata: SiteMediaMetadata = {
            mediaId: uuidv4(),
            title: reqData.title,
            description: reqData.description,
            tags: reqData.tags,
            entryUrl: "",

            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        // Create media directory under site directory
        // Launching ffmpeg split media and save results to media directory

        this.updateStorage();
        return mediaMetadata;
    };

    viewMedia: (mediaId: string) => Promise<SiteMediaMetadata>;

    ///////////////////////////
    // utils methods
    ///////////////////////////
    saveSiteMetadata(siteMetadata: SiteMetadata, override: boolean) {
        const siteMetadataFilePath = this.getSiteMetaFilePath(siteMetadata);

        if (!existsSync(siteMetadataFilePath)) {
            console.log(`save site metadata to ${siteMetadataFilePath}`);
            fs.writeFileSync(siteMetadataFilePath, JSON.stringify(siteMetadata));
        } else {
            if (override) {
                console.log(`overrite site metadata file ${siteMetadataFilePath}`);
                fs.writeFileSync(siteMetadataFilePath, JSON.stringify(siteMetadata));
            } else {
                console.error("site metadata file existing and override option is false");
            }
        }

        this.updateStorage();
    }

    // updateStorage update changes to IPFS storage
    // TODO: Save data dir hash into dataDirHash variable
    updateStorage() {
        this.ipfsClient.addAll(this.config.dataDir)
    }

    // publishChanges invoke ipfs.publish to refresh published content
    publishChanges() {
        this.ipfsClient.name.publish("/ipfs/" + this.dataDirHash);
    }

    getSiteDirViaSiteId(siteId: string): string {
        return path.resolve(path.join(this.config.dataDir, siteId));
    }

    getSiteDir(siteMetadata: SiteMetadata): string {
        return this.getSiteDirViaSiteId(siteMetadata.siteId);
    }

    getSiteMetaFilePath(siteMetadata: SiteMetadata): string {
        const siteDir = this.getSiteDir(siteMetadata);
        return path.resolve(path.join(siteDir, "metadata.json"));
    }

    getSiteMetaFilePathViaSiteId(siteId: string): string {
        const siteDir = this.getSiteDirViaSiteId(siteId);
        return path.resolve(path.join(siteDir, "metadata.json"));
    }
}
