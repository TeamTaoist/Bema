import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { Profile } from "./core/dao";
import Database from "tauri-plugin-sql-api";
import { BaseDirectory, createDir, writeFile } from "@tauri-apps/api/fs";
import RouterLink from "./router/router";
import { HashRouter as Router } from "react-router-dom";
import GlobalStyle from "./utils/GloablStyle";
import 'bootstrap/dist/css/bootstrap.min.css';



const profile = new Profile();
const db = await Database.load("sqlite:testFiles.db");

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    setGreetMsg(await invoke("greet", { name }));
  }

  async function createDataFolder() {
    profile.createDataFolder();
  };

  async function createDataFile() {
    profile.createDataFile();
  };

  async function createDB() {
    profile.createDB();
  }

  async function insert() {
    profile.insert();
  }

  async function query() {
    profile.query();
  }

  return (
    <div>

      <Router>
        <RouterLink />
      </Router>
      <GlobalStyle />
      {/*<div className="row">*/}
      {/*  <div>*/}
      {/*    <input*/}
      {/*      id="greet-input"*/}
      {/*      onChange={(e) => setName(e.currentTarget.value)}*/}
      {/*      placeholder="Enter a name..."*/}
      {/*    />*/}
      {/*    <button type="button" onClick={() => greet()}>*/}
      {/*      Greet*/}
      {/*    </button>*/}
      {/*    <button type="button" onClick={() => createDB()}>*/}
      {/*      Create DB*/}
      {/*    </button>*/}
      {/*    <button type="button" onClick={() => insert()}>*/}
      {/*      Insert Record*/}
      {/*    </button>*/}
      {/*    <button type="button" onClick={() => query()}>*/}
      {/*      Query Record*/}
      {/*    </button>*/}
      {/*    <button type="button" onClick={() => createDataFolder()}>*/}
      {/*      Create DataFolder*/}
      {/*    </button>*/}
      {/*    <button type="button" onClick={() => createDataFile()}>*/}
      {/*      Create DataFile*/}
      {/*    </button>*/}
      {/*  </div>*/}
      {/*</div>*/}
    </div>
  );
}

export default App;
