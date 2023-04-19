import React, { useEffect, useState } from "react";
import ReactPaginate from "react-paginate";
import styled from "styled-components";

const Box = styled.div`
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-top: 40px;
    a {
        text-decoration: none;
        color: #fff;
        font-family: "Barlow-Light";
    }
    .page-break {
        width: 32px;
        height: 32px;
        text-align: center;
        line-height: 32px;
        margin-right: -4px;
    }
    .page-link,
    .page-left,
    .page-right {
        width: 32px;
        height: 32px;
        background: transparent;
        border: 1px solid #fff;
        text-align: center;
        line-height: 32px;
        padding: 0;
        font-size: 14px;
        font-weight: 400;
        cursor: pointer;
        color: #fff;
      border-radius: 4px;
    }
    .next,
    .page-left,
    .page-right {
        display: none;
    }
    .page-link {
        &:hover {
            color: #fff;
        }
        &:focus {
            box-shadow: none;
        }
    }

    .disabled {
        .pageL {
            color: #f2f2f2 !important;
        }
    }
    .active {
        .page-link {
            color: #fff;
        }
    }
`;
const NumBox = styled.div`
    font-size: 14px;
    font-weight: 400;
    color: #949999;
`;

const GoToBox = styled.div`
    display: flex;
    align-items: center;
    margin-left: 12px;
    border: 1px solid #0C0D0D;
    border-radius: 3px;
    overflow: hidden;
    height: 32px;
    input {
        width: 64px;
        height: 32px;
        background: transparent;
        border: 0;
        text-align: center;
        font-size: 14px;
        color: #ffffff;
        &::-webkit-outer-spin-button,
        &::-webkit-inner-spin-button {
            -webkit-appearance: none !important;
        }
    }
    .btn {
        width: 32px;
        height: 32px;
        text-align: center;
        padding: 0;
        font-size: 14px;
        color: #0C0D0D;
        background: #fff;
      border-radius: 4px;
    }
`;
const RhtBox = styled.div`
    display: flex;
`;
const Page = ({ page, itemsPerPage, total, handleToPage, handlePageSize }) => {
    const [pageCount, setPageCount] = useState(0);
    const [pageSize, setPageSize] = useState(0);
    const [current, setCurrent] = useState(0);
    const [pageList] = useState([10, 50, 100]);
    const [pageToGo, setPageToGo] = useState("");
    const [currentSize, setCurrentSize] = useState(0);
    const [show, setShow] = useState(false);

    useEffect(() => {
        document.addEventListener("click", (e) => {
            setShow(false);
        });
    }, []);

    useEffect(() => {
        setPageCount(Math.ceil(total / itemsPerPage));
    }, [itemsPerPage, total]);

    useEffect(()=>{

        setCurrent(page)
    },[page])

    useEffect(() => {
        setPageSize(itemsPerPage || 10);
    }, [itemsPerPage]);

    // useEffect(() => {
    //     const ps = pageList[currentSize];
    //     setPageSize(Number(ps));
    //     handlePageSize(pageList[currentSize]);
    // }, [currentSize]);
    useEffect(() => {
        if(current === undefined)return;
        handleToPage(current);
    }, [current]);

    const handlePageClick = (event) => {
        setCurrent(event.selected);
    };
    const handleInput = (e) => {
        const { value } = e.target;
        const val = Number(value);

        if (val > pageCount || val < 1) {
            setPageToGo("");
        } else {
            setPageToGo(val.toString());
        }
    };
    const handleToGo = () => {
        const pg = Number(pageToGo) - 1;
        setCurrent(pg);
    };

    return (
        <Box >
            <RhtBox>
                <ReactPaginate
                    previousLabel=""
                    nextLabel="next"
                    pageClassName="page-item"
                    pageLinkClassName="page-link"
                    previousClassName="page-left"
                    previousLinkClassName="pageL"
                    breakLabel="..."
                    breakClassName="page-break"
                    breakLinkClassName="page-break"
                    pageCount={pageCount}
                    marginPagesDisplayed={1}
                    pageRangeDisplayed={5}
                    onPageChange={(e) => handlePageClick(e)}
                    containerClassName="pagination"
                    activeClassName="active"
                    forcePage={page}
                />
                <GoToBox >
                    <input type="number" value={pageToGo} onChange={handleInput} placeholder="Page" />
                    <button className="btn" onClick={() => handleToGo()}>
                        Go
                    </button>
                </GoToBox>
            </RhtBox>
        </Box>
    );
};
export default Page;
