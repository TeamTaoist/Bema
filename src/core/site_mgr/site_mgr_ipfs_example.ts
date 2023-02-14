// Init IPFS client

// Example script for testing functions,
// usage for now: tsx src/core/site_mgr/site_mgr_ipfs_example.ts <media path>

import {SiteManagerIPFS} from "./site_mgr_ipfs";
import {SiteManagerConfig, UploadMediaRequest} from "./models";
import {readdir} from '@tauri-apps/api/fs'
import {join} from 'node:path'


let siteConfig = new SiteManagerConfig()
siteConfig.dataDir = "./tmpdata";
let siteMgr: SiteManagerIPFS = new SiteManagerIPFS(siteConfig);

(async () => {
    await siteMgr.init();
    let siteMetadata = await siteMgr.createSite("testSite", "this is a test site");
    console.log(`create site rslt: ${JSON.stringify(siteMetadata)}`);
    
    let newMediaReq: UploadMediaRequest = {
        siteId: siteMetadata.siteId,
        title: "A test media",
        description: "media for testing creation of site",
        tags: ['test'],
        tmpMediaPath: process.argv[2],
    }
    let mediaMetadata = await siteMgr.uploadMedia(newMediaReq)
    console.log(`Media uploaded done, metadata: ${JSON.stringify(mediaMetadata)}`)

    await siteMgr.updateStorage();
    await siteMgr.publishChanges();
})()
