import React from "react";
import styled from "styled-components";

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

export default function Toast(props){

    const {tips} = props;

    return <SuccessBox>
        <SuccessInner>
            <div className="top">
                {/*<img src={SuccessImg} alt=""/>*/}
            </div>
            <div>{tips}</div>
        </SuccessInner>

    </SuccessBox>
}