import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

import * as path from 'path';
import { globSource, create } from 'ipfs-core';
import { v4 as uuidv4 } from 'uuid';

import {
    SiteManagerConfig,
    SiteMediaMetadata,
    SiteMetadata,
    StorageBackend,
    UploadMediaRequest,
    UserMetadata
} from './models';
import { SiteManagerInterface } from "./interface";
import { fs } from '@tauri-apps/api';


const DefaultSiteConfig: SiteManagerConfig = {
    storageBackend: StorageBackend.IPFS,
    storageBaseDir: '',
    userId: "",
    dataDir: "",
};

const ffmpeg = createFFmpeg({ log: true });

const mediaEntryFileName = 'index.m3u8'
const metadataFileName = 'metadata.json'

type AddDirectoryOptions = {
    updateAll?: boolean,
    siteId?: string,
}

export class SiteManagerIPFS implements SiteManagerInterface {
    config: SiteManagerConfig;
    ipfsClient: any;

    dataDirHash: string;

    // Mapping between site id and pubkey
    siteIdPubkeyMapping: {};

    constructor(config?: SiteManagerConfig) {
        if (config !== null) {
            this.config = { ...DefaultSiteConfig, ...config }
        } else {
            this.config = DefaultSiteConfig
        }

        console.log("merged config: ", this.config);

        // Create data dir if not existing
        if (!existsSync(this.config.dataDir)) {
            mkdirSync(this.config.dataDir);
        }

        this.siteIdPubkeyMapping = {};
    }

    async init() {
        await ffmpeg.load();

        // Connect to IPFS node
        await this.initIpfsClient();

        // TODO: Load existing sites

        // load ffmpeg
        // Note: after loading ffmpeg, all error messages will be print by fferr and the real calltrace will be hidden
        // await ffmpeg.load();

        console.log("init done")
    }

    async initIpfsClient() {
        const createOptions = {
            repo: this.config.storageBaseDir
        };

        this.ipfsClient = await create(createOptions);

        let serverConfig = await this.ipfsClient.config.getAll();
        let keysList = await this.ipfsClient.key.list();

        console.log(`IPFS client config:`, serverConfig);
        console.log(`keys list:`, keysList);
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

        // Create a sub directory under data dir for saving data in sites
        const siteDir = path.resolve(path.join(this.config.dataDir, siteMetadata.siteId));
        if (!existsSync(siteDir)) {
            mkdirSync(siteDir);
        } else {
            console.error("Got same UUID, hmm.....");
        }

        // Generate new pub key for the site w/ siteId as the key name,
        // then export the pem to site directory
        let siteKey = await this.ipfsClient.key.gen(siteMetadata.siteId, { type: 'ed25519' });
        let siteKeyPem = await this.ipfsClient.key.export('self', 'password');
        let siteKeyFile = path.join(siteDir, "sitekey.pem");
        writeFileSync(siteKeyFile, JSON.stringify(siteKeyPem));

        console.log(`Generated new key for site: ${siteMetadata.siteId}, key: ${JSON.stringify(siteKey)}, and the pem file is saved at ${siteKeyFile}`);

        await this.updateSite(siteMetadata);

        // TODO: confirm whether publishing is required here

        return siteMetadata;
    }

    async updateSite(siteMetadata: SiteMetadata) {
        await this.saveSiteMetadata(siteMetadata, true);
        await this.updateSiteToStorage(siteMetadata.siteId);
    };

    // NOT_TESTED
    // TODO: How to delete file on ipfs? file.rm?
    async deleteSite(siteId: string) {
        const siteMediaDir = this.getSiteDirViaSiteId(siteId);
        if (!siteMediaDir.includes(this.config.dataDir)) {
            console.error(`directory to be removed (${siteMediaDir}) seems not under dataDir (${this.config.dataDir}), please double check the code`);
        } else {
            rmSync(siteMediaDir, { recursive: true, force: true });
        }
        await this.updateAllToStorage();
    };

    async getSite(siteId: string) {
        const siteMetafilePath = this.getSiteMetaFilePathViaSiteId(siteId);
        let siteMetadata = readFileSync(siteMetafilePath);
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
        mkdirSync(outputDir);
        await this.generateHlsContent(reqData.tmpMediaPath, outputDir);
        await this.updateSiteToStorage(reqData.siteId);
        mediaMetadata.entryUrl = path.join(mediaMetadata.mediaId, mediaEntryFileName);
        await this.saveMediaMetadata(reqData.siteId, mediaMetadata);
        return mediaMetadata;
    };

    async getMediaMetadata(siteId: string, mediaId: string) {
        const mediaMetadataFilePath = path.join(
            this.getSiteDirViaSiteId(siteId),
            mediaId,
            metadataFileName
        );
        let mediaMetadataContent = readFileSync(mediaMetadataFilePath);
        const mediaMetadata: SiteMediaMetadata = JSON.parse(mediaMetadataContent.toString());
        return mediaMetadata;
    }

    ///////////////////////////
    // utils methods
    ///////////////////////////

    ////////////////////////////////////////////////
    // local site directory related functions
    ////////////////////////////////////////////////

    async saveSiteMetadata(siteMetadata: SiteMetadata, override: boolean) {
        this.saveMetadata(JSON.stringify(siteMetadata), this.getSiteDir(siteMetadata), override);
        await this.updateSiteToStorage(siteMetadata.siteId);
    }

    async saveMediaMetadata(siteId: string, mediaMetadata: SiteMediaMetadata) {
        const metadataDir = path.join(this.getSiteDirViaSiteId(siteId), mediaMetadata.mediaId);
        console.log(`save media metadata to ${metadataDir}`);
        
        this.saveMetadata(JSON.stringify(mediaMetadata), metadataDir, true);
        await this.updateSiteToStorage(siteId);
    }

    // save metadata to directory, create a separated function to handle site and media cases
    saveMetadata(metadataContent: string, directory: string, override: boolean) {
        const metadataFilePath = path.join(directory, metadataFileName);

        if (!existsSync(metadataFilePath)) {
            console.log(`save metadata to ${metadataFilePath}`);
            writeFileSync(metadataFilePath, metadataContent);
        } else {
            if (override) {
                console.log(`overrite metadata file ${metadataFilePath}`);
                writeFileSync(metadataFilePath, metadataContent);
            } else {
                console.error("site metadata file existing and override option is false");
            }
        }
    }

    getSiteDirViaSiteId(siteId: string): string {
        return path.resolve(path.join(this.config.dataDir, siteId));
    }

    getSiteDir(siteMetadata: SiteMetadata): string {
        return this.getSiteDirViaSiteId(siteMetadata.siteId);
    }

    getSiteMetaFilePath(siteMetadata: SiteMetadata): string {
        const siteDir = this.getSiteDir(siteMetadata);
        return path.resolve(path.join(siteDir, mediaEntryFileName));
    }

    getSiteMetaFilePathViaSiteId(siteId: string): string {
        const siteDir = this.getSiteDirViaSiteId(siteId);
        return path.resolve(path.join(siteDir, metadataFileName));
    }

    ////////////////////////////////////////////////
    // ffmpeg related functions
    ////////////////////////////////////////////////

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
            path.join(wasmFsOutputPath, mediaEntryFileName),
        );

        console.log(`Try to getting data form ${wasmFsOutputPath}`);
        for (const f of ffmpeg.FS('readdir', wasmFsOutputPath)) {
            if (f === '.' || f === '..') {
                continue;
            }
            console.log(`file info: ${f}`)
            writeFileSync(path.join(outputDir, f), ffmpeg.FS('readFile', path.join(wasmFsOutputPath, f)));
        }
    }

    ////////////////////////////////////////////////
    // IPFS related functions
    ////////////////////////////////////////////////

    // updateAllToStorage update all sites to IPFS storage.
    // TODO: Save data dir hash into dataDirHash variable
    async updateAllToStorage() {
        console.log(`prepare to update all storage from ${this.config.dataDir}`)
        await this.addDirectoryToStorage(this.config.dataDir, { updateAll: true });
    }

    // updateSiteToStorage update specified site to IPFS storage.
    async updateSiteToStorage(siteId: string) {
        console.log(`prepare to update site storage of ${siteId}`)
        await this.addDirectoryToStorage(
            path.join(this.config.dataDir, siteId),
            { updateAll: false, siteId: siteId }
        );
    }

    // addDirectoryToStorage execute the add action, and the data hash will be saved after adding done
    async addDirectoryToStorage(dirPath: string, options?: AddDirectoryOptions) {
        console.log(`prepare to update storage from ${dirPath}, update opts: `, JSON.stringify(options));
        const addOptions = {
            // TODO: Change to true in production env
            pin: false,
            wrapWithDirectory: true,
            timeout: 10000
        };

        let files = await globSource(dirPath, '**/*', null);
        console.log(files);

        for await (const addResult of this.ipfsClient.addAll(globSource(dirPath, '**/*', null), addOptions)) {
            const addedPath = addResult.path;
            console.log(addResult);
            if (options.updateAll === true) {
                // In full update mode, the addedPath has no slash '/' character is site directory, update the cid/siteId mapping
                if ((!addedPath.includes('/')) && (addedPath !== '')) {
                    this.siteIdPubkeyMapping[addedPath] = addResult.cid.toString();
                }
            } else {
                // In side update mode, the root path is ''
                if (addedPath === '') {
                    this.siteIdPubkeyMapping[options.siteId] = addResult.cid.toString();
                }
            }
        }

    }

    // publishChanges invoke ipfs.publish to refresh published content
    async publishChanges(siteId?: string) {
        console.log(`prepare to publish site`);
        let publishResult = await this.ipfsClient.name.publish("/ipfs/" + this.dataDirHash);
        console.log(`site publish result: ${JSON.stringify(publishResult)}`);
    }
}
