import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/tauri";
import { Profile } from "./core/dao";

import "./App.css";


const profile = new Profile();

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
    <div className="container">
      <h1>Welcome to Tauri!</h1>

      <div className="row">
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>

      <p>Click on the Tauri, Vite, and React logos to learn more.</p>

      <div className="row">
        <div>
          <input
            id="greet-input"
            onChange={(e) => setName(e.currentTarget.value)}
            placeholder="Enter a name..."
          />
          <button type="button" onClick={() => greet()}>
            Greet
          </button>
          <button type="button" onClick={() => createDB()}>
            Create DB
          </button>
          <button type="button" onClick={() => insert()}>
            Insert Record
          </button>
          <button type="button" onClick={() => query()}>
            Query Record
          </button>
          <button type="button" onClick={() => createDataFolder()}>
            Create DataFolder
          </button>
          <button type="button" onClick={() => createDataFile()}>
            Create DataFile
          </button>
        </div>
      </div>

      <p>{greetMsg}</p>
    </div>
  );
}

export default App;
