import styled from "styled-components";
import CloseImg from "../assets/images/icon_close.svg";
import React from "react";
import { Button } from "react-bootstrap";

const Box = styled.div`
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

const MidBox = styled.div`
  background: #222;
  padding: 20px;
  border-radius: 8px;
  box-shadow: -5px -5px 20px #00000040;
  width: 400px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`

const TitleBox = styled.div`
  font-family: "Poppins-Medium";
  font-size: 20px;
  text-align: center;
  position: relative;
  padding-bottom: 20px;
`

const CloseBox = styled.div`
    position: absolute;
  right: -10px;
  top: -10px;
  z-index: 999;
  cursor: pointer;
  img{
    width: 20px;
  }
`
const ContentBox = styled.div`
    .desc{
      margin: 20px auto;
    }
`
const BtnGroup = styled.div`
    display: flex;
  justify-content: space-between;
  margin-top: 30px;
  button{
    width: 48%;
    height: 44px;
  }
  .cancel{
    background:transparent;
    border: 1px solid #fff;
  }
`

export default function Reminder(props){
    const {handleClose,removeSite} = props
    return <Box>
        <MidBox>
            <TitleBox>
                Reminder
                <CloseBox onClick={()=>handleClose()}>
                <img src={CloseImg} alt=""/>
            </CloseBox></TitleBox>
            <ContentBox>
                <div className="dec">
                    Are you sure delete this site? This operation cannot be undone.
                </div>
                <BtnGroup>
                    <Button variant="danger" onClick={()=>removeSite()}>Delete</Button>
                    <Button className="cancel" onClick={()=>handleClose()}>Cancel</Button>
                </BtnGroup>
            </ContentBox>
        </MidBox>
    </Box>
}