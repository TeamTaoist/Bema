import { copyFile, createDir, readDir, removeDir, readTextFile, writeTextFile, BaseDirectory, readBinaryFile } from '@tauri-apps/api/fs'

import { resolve, join, basename, appDataDir } from '@tauri-apps/api/path';
import { create, IPFSHTTPClient } from 'kubo-rpc-client'
import { createDirIfNotExisting, execSidecarCmd, spawnSidecarCmd } from '../utils'
import { v4 as uuidv4 } from 'uuid';



import {
    SiteManagerConfig,
    SiteMediaMetadata,
    SiteMetadata,
    StorageBackend,
    UploadMediaRequest,
    UserMetadata,
    metadataFileName,
    loadSiteMetadataFile
} from './models';
import { SiteManagerInterface } from "./interface";

const IPFS_BINARY = 'binaries/ipfs';
const IPFS_PROXY_BINARY = 'binaries/ipfs_proxy';
const FFMPEG_BINARY = 'binaries/ffmpeg';
const IPFS_PROXY_SRV_ADDR = "http://127.0.0.1:12345"

const DefaultSiteConfig: SiteManagerConfig = {
    storageBackend: StorageBackend.IPFS,
    storageBaseDir: '',
    userId: "",
    dataDir: "",
};


const mediaEntryFileName = 'index.m3u8'

// max retry time for connecting IPFS daemon
const maxConnenctIpfsRetry = 3;

type AddDirectoryOptions = {
    updateAll?: boolean,
    siteId?: string,
}

export class SiteManagerIPFS implements SiteManagerInterface {
    config: SiteManagerConfig;
    ipfsClient: IPFSHTTPClient;

    appDataDirPath: string;
    storageRepoPath: string;
    sitesBaseDir: string;

    // Mapping between site id and pubkey
    siteIdDataHashMapping: {};

    constructor(config?: SiteManagerConfig) {
        if (config !== null) {
            this.config = { ...DefaultSiteConfig, ...config }
        } else {
            this.config = DefaultSiteConfig
        }

        this.siteIdDataHashMapping = {};
    }

    async init() {
        this.appDataDirPath = await appDataDir();

        this.config.dataDir = "sites";
        this.config.storageBaseDir = "ipfsrepo";

        await createDirIfNotExisting(this.config.dataDir);
        await createDirIfNotExisting(this.config.storageBaseDir);

        this.storageRepoPath = await join(this.appDataDirPath, this.config.storageBaseDir)
        this.sitesBaseDir = await join(this.appDataDirPath, this.config.dataDir)

        console.log("config paths: ", this.config);

        await spawnSidecarCmd(IPFS_PROXY_BINARY, [
            "--sites-base",
            this.sitesBaseDir,
        ]);

        // Inif IPFS node, which is a kubo binary started in sidecar mode
        await this.initIpfsNode();

        await this.initIpfsClient();

        // TODO: Load existing sites

        console.log(`init done, appDataDir: ${this.appDataDirPath}`);
    }

    // initIpfsNode starts an IPFS node in specified directory, then enable CORS for request with vita origin
    async initIpfsNode() {
        console.log(Date.now(), " init ipfs repo...");
        await execSidecarCmd(IPFS_BINARY, ["--repo-dir", this.storageRepoPath, "init"]);
        console.log(Date.now(), " init ipfs repo done");

        // TODO: Verify whether the 1420 is the origin in all requests
        const corsAllowOriginArgs = [
            "--repo-dir",
            this.storageRepoPath,
            "config",
            "--json",
            "API.HTTPHeaders.Access-Control-Allow-Origin",
            "[\"http://localhost:1420\", \"http://127.0.0.1:1420\"]",
        ];
        console.log(Date.now(), " setup allowed origin...");
        await execSidecarCmd(IPFS_BINARY, corsAllowOriginArgs);
        console.log(Date.now(), " setup allowed origin done");

        const corsAllowMethodsArgs = [
            "--repo-dir",
            this.storageRepoPath,
            "config",
            "--json",
            "API.HTTPHeaders.Access-Control-Allow-Methods",
            "[\"*\"]",
        ];
        console.log(Date.now(), " setup allowed methods...");
        await execSidecarCmd(IPFS_BINARY, corsAllowMethodsArgs);
        console.log(Date.now(), " setup allowed methods done");

        console.log(Date.now(), " starting ipfs daemon...");
        await spawnSidecarCmd(IPFS_BINARY, ["--repo-dir", this.storageRepoPath, "daemon"]);
    }

    async initIpfsClient() {
        for (let i = 0; i < maxConnenctIpfsRetry; i++) {
            console.log(`trying to connect to IPFS, retry time: ${i}`)
            // TODO: Verify whether the node is available on 5001, and how to change it in cofiguration
            const createOptions = {
                url: IPFS_PROXY_SRV_ADDR + "/api/v0"
            };
            this.ipfsClient = create(createOptions);

            if (this.ipfsClient !== undefined) {
                break;
            }
        }
    }

    getUserMetadata: (userId: string) => Promise<UserMetadata>;

    async listSites(): Promise<SiteMetadata[]> {
        const entries = await readDir(this.sitesBaseDir, { dir: BaseDirectory.AppData, recursive: true });
        var rslt = []

        for (const entry of entries) {
            const relativePath = entry.path.replace(this.sitesBaseDir, '');
            if (entry.children) {
                rslt.push(await this.getSite(entry.name));
            } else {
                // TODO: There should not a single file under sitesBaseDir, think about raise error
            }
        }

        return rslt;
    }

    async createSite(siteName: string, description: string): Promise<SiteMetadata> {
        const siteMetadata = new SiteMetadata(siteName, description);
        // Create a sub directory under data dir
        const siteDir = await resolve(await join(this.sitesBaseDir, siteMetadata.siteId));
        console.log(`new site dir: ${siteDir}`);

        await createDirIfNotExisting(siteDir);

        // Generate new pub key for the site w/ siteId as the key name,
        // then export the pem to site directory
        let siteKey = await this.ipfsClient.key.gen(siteMetadata.siteId, { type: 'ed25519' });
        console.log(`site key resp: `, siteKey);

        // Backup site key
        const siteKeyPath = await join(siteDir, "sitekey.pem");
        console.log(Date.now(), " prepare to backup site key to ", siteKeyPath);
        await execSidecarCmd(IPFS_BINARY, [
            "--repo-dir",
            this.storageRepoPath,
            "key",
            "export",
            siteMetadata.siteId,
            "--output=" + siteKeyPath
        ]);
        console.log(Date.now(), " backup site key finished");


        // TODO: implement key export function
        // new key is saved in <ipfsrepo>/keystore, just need to copy it out.
        // The key file name is base32 (RFC4648) encoded key name
        // let siteKeyPem = await this.ipfsClient.key.export('self', 'password');
        // let siteKeyFile = await join(siteDir, "sitekey.pem");
        // writeTextFile(siteKeyFile, JSON.stringify(siteKeyPem));

        // console.log(`Generated new key for site: ${siteMetadata.siteId}, key: ${JSON.stringify(siteKey)}, and the pem file is saved at ${siteKeyFile}`);

        await this.updateSite(siteMetadata);

        // TODO: confirm whether publishing is required here

        return siteMetadata;
    }

    async updateSite(siteMetadata: SiteMetadata) {
        console.log("save site metadata: ", siteMetadata);
        await this.saveSiteMetadata(siteMetadata, true);
        console.log("update site to storage");
        await this.updateSiteToStorage(siteMetadata.siteId);
        console.log("update done");
    };

    // NOT_TESTED
    // TODO: How to delete file on ipfs? file.rm?
    async deleteSite(siteId: string) {
        const siteMediaDir = await this.getSiteDirViaSiteId(siteId);
        if (!siteMediaDir.includes(this.sitesBaseDir)) {
            console.error(`directory to be removed (${siteMediaDir}) seems not under dataDir (${this.sitesBaseDir}), please double check the code`);
        } else {
            removeDir(siteMediaDir, { dir: BaseDirectory.AppData, recursive: true });
        }
        await this.updateAllToStorage();
    };

    async getSite(siteId: string) {
        const siteMetafilePath = await this.getSiteMetaFilePathViaSiteId(siteId);
        return await loadSiteMetadataFile(siteMetafilePath);
    }

    async uploadMedia(reqData: UploadMediaRequest) {
        let mediaMetadata: SiteMediaMetadata = {
            mediaId: uuidv4(),
            title: reqData.title,
            description: reqData.description,
            tags: reqData.tags,

            // cover and entryUrl will be set later
            cover: "",
            entryUrl: "",
            rawMediaUrl: "",

            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        const siteDir = await this.getSiteDirViaSiteId(reqData.siteId);
        console.log("site dir: ", siteDir);

        // outputDir saves media processed to segments and entry file
        const outputDir = await join(siteDir, mediaMetadata.mediaId);
        console.log("Prepare to create directory: ", outputDir);
        createDir(outputDir, { dir: BaseDirectory.AppData, recursive: true });

        // Copy cover image to mediaDir
        console.log('reqData: ', reqData)
        const coverBasename = await basename(reqData.cover);
        const mediaCoverPath = await join(outputDir, coverBasename)
        await copyFile(reqData.cover, mediaCoverPath, { dir: BaseDirectory.AppData });
        mediaMetadata.cover = await join(mediaMetadata.mediaId, coverBasename);

        // mediaPath is the abs path for uploaded media,
        // if given path is absolute path (starts with /), then the path will be directly passed to ffmpeg
        // Or the path will be connected after AppDataDirPath
        var mediaPath: string;
        if (reqData.tmpMediaPath.startsWith('/')) {
            mediaPath = reqData.tmpMediaPath;
        } else {
            mediaPath = await join(this.appDataDirPath, reqData.tmpMediaPath);
        }
        // Generate HLS segments of media
        // TODO: need to remove original media?
        await this.generateHlsContent(mediaPath, outputDir, reqData.siteId, mediaMetadata.mediaId);

        // Copy raw media to media directory to support browser not support HLS
        const mediaFileName = await basename(mediaPath);
        const mediaPathSavedToMediaDir = await join(siteDir, mediaMetadata.mediaId, mediaFileName);
        await copyFile(mediaPath, mediaPathSavedToMediaDir, { dir: BaseDirectory.AppData });

        // Update site to storage
        await this.updateSiteToStorage(reqData.siteId);
        mediaMetadata.entryUrl = await join(mediaMetadata.mediaId, mediaEntryFileName);
        mediaMetadata.rawMediaUrl = await join(mediaMetadata.mediaId, mediaFileName);
        const mediaMetadataPath = await join(outputDir, metadataFileName);
        console.log(`media metadata file path: `, mediaMetadataPath);
        await writeTextFile(mediaMetadataPath, JSON.stringify(mediaMetadata))

        const siteMetadata: SiteMetadata = await this.getSite(reqData.siteId) as SiteMetadata;
        siteMetadata.upinsertMedia(mediaMetadata);
        await siteMetadata.saveToDisk(siteDir, true);

        return mediaMetadata;
    };

    async getMediaMetadata(siteId: string, mediaId: string) {
        const mediaMetadataFilePath = await join(
            await this.getSiteDirViaSiteId(siteId),
            mediaId,
            metadataFileName
        );
        let mediaMetadataContent = await readTextFile(mediaMetadataFilePath);
        const mediaMetadata: SiteMediaMetadata = JSON.parse(mediaMetadataContent.toString()) as SiteMediaMetadata;
        return mediaMetadata;
    }

    ///////////////////////////
    // utils methods
    ///////////////////////////

    ////////////////////////////////////////////////
    // local site directory related functions
    ////////////////////////////////////////////////

    async saveSiteMetadata(siteMetadata: SiteMetadata, override: boolean) {
        const siteBaseDir = await this.getSiteDir(siteMetadata);
        await siteMetadata.saveToDisk(siteBaseDir, override);
    }

    async getSiteDirViaSiteId(siteId: string): Promise<string> {
        return await resolve(await join(this.sitesBaseDir, siteId));
    }

    async getSiteDir(siteMetadata: SiteMetadata): Promise<string> {
        return await this.getSiteDirViaSiteId(siteMetadata.siteId);
    }

    async getSiteMetaFilePath(siteMetadata: SiteMetadata): Promise<string> {
        const siteDir = await this.getSiteDir(siteMetadata);
        return await resolve(await join(siteDir, "metadata.json"));
    }

    async getSiteMetaFilePathViaSiteId(siteId: string): Promise<string> {
        const siteDir = await this.getSiteDirViaSiteId(siteId);
        return await resolve(await join(siteDir, "metadata.json"));
    }

    ////////////////////////////////////////////////
    // ffmpeg related functions
    ////////////////////////////////////////////////

    // TODO: Move this function to separated media processing module
    async generateHlsContent(srcMediaPath: string, outputDir: string, siteId: string, mediaId: string) {
        const indexPath = await join(outputDir, mediaEntryFileName);
        console.log(this.appDataDirPath)
        const ffmpegParams = [
            "-i",
            srcMediaPath,
            "-hls_time",
            '30',
            '-hls_list_size',
            '0',
            '-hls_base_url',
            `/${siteId}/${mediaId}/`,
            indexPath,
        ];
        console.log(ffmpegParams);

        await execSidecarCmd(FFMPEG_BINARY, ffmpegParams)
    }

    ////////////////////////////////////////////////
    // IPFS related functions
    ////////////////////////////////////////////////

    // updateAllToStorage update all sites to IPFS storage.
    async updateAllToStorage() {
        console.log(`prepare to update all storage from ${this.sitesBaseDir}`)
        await this.addDirectoryToStorage(this.sitesBaseDir, { updateAll: true });
    }

    // updateSiteToStorage update specified site to IPFS storage.
    async updateSiteToStorage(siteId: string) {
        console.log(`prepare to update site storage of ${siteId}`)
        await this.addDirectoryToStorage(await join(this.sitesBaseDir, siteId), { updateAll: false, siteId: siteId });
    }

    // addDirectoryToStorage execute the add action, and the data hash will be saved after adding done
    async addDirectoryToStorage(dirPath: string, options?: AddDirectoryOptions) {
        console.log(`prepare to update storage from ${dirPath}, update opts: `, options);
        const addOptions = {
            // TODO: Change to true in production env
            pin: false,
            wrapWithDirectory: true,
            timeout: 10000
        };

        console.log("add opts: ", addOptions);
        console.log("dirpath: ", dirPath);
        let files = await this.getAllEntriesUnderDirectory(dirPath);
        console.log(`files under dir ${dirPath}: `, files);

        for await (const addResult of this.ipfsClient.addAll(files, addOptions)) {
            const addedPath = addResult.path;
            console.log(addedPath, addResult);
            if (options.updateAll === true) {
                // In full update mode, the addedPath has no slash '/' character is site directory, update the cid/siteId mapping
                if ((!addedPath.includes('/')) && (addedPath !== '')) {
                    this.siteIdDataHashMapping[addedPath] = addResult.cid.toString();
                }
            } else {
                // In side update mode, the root path is ''
                if (addedPath === '') {
                    this.siteIdDataHashMapping[options.siteId] = addResult.cid.toString();
                }
            }
        }

        console.log(`site id and hash mapping: `, this.siteIdDataHashMapping);
    }

    async getAllEntriesUnderDirectory(dirPath: string) {
        const entries = await readDir(dirPath, { dir: BaseDirectory.AppData, recursive: true });
        let rslt = [];

        for (const entry of entries) {
            const relativePath = entry.path.replace(this.sitesBaseDir, '');
            if (entry.children) {
                // For directories, the content should be empty string
                rslt.push({
                    'path': relativePath,
                    'content': '',
                });
                rslt = rslt.concat(await this.getAllEntriesUnderDirectory(entry.path))
            } else {
                rslt.push({
                    'path': relativePath,
                    'content': await readBinaryFile(entry.path),
                });
            }
        }

        console.log("rslt: ", rslt);
        return rslt
    }


    async publishSite(siteId: string) {
        const siteHash = this.siteIdDataHashMapping[siteId];
        if (siteHash !== null) {
            console.log(`prepare to publish site ${siteId}, hash: ${siteHash}`);
            let publishResult = await this.ipfsClient.name.publish("/ipfs/" + this.siteIdDataHashMapping[siteId], { key: siteId });
            console.log(`site publish result: `, publishResult);
        } else {
            console.error(`site ${siteId} has no dataHash saved, upload it to IPFS first`);
        }
    }

    getMediaCover(siteId: string, mediaMetadata: SiteMediaMetadata): string {
        return `${IPFS_PROXY_SRV_ADDR}/${siteId}/${mediaMetadata.cover}`;
    }

    getMediaEntryUrl(siteId: string, mediaMetadata: SiteMediaMetadata): string {
        return `${IPFS_PROXY_SRV_ADDR}/${siteId}/${mediaMetadata.entryUrl}`;
    }
}
