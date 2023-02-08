import {existsSync} from 'node:fs';
import {writeFile} from 'fs/promises';
import {createFFmpeg, fetchFile} from '@ffmpeg/ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import {IPFSHTTPClient, create} from 'ipfs-http-client';
import {v4 as uuidv4} from 'uuid';

import {
    SiteManagerConfig,
    SiteMediaMetadata,
    SiteMetadata,
    StorageBackend,
    UploadMediaRequest,
    UserMetadata
} from './models';
import {SiteManagerInterface} from "./interface";


const DefaultSiteConfig: SiteManagerConfig = {
    storageBackend: StorageBackend.IPFS,
    storageNodeURL: "http://127.0.0.1:5001",
    userId: "",
    dataDir: "",
};

const ffmpeg = createFFmpeg({log: true});

export class SiteManagerIPFS implements SiteManagerInterface {
    config: SiteManagerConfig;
    ipfsClient: IPFSHTTPClient;

    dataDirHash: string;

    constructor(config?: SiteManagerConfig) {
        if (config !== null) {
            this.config = {...DefaultSiteConfig, ...config}
        } else {
            this.config = DefaultSiteConfig
        }

        console.log("merged config: ", this.config);

        // Create data dir if not existing
        if (!fs.existsSync(this.config.dataDir)) {
            fs.mkdirSync(this.config.dataDir);
        }
    }

    async init() {
        // Connect to IPFS node
        await this.initIpfsClient();

        // load ffmpeg
        await ffmpeg.load();

        console.log("init done")
    }

    async initIpfsClient() {
        console.warn("IPFS function is not ready yet, all changes will be saved in local dataDir")
        const url = new URL(this.config.storageNodeURL);
        this.ipfsClient = await create({
            host: url.host, port: parseInt(url.port), protocol: url.protocol
        });
    }

    getUserMetadata: (userId: string) => Promise<UserMetadata>;

    async createSite(siteName: string, description: string) {
        const siteMetadata: SiteMetadata = {
            siteId: uuidv4(),
            name: siteName,
            description: description,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        // Create a sub directory under data dir
        const siteDir = path.resolve(path.join(this.config.dataDir, siteMetadata.siteId));
        if (!existsSync(siteDir)) {
            fs.mkdirSync(siteDir);
        } else {
            console.error("Got same UUID, hmm.....");
        }

        await this.saveSiteMetadata(siteMetadata, false);

        // TODO: confirm whether publishing is required here

        return siteMetadata;
    }

    async updateSite(siteMetadata: SiteMetadata) {
        await this.saveSiteMetadata(siteMetadata, true);
        await this.updateStorage();
    };

    async deleteSite(siteId: string) {
        const siteMediaDir = this.getSiteDirViaSiteId(siteId);
        if (!siteMediaDir.includes(this.config.dataDir)) {
            console.error(`directory to be removed (${siteMediaDir}) seems not under dataDir (${this.config.dataDir}), please double check the code`);
        } else {
            fs.rmSync(siteMediaDir, {recursive: true, force: true});
        }
        await this.updateStorage();
    };

    async getSite(siteId: string) {
        const siteMetafilePath = this.getSiteMetaFilePathViaSiteId(siteId);
        let siteMetadata = fs.readFileSync(siteMetafilePath);
        await this.updateStorage();
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

        const siteDir = this.getSiteDirViaSiteId(reqData.siteId);
        const outputDir = path.join(siteDir, mediaMetadata.mediaId);
        fs.mkdirSync(outputDir);
        await this.generateHlsContent(reqData.tmpMediaPath, outputDir);
        await this.updateStorage();
        return mediaMetadata;
    };

    viewMedia: (mediaId: string) => Promise<SiteMediaMetadata>;

    ///////////////////////////
    // utils methods
    ///////////////////////////
    async saveSiteMetadata(siteMetadata: SiteMetadata, override: boolean) {
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

        await this.updateStorage();
    }

    // updateStorage update changes to IPFS storage
    // TODO: Save data dir hash into dataDirHash variable
    async updateStorage() {
        await this.ipfsClient.addAll(this.config.dataDir)
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

    // TODO: Move this function to separated media processing module
    async generateHlsContent(srcMediaPath: string, outputDir: string) {
        // Save media file from src media path to ffmpeg.wasm FS.
        // generate uuid for saving file under processing to avoid overriding
        const baseDir = uuidv4();
        const tmpFileName = path.join(baseDir, path.basename(srcMediaPath));
        const wasmFsOutputPath = path.join(baseDir, "output");
        ffmpeg.FS("mkdir", baseDir);
        ffmpeg.FS("mkdir", wasmFsOutputPath);
        ffmpeg.FS("writeFile", tmpFileName, await fetchFile(srcMediaPath));
        await ffmpeg.run(
            "-i",
            tmpFileName,
            "-hls_time",
            '30',
            '-hls_list_size',
            '0',
            path.join(wasmFsOutputPath, 'index.m3u8'),
        );

        console.log(`Try to getting data form ${wasmFsOutputPath}`);
        for (const f of ffmpeg.FS('readdir', wasmFsOutputPath)) {
            if (f === '.' || f === '..') {
                continue;
            }
            console.log(`file info: ${f}`)
            fs.writeFileSync(path.join(outputDir, f), ffmpeg.FS('readFile', path.join(wasmFsOutputPath, f)));
        }
    }
}
