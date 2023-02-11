import styled from "styled-components";
import {useEffect, useState} from "react";
// import {SiteManagerConfig} from "../core/site_mgr/models";
// import {SiteManagerIPFS } from "../core/site_mgr/site_mgr_ipfs";

import { exportedFile } from "../core/exportedFile";

const Box = styled.div`
    width: 100vw;
  height: 100vh;
  z-index: 99;
  background: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  left: 0;
  top: 0;
`

export default function InitPage(){

    // console.log(SiteManagerIPFS)

    // let siteConfig = new SiteManagerConfig();
    // let siteMgr = new siteIPFS(siteConfig);
    const [status,setStatus]= useState(false);

    useEffect(()=>{
        // (async () => {
        //     // await siteMgr.init();
        //     setStatus(true)
        // })()

        let user = new exportedFile();

// Calling the imported class function
        console.log(user.sayHello("Geek"));
    },[])

    if(status) return null;
    return <Box>Init</Box>
}