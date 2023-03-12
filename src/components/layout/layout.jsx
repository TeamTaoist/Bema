import React from "react";
import styled from "styled-components";
import LftImg from "../../assets/images/left.png";
import { useNavigate } from "react-router-dom";
import {useEffect, useState} from "react";
import Modal from "../Modal";
import RhtBox from "../rhtBox";
import AddImg from "../../assets/images/icon_add.svg";
// import LogoImg from "../../assets/images/logo.png";
import Loading from "../loading";
import {useInfo} from "../../api/contracts";
// import SuccessImg from "../../assets/images/success.png";

const Box = styled.div`
    width: 100vw;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
`
const Lft = styled.div`
    width: 250px;
  height: 100vh;
  background: url(${LftImg}) no-repeat;
  background-size: 100% ;
  //box-shadow: 0 0 10px  rgba(34, 34, 34, 0.7);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px;
`

const Rht = styled.div`
flex-grow: 1;
  height: 100vh;
  overflow-y: auto;
  background: #000;
`

const Logo = styled.div`
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 20px;
  font-size: 48px;
  img{
    height: 50px;
    opacity: 0.8;

  }
`

const SiderBox = styled.div`
  flex-grow: 1;
  padding: 40px 0;
  width: 100%;
  overflow-y: auto;
`
const Sider = styled.ul`
   opacity: 0.5;
  width: 100%;
    margin-bottom: 10px;
  font-size: 12px;
    font-family: "Poppins-Light";

`
const ButtonAnimate = styled.div`
  padding-bottom: 30px;
  .btn {
    position: relative;
    top: 0;
    left: 0;
    width: 200px;
    height: 50px;
    margin: 0;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .btn span {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(255, 255, 255, 0.05);
    box-shadow: 0 15px 15px rgba(0, 0, 0, 0.3);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 10px;
    overflow: hidden;
    color: #fff;
    z-index: 1;
    transition: 0.5s;
    backdrop-filter: blur(15px);
    img{
      width: 20px;
    }
  }
  

  .btn span::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 50%;
    height: 100%;
    background: linear-gradient(to left, rgba(255, 255, 255, 0.15), transparent);
    transform: skewX(45deg) translate(0);
    transition: 0.5s;
    filter: blur(0px);
  }

  .btn:hover span::before {
    transform: skewX(45deg) translate(200px);
  }

  .btn::before {
    content: "";
    position: absolute;
    left: 50%;
    transform: translatex(-50%);
    bottom: -5px;
    width: 30px;
    height: 10px;
    background: #f00;
    border-radius: 10px;
    transition: 0.5s;
    transition-delay: 0.5;
  }

  .btn:hover::before /*lightup button*/ {
    bottom: 0;
    height: 50%;
    width: 80%;
    border-radius: 30px;
  }

  .btn::after {
    content: "";
    position: absolute;
    left: 50%;
    transform: translatex(-50%);
    top: -5px;
    width: 30px;
    height: 10px;
    background: #f00;
    border-radius: 10px;
    transition: 0.5s;
    transition-delay: 0.5;
  }

  .btn:hover::after{
    top: 0;
    height: 50%;
    width: 80%;
    border-radius: 30px;
  }

  .btn:first-child::before,
  .btn:first-child::after {
    background: #2b60d8;
    box-shadow: 0 0 5px #2b60d8, 0 0 15px #2b60d8, 0 0 30px #2b60d8,
    0 0 60px #2b60d8;
  }

`
const SuccessBox = styled.div`
  width: 100vw;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 99;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
`

const SuccessInner = styled.div`
  background: rgba(0, 0, 0, 0.6);
  padding: 40px;
  border-radius: 10px;
  .top{
    text-align: center;
    margin-bottom: 20px;
    img{
      width: 50px;
    }
  } 
`

export default function Layout(props){
    const navigate = useNavigate();
    const {state} = useInfo();
    const { siteApi } = state;
    const [show,setShow] = useState(false);
    const [self,setSelf] = useState([]);
    const [subscribed,setSubscribed] = useState([{
        name:"first Follow",
        id:"12345",
        // metaFileId:"metaFileId"

    }]);
    const [showLoading,setLoading] = useState(false);
    const [showSuccess,setShowSuccess] = useState(false);

    useEffect(()=>{
        if(!siteApi)return;
        GetMySites()

    },[siteApi])

    const GetMySites = async() =>{
        const sites = await siteApi.listSites();
        setSelf(sites)
    }

    const handleHome = () =>{
        navigate("/")
    }

    const handleModal = () =>{
        setShow(true)
    }
    const handleClose = () =>{
        setShow(false)
    }

    const handleSuccess = () =>{
        setShowSuccess(true)
        setTimeout(()=>{
            setShowSuccess(false)
        },2000)
    }

    return <Box>
        {
            showLoading &&<Loading />
        }
        {
            showSuccess &&<SuccessBox>
                <SuccessInner>
                    <div className="top">
                        {/*<img src={SuccessImg} alt=""/>*/}
                    </div>
                    <div>
                        Add Success !
                    </div>
                </SuccessInner>

            </SuccessBox>
        }
        {
            show &&<Modal handleClose={handleClose} handleSuccess={handleSuccess} />
        }

        <Lft >
            <Logo onClick={()=>handleHome()}>
                BEMA
                {/*<img src={LogoImg} alt=""/>*/}
            </Logo>
            <SiderBox>
                <Sider> I created</Sider>
                {
                    self.map((item,index)=>(<RhtBox id={`self_${index}`} item={item} key={`self_${index}`}/>))
                }

                <Sider>
                    Following
                </Sider>
                {/*{*/}
                {/*    subscribed.map((item,index)=>(<RhtBox id={`subscribed_${index}`} item={item} key={`subscribed_${index}`}/>))*/}
                {/*}*/}
            </SiderBox>

            <ButtonAnimate>
                <div className="btn" onClick={()=>handleModal()}><span><img src={AddImg} alt=""/></span>
                    </div>
            </ButtonAnimate>
        </Lft>
        <Rht >{props.children}</Rht>
    </Box>
}