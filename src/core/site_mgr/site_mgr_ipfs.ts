import { exists, createDir, readDir, removeDir, readTextFile, writeTextFile, writeBinaryFile, BaseDirectory, readBinaryFile } from '@tauri-apps/api/fs'

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
    UserMetadata
} from './models';
import { SiteManagerInterface } from "./interface";

const IPFS_BINARY = 'binaries/ipfs';
const IPFS_PROXY_BINARY = 'binaries/ipfs_proxy';
const FFMPEG_BINARY = 'binaries/ffmpeg';

const DefaultSiteConfig: SiteManagerConfig = {
    storageBackend: StorageBackend.IPFS,
    storageBaseDir: '',
    userId: "",
    dataDir: "",
};


const mediaEntryFileName = 'index.m3u8'
const metadataFileName = 'metadata.json'

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

        await spawnSidecarCmd(IPFS_PROXY_BINARY, []);

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
                url: "http://127.0.0.1:12345/api/v0"
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
                rslt.push(JSON.parse(await readTextFile(await join(entry.path, metadataFileName))));
            } else {
                // TODO: There should not a single file under sitesBaseDir, think about raise error
            }
        }

        return rslt;
    }

    async createSite(siteName: string, description: string): Promise<SiteMetadata> {
        const siteMetadata: SiteMetadata = {
            siteId: uuidv4(),
            name: siteName,
            description: description,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        // Create a sub directory under data dir
        const siteDir = await resolve(await join(this.sitesBaseDir, siteMetadata.siteId));
        console.log(`new site dir: ${siteDir}`);

        await createDirIfNotExisting(siteDir);

        // Generate new pub key for the site w/ siteId as the key name,
        // then export the pem to site directory
        let siteKey = await this.ipfsClient.key.gen(siteMetadata.siteId, { type: 'ed25519' });
        console.log(`site key resp: `, siteKey);

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
        let siteMetadata = await readTextFile(siteMetafilePath);
        return JSON.parse(siteMetadata);
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

        const siteDir = await this.getSiteDirViaSiteId(reqData.siteId);
        const outputDir = await join(siteDir, mediaMetadata.mediaId);
        console.log("Prepare to create directory: ", outputDir);
        createDir(outputDir, { dir: BaseDirectory.AppData, recursive: true });

        const mediaPath = await join(this.appDataDirPath, reqData.tmpMediaPath);
        await this.generateHlsContent(mediaPath, outputDir);
        await this.updateSiteToStorage(reqData.siteId);
        mediaMetadata.entryUrl = await join(outputDir, mediaEntryFileName);
        const mediaMetadataPath = await join(outputDir, metadataFileName);
        console.log(`media metadata file path: `, mediaMetadataPath);
        await writeTextFile(mediaMetadataPath, JSON.stringify(mediaMetadata))
        return mediaMetadata;
    };

    async getMediaMetadata(siteId: string, mediaId: string) {
        const mediaMetadataFilePath = await join(
            await this.getSiteDirViaSiteId(siteId),
            mediaId,
            metadataFileName
        );
        let mediaMetadataContent = await readTextFile(mediaMetadataFilePath);
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
        const siteMetadataFilePath = await this.getSiteMetaFilePath(siteMetadata);

        if (!exists(siteMetadataFilePath, { dir: BaseDirectory.AppData, })) {
            console.log(`save site metadata to ${siteMetadataFilePath}`);
            writeTextFile(siteMetadataFilePath, JSON.stringify(siteMetadata));
        } else {
            if (override) {
                console.log(`overrite site metadata file ${siteMetadataFilePath}`);
                writeTextFile(siteMetadataFilePath, JSON.stringify(siteMetadata));
            } else {
                console.error("site metadata file existing and override option is false");
            }
        }
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
    async generateHlsContent(srcMediaPath: string, outputDir: string) {
        const indexPath = await join(outputDir, mediaEntryFileName);
        console.log(this.appDataDirPath)
        const ffmpegParams = [
            "-i",
            srcMediaPath,
            "-hls_time",
            '30',
            '-hls_list_size',
            '0',
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
}
