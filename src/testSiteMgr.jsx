import styled from "styled-components";
import { useEffect, useState } from "react";
import { SiteManagerIPFS } from "./core/site_mgr/site_mgr_ipfs";
import { useInfo } from "./api/contracts";
import { Button, Card, Form, Row, Container, Col, Placeholder } from "react-bootstrap";
import { useRef } from 'react';


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

var rslt = {}

export default function TestSiteMgrPage() {
    const { state } = useInfo();
    const { siteApi } = state;
    const [rslt, setRslt] = useState({});

    const siteIdRef = useRef();

    return <Box>
        <Container>

            <Row>
                <Card bg="dark" text="white">
                    <Card.Title>Result</Card.Title>
                    <Card.Body>{JSON.stringify(rslt)}</Card.Body>
                </Card>
            </Row>

            <Row>
                <Col>
                    <Button variant="flat" onClick={async () => {
                        const sites = await siteApi.listSites();
                        setRslt(sites);
                    }}> List Sites </Button>
                </Col>

                <Col>
                    <Button variant="flat" onClick={async () => {
                        const metadata = await siteApi.createSite("foobar", "");
                        setRslt(metadata);
                    }}> Craete Site </Button>
                </Col>

                <Col>
                    <Button variant="flat" onClick={async () => {
                        await siteApi.updateAllToStorage();
                    }}> Update All Sites </Button>
                </Col>
            </Row>

            <Placeholder xs={12} bg="success" />

            <Row>
                <Form>
                    <Form.Group className="mb-3" controlId="userEnterSiteId">
                        <Form.Label>Site Id</Form.Label>
                        <Form.Control ref={siteIdRef} placeholder="Site ID" />
                    </Form.Group>
                </Form>
            </Row>

            <Row>
                <Col>
                    <Button variant="flat" className="mb-3" onClick={async () => {
                        await siteApi.deleteSite(siteIdRef.current.value);
                    }}> Delete Site </Button>
                </Col>

                <Col>
                    <Button variant="flat" className="mb-3" onClick={async () => {
                        const siteMetadata = await siteApi.getSite(siteIdRef.current.value);
                        console.log(siteMetadata)
                        setRslt(siteMetadata);
                    }}> Get Site </Button>
                </Col>

                <Col>
                    <Button variant="flat" className="mb-3" onClick={async () => {
                        const mediaMetadata = await siteApi.uploadMedia({
                            siteId: siteIdRef.current.value,
                            tmpMediaPath: 'bun33s.mp4'
                        })
                        setRslt(mediaMetadata)
                    }}> Upload Media </Button>
                </Col>
            </Row>
        </Container>
    </Box>
}