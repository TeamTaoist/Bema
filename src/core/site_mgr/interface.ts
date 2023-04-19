// SiteManagerInterface defines signatures for various methods that will be used for managing site
// For each user, there is one associated site manager object
import {SiteMediaMetadata, SiteMetadata, UploadMediaRequest, UserMetadata} from "./models";

export interface SiteManagerInterface {
    // User related
    getUserMetadata: (userId: string) => Promise<UserMetadata>;

    // Site related
    listSites: () => Promise<SiteMetadata[]>;
    createSite: (siteName: string, description: string) => Promise<SiteMetadata>;
    updateSite: (siteConfig: SiteMetadata) => Promise<void>;
    deleteSite: (siteId: string) => Promise<void>;
    getSite: (siteId: string) => Promise<SiteMetadata>;

    // Media related
    uploadMedia: (reqData: UploadMediaRequest) => Promise<SiteMediaMetadata>;
    getMediaMetadata: (siteId: string, mediaId: string) => Promise<SiteMediaMetadata>;
}