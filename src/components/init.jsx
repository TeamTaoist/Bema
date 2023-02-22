import styled from "styled-components";
import {useEffect, useState} from "react";
import {SiteManagerConfig} from "../core/site_mgr/models";
import {SiteManagerIPFS } from "../core/site_mgr/site_mgr_ipfs";
import {useInfo} from "../api/contracts";

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
    const {state,dispatch} = useInfo();
    const [status,setStatus]= useState(false);

    useEffect(()=>{
        // let siteConfig = new SiteManagerConfig();
        // siteConfig.dataDir = "tmpdata";
        // let siteMgr = new SiteManagerIPFS(siteConfig);
        // (async () => {
        //     try{
        //         await siteMgr.init();
        //         console.log(siteMgr)
        //         dispatch({type:'SET_SITEMGR',payload:siteMgr})
        //         setStatus(true);
        //     }catch (e) {
        //         console.error(e)
        //         setStatus(false);
        //     }
        //
        // })()

    },[])

    if(status) return null;
    return <Box>Init</Box>
}