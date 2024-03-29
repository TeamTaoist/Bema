import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import Database from "tauri-plugin-sql-api";
import { BaseDirectory, createDir, writeFile } from "@tauri-apps/api/fs";
import RouterLink from "./router/router";
import { HashRouter as Router } from "react-router-dom";
import GlobalStyle from "./utils/GloablStyle";
import 'bootstrap/dist/css/bootstrap.min.css';


const db = await Database.load("sqlite:testFiles.db");

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    setGreetMsg(await invoke("greet", { name }));
  }

  async function createDataFolder() {
    try {
      await createDir("data", {
        dir: BaseDirectory.Desktop,
        recursive: true,
      });
    } catch (e) {
      console.error(e);
    }
  };

  async function createDataFile() {
    try {
      await writeFile(
        {
          contents: "[]",
          path: `data.json`,
        },
        {
          dir: BaseDirectory.Desktop,
        }
      );
    } catch (e) {
      console.log(e);
    }
  };

  async function createDB() {
    const SQL = "CREATE TABLE todos (\
      id INTEGER NOT NULL PRIMARY KEY,\
      title VARCHAR NOT NULL,\
      body TEXT NOT NULL DEFAULT '',\
      done BOOLEAN NOT NULL DEFAULT 'f'\
    );";

    await db.execute(SQL);
  }

  async function insert() {
    const SQL = `INSERT INTO todos VALUES(${Date.now()}, 'my task', 'task desc', 'f');`;

    await db.execute(SQL);
  }

  async function query() {
    const SQL = "SELECT id, title, body, done from todos;";
    let ret = await db.select(SQL);
    console.log(ret);
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
