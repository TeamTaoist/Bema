import styled from "styled-components";
import {useEffect, useState} from "react";
import {SiteManagerConfig} from "../core/site_mgr/models.ts";
import {SiteManagerIPFS} from "../core/site_mgr/site_mgr_ipfs.ts";


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

export default function Init(){

    let siteConfig = new SiteManagerConfig();
    let siteMgr = new SiteManagerIPFS(siteConfig);
    const [status,setStatus]= useState(false);

    useEffect(()=>{
        (async () => {
            await siteMgr.init();
            setStatus(true)
        })()
    },[])

    console.log(status)

    if(status) return null;
    return <Box>Init</Box>
}