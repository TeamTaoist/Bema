import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import List from "../list";

function RouterLink() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/list/all" />} />
            <Route path="/list/:id" element={<List />} />
        </Routes>
    );
}

export default RouterLink;
