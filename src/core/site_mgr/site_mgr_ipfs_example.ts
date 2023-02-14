// Init IPFS client

// Example script for testing functions,
// usage for now: tsx src/core/site_mgr/site_mgr_ipfs_example.ts <media path>

import { SiteManagerIPFS } from "./site_mgr_ipfs";
import { SiteManagerConfig, UploadMediaRequest } from "./models";
import { SiteManagerInterface } from "./interface";

function createSiteManager(): SiteManagerIPFS {
    const siteConfig = new SiteManagerConfig()
    siteConfig.dataDir = "./tmpdata";
    siteConfig.storageBaseDir = process.env.IPFS_PATH;
    return new SiteManagerIPFS(siteConfig);
}

async function testCreateSite(siteMgr: SiteManagerInterface) {
    const siteMetadata = await siteMgr.createSite("testSite", "this is a test site");
    console.log(`create site rslt: `, siteMetadata);

    // Site created successfully, expections:
    // * [x] A separated directory with siteId as name should be saved in data dir
    // * [x] A metafile should be existing in the site directory, named `metadata.json`
    //   * [x] The metadata should contains fields defined in the SiteMetadata struct 
    //   * [x] The siteId value should be same with directory
    //   * [x] The name and desc values should be same with given value
    //   * [x] The createdAt and updatedAt fields should have same value and the value should be just moments before.
    // * [x] The site dir should contains pem file, which named `sitekey.pem`
    //   * [x] The pem file is ed25519 format
    //   * [x] The key should be included in IPFS system

    const newMediaReq: UploadMediaRequest = {
        siteId: siteMetadata.siteId,
        title: "A test media",
        description: "media for testing creation of site",
        tags: ['test'],
        tmpMediaPath: process.argv[2],
    }
    const mediaMetadata = await siteMgr.uploadMedia(newMediaReq)
    console.log(`Media uploaded done, metadata: `, mediaMetadata);

    // Media uploaded, expections:
    // * [x] A new directory with media ID should be existing in site directory
    // * [x] A metafile should be existing in the media directory, named `metadata.json`
    // * [x] the media directory should contains only m3u8 and ts files
    // * [x] the media metadata should contains file path of index.m3u8 in `entryUrl` field, the path is based from site directory

    const mediaMetadataInFS = await siteMgr.getMediaMetadata(siteMetadata.siteId, mediaMetadata.mediaId);
    console.log(`Media metadata read from fs: `, mediaMetadataInFS);
}

(async () => {
    const siteMgr = createSiteManager();
    await siteMgr.init();
    await testCreateSite(siteMgr);
})()

