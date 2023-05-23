import styled from "styled-components";

const Box = styled.div`
  .line-of-dots{
    display: flex;
    align-content: center;
    justify-content: center;
    width: 70px;
    margin:5px 0 0 10px;
  }
  .line-of-dots:before {
    -webkit-animation: line-of-dots 1s infinite ease backwards;
    animation: line-of-dots 1s infinite ease backwards;
    border-radius: 100%;
    content: '';
    height: 10px;
    transform: translate(0, -100%);
    width: 10px; }

  @-webkit-keyframes line-of-dots {
    0% {
      -webkit-box-shadow: -30px 10px 0 -10px #fff, -15px 10px 0 -10px #fff, 0 10px 0 -10px #fff, 15px 10px 0 -10px #fff, 30px 10px 0 -10px #fff;
      box-shadow: -30px 10px 0 -10px #fff, -15px 10px 0 -10px #fff, 0 10px 0 -10px #fff, 15px 10px 0 -10px #fff, 30px 10px 0 -10px #fff; }
    10% {
      -webkit-box-shadow: -30px 10px 0 0 #fff, -15px 10px 0 -10px #fff, 0 10px 0 -10px #fff, 15px 10px 0 -10px #fff, 30px 10px 0 -10px #fff;
      box-shadow: -30px 10px 0 0 #fff, -15px 10px 0 -10px #fff, 0 10px 0 -10px #fff, 15px 10px 0 -10px #fff, 30px 10px 0 -10px #fff; }
    20% {
      -webkit-box-shadow: -30px 10px 0 0 #fff, -15px 10px 0 0 #fff, 0 10px 0 -10px #fff, 15px 10px 0 -10px #fff, 30px 10px 0 -10px #fff;
      box-shadow: -30px 10px 0 0 #fff, -15px 10px 0 0 #fff, 0 10px 0 -10px #fff, 15px 10px 0 -10px #fff, 30px 10px 0 -10px #fff; }
    30% {
      -webkit-box-shadow: -30px 10px 0 0 #fff, -15px 10px 0 0 #fff, 0 10px 0 0 #fff, 15px 10px 0 -10px #fff, 30px 10px 0 -10px #fff;
      box-shadow: -30px 10px 0 0 #fff, -15px 10px 0 0 #fff, 0 10px 0 0 #fff, 15px 10px 0 -10px #fff, 30px 10px 0 -10px #fff; }
    40% {
      -webkit-box-shadow: -30px 10px 0 0 #fff, -15px 10px 0 0 #fff, 0 10px 0 0 #fff, 15px 10px 0 0 #fff, 30px 10px 0 -10px #fff;
      box-shadow: -30px 10px 0 0 #fff, -15px 10px 0 0 #fff, 0 10px 0 0 #fff, 15px 10px 0 0 #fff, 30px 10px 0 -10px #fff; }
    50% {
      -webkit-box-shadow: -30px 10px 0 0 #fff, -15px 10px 0 0 #fff, 0 10px 0 0 #fff, 15px 10px 0 0 #fff, 30px 10px 0 0 #fff;
      box-shadow: -30px 10px 0 0 #fff, -15px 10px 0 0 #fff, 0 10px 0 0 #fff, 15px 10px 0 0 #fff, 30px 10px 0 0 #fff; }
    60% {
      -webkit-box-shadow: -30px 10px 0 -10px #fff, -15px 10px 0 0 #fff, 0 10px 0 0 #fff, 15px 10px 0 0 #fff, 30px 10px 0 0 #fff;
      box-shadow: -30px 10px 0 -10px #fff, -15px 10px 0 0 #fff, 0 10px 0 0 #fff, 15px 10px 0 0 #fff, 30px 10px 0 0 #fff; }
    70% {
      -webkit-box-shadow: -30px 10px 0 -10px #fff, -15px 10px 0 -10px #fff, 0 10px 0 0 #fff, 15px 10px 0 0 #fff, 30px 10px 0 0 #fff;
      box-shadow: -30px 10px 0 -10px #fff, -15px 10px 0 -10px #fff, 0 10px 0 0 #fff, 15px 10px 0 0 #fff, 30px 10px 0 0 #fff; }
    80% {
      -webkit-box-shadow: -30px 10px 0 -10px #fff, -15px 10px 0 -10px #fff, 0 10px 0 -10px #fff, 15px 10px 0 0 #fff, 30px 10px 0 0 #fff;
      box-shadow: -30px 10px 0 -10px #fff, -15px 10px 0 -10px #fff, 0 10px 0 -10px #fff, 15px 10px 0 0 #fff, 30px 10px 0 0 #fff; }
    90% {
      -webkit-box-shadow: -30px 10px 0 -10px #fff, -15px 10px 0 -10px #fff, 0 10px 0 -10px #fff, 15px 10px 0 -10px #fff, 30px 10px 0 0 #fff;
      box-shadow: -30px 10px 0 -10px #fff, -15px 10px 0 -10px #fff, 0 10px 0 -10px #fff, 15px 10px 0 -10px #fff, 30px 10px 0 0 #fff; }
    100% {
      -webkit-box-shadow: -30px 10px 0 -10px #fff, -15px 10px 0 -10px #fff, 0 10px 0 -10px #fff, 15px 10px 0 -10px #fff, 30px 10px 0 -10px #fff;
      box-shadow: -30px 10px 0 -10px #fff, -15px 10px 0 -10px #fff, 0 10px 0 -10px #fff, 15px 10px 0 -10px #fff, 30px 10px 0 -10px #fff; } }

  @keyframes line-of-dots {
    0% {
      -webkit-box-shadow: -30px 10px 0 -10px #fff, -15px 10px 0 -10px #fff, 0 10px 0 -10px #fff, 15px 10px 0 -10px #fff, 30px 10px 0 -10px #fff;
      box-shadow: -30px 10px 0 -10px #fff, -15px 10px 0 -10px #fff, 0 10px 0 -10px #fff, 15px 10px 0 -10px #fff, 30px 10px 0 -10px #fff; }
    10% {
      -webkit-box-shadow: -30px 10px 0 0 #fff, -15px 10px 0 -10px #fff, 0 10px 0 -10px #fff, 15px 10px 0 -10px #fff, 30px 10px 0 -10px #fff;
      box-shadow: -30px 10px 0 0 #fff, -15px 10px 0 -10px #fff, 0 10px 0 -10px #fff, 15px 10px 0 -10px #fff, 30px 10px 0 -10px #fff; }
    20% {
      -webkit-box-shadow: -30px 10px 0 0 #fff, -15px 10px 0 0 #fff, 0 10px 0 -10px #fff, 15px 10px 0 -10px #fff, 30px 10px 0 -10px #fff;
      box-shadow: -30px 10px 0 0 #fff, -15px 10px 0 0 #fff, 0 10px 0 -10px #fff, 15px 10px 0 -10px #fff, 30px 10px 0 -10px #fff; }
    30% {
      -webkit-box-shadow: -30px 10px 0 0 #fff, -15px 10px 0 0 #fff, 0 10px 0 0 #fff, 15px 10px 0 -10px #fff, 30px 10px 0 -10px #fff;
      box-shadow: -30px 10px 0 0 #fff, -15px 10px 0 0 #fff, 0 10px 0 0 #fff, 15px 10px 0 -10px #fff, 30px 10px 0 -10px #fff; }
    40% {
      -webkit-box-shadow: -30px 10px 0 0 #fff, -15px 10px 0 0 #fff, 0 10px 0 0 #fff, 15px 10px 0 0 #fff, 30px 10px 0 -10px #fff;
      box-shadow: -30px 10px 0 0 #fff, -15px 10px 0 0 #fff, 0 10px 0 0 #fff, 15px 10px 0 0 #fff, 30px 10px 0 -10px #fff; }
    50% {
      -webkit-box-shadow: -30px 10px 0 0 #fff, -15px 10px 0 0 #fff, 0 10px 0 0 #fff, 15px 10px 0 0 #fff, 30px 10px 0 0 #fff;
      box-shadow: -30px 10px 0 0 #fff, -15px 10px 0 0 #fff, 0 10px 0 0 #fff, 15px 10px 0 0 #fff, 30px 10px 0 0 #fff; }
    60% {
      -webkit-box-shadow: -30px 10px 0 -10px #fff, -15px 10px 0 0 #fff, 0 10px 0 0 #fff, 15px 10px 0 0 #fff, 30px 10px 0 0 #fff;
      box-shadow: -30px 10px 0 -10px #fff, -15px 10px 0 0 #fff, 0 10px 0 0 #fff, 15px 10px 0 0 #fff, 30px 10px 0 0 #fff; }
    70% {
      -webkit-box-shadow: -30px 10px 0 -10px #fff, -15px 10px 0 -10px #fff, 0 10px 0 0 #fff, 15px 10px 0 0 #fff, 30px 10px 0 0 #fff;
      box-shadow: -30px 10px 0 -10px #fff, -15px 10px 0 -10px #fff, 0 10px 0 0 #fff, 15px 10px 0 0 #fff, 30px 10px 0 0 #fff; }
    80% {
      -webkit-box-shadow: -30px 10px 0 -10px #fff, -15px 10px 0 -10px #fff, 0 10px 0 -10px #fff, 15px 10px 0 0 #fff, 30px 10px 0 0 #fff;
      box-shadow: -30px 10px 0 -10px #fff, -15px 10px 0 -10px #fff, 0 10px 0 -10px #fff, 15px 10px 0 0 #fff, 30px 10px 0 0 #fff; }
    90% {
      -webkit-box-shadow: -30px 10px 0 -10px #fff, -15px 10px 0 -10px #fff, 0 10px 0 -10px #fff, 15px 10px 0 -10px #fff, 30px 10px 0 0 #fff;
      box-shadow: -30px 10px 0 -10px #fff, -15px 10px 0 -10px #fff, 0 10px 0 -10px #fff, 15px 10px 0 -10px #fff, 30px 10px 0 0 #fff; }
    100% {
      -webkit-box-shadow: -30px 10px 0 -10px #fff, -15px 10px 0 -10px #fff, 0 10px 0 -10px #fff, 15px 10px 0 -10px #fff, 30px 10px 0 -10px #fff;
      box-shadow: -30px 10px 0 -10px #fff, -15px 10px 0 -10px #fff, 0 10px 0 -10px #fff, 15px 10px 0 -10px #fff, 30px 10px 0 -10px #fff; } }
`
export default function BtnLoading(){
    return <Box>
        <div className="line-of-dots" />
    </Box>
}