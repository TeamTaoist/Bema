import React from "react";
import Layout from "./components/layout/layout";
import styled from "styled-components";
import Item from "./components/item";
import Loading from "./components/loading";
import VideoBox from "./components/videoBox"
import {useEffect, useState} from "react";
import AudioBox from "./components/AudioBox";
import { useParams } from "react-router-dom";
import Bg from "./components/bg";
import DetailImg from "./assets/images/icon_detail.svg";

import DemoImg from "./assets/images/testFiles/ccImg.png";

const Box = styled.div`
    padding: 40px;
  position: relative;
`

const Latest = styled.ul`
  display: flex;
  align-items: stretch;
  flex-wrap: wrap;
  justify-content: space-between;
    li{
      width: 31%;
      .movie-title {
        font-size: 24px;
        color: #ffffff;
        margin: 0;
        font-family: "Poppins-SemiBold";
      }
      .movie-header {
        height: 260px;
      }
      &:nth-child(3){
        margin-right: 0;
      }
      
    }
`

const ListBox = styled.ul`
  display: flex;
  align-items: stretch;
  flex-wrap: wrap;
  margin-top: 20px;
    li{
      width: 22%;
      margin-right: 4%;
      &:nth-child(4n){
        margin-right: 0;
      }
      .movie-title {
        font-size: 18px;
        color: #ffffff;
        font-family: "Poppins-Light";
        margin: 0;
      }
      .movie-header {
        height: 240px;
      }
    }
`

const NoItem = styled.div`
  width: 100%;
  text-align: center;
  height: 600px;
  display: flex;
  align-items: center;
  justify-content: center;
  .inn{
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  img{
    opacity: 0.3;
    width: 80px;
  }
  span{
    margin-top: 20px;
    opacity: 0.6;
  }
`


export default function List(){
    const[show,setShow] = useState(false);
    const[showAudio,setShowAudio] = useState(false);
    const [showLoading,setLoading] = useState(false);
    const [BList,setBList] = useState([{
        title:"Léon: The Professional",
        description:"Twenty Years of Creative Commons (in Sixty Seconds)” by Ryan Junell and Glenn Otis Brown for Creative Commons is licensed via CC BY 4.0 and includes adaptations of many open and public domain works.",
        created_at:"01/26/2023 01:29",
        cover:DemoImg
    }]);
    const [SList,setSList] = useState([]);
    const [current,setCurrent] = useState();

    const {id} = useParams();

    useEffect(()=>{
        if(!id || id ==='all'){
            setLoading(false);
            return;
        }

    },[id])


    const handleVideo = (item,index,type) =>{
        console.log(index)
        setCurrent(item);
        if(index===2 && type==='blist'){
            setShowAudio(true)
        }else{
            setShow(true)
        }
    }

    const handleClose = () =>{
        setShow(false)
    }
    // const handleAudio = (item) =>{
    //     setShowAudio(true)
    //     setCurrent(item);
    // }

    const handleCloseAudio = () =>{
        setShowAudio(false)
    }

    return <Layout>
        {
            showLoading &&<Loading />
        }

        {
            show&&<VideoBox handleClose={handleClose} item={current} />
        }
        {
            showAudio&&<AudioBox handleClose={handleCloseAudio} item={current}/>
        }
        {
            id === 'all' && <Bg />
        }
        {
            id !== 'all'&&BList.length>=1 &&<Box>
                <Latest>
                    {
                        BList.map((item,index)=>( <li key={index} onClick={()=>handleVideo(item,index,'blist')}>
                            <Item item={item} height={260}/>
                        </li>))
                    }
                </Latest>
                <ListBox>
                    {
                        SList.map((item,index)=>( <li key={index} onClick={()=>handleVideo(item,index,'slist')}>
                            <Item item={item} height={240} />
                        </li>))
                    }
                </ListBox>
            </Box>
        }
        {
            id !== 'all'&& !BList.length &&<Box>
                <NoItem>

                    <div className="inn">
                        <img src={DetailImg} alt=""/>
                        <span>No Video/Audio</span>
                    </div>
                </NoItem>

            </Box>
        }

    </Layout>
}