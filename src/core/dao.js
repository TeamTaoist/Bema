import { BaseDirectory, createDir, writeFile } from "@tauri-apps/api/fs";
import Database from "tauri-plugin-sql-api";

export class Profile {
    constructor() {
        console.log("Profile constructor");
        this.loadDB();
    }

    async loadDB() {
        // this.db = await Database.load("sqlite:test.db");
    }

    async createDataFolder() {
        try {
            await createDir("data", {
                dir: BaseDirectory.Desktop,
                recursive: true,
            });
        } catch (e) {
            console.error(e);
        }
    };

    async createDataFile() {
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

    async createDB() {
        const SQL = "CREATE TABLE todos (\
          id INTEGER NOT NULL PRIMARY KEY,\
          title VARCHAR NOT NULL,\
          body TEXT NOT NULL DEFAULT '',\
          done BOOLEAN NOT NULL DEFAULT 'f'\
        );";

        await this.db.execute(SQL);
    }

    async insert() {
        const SQL = `INSERT INTO todos VALUES(${Date.now()}, 'my task', 'task desc', 'f');`;

        await this.db.execute(SQL);
    }

    async query() {
        const SQL = "SELECT id, title, body, done from todos;";
        let ret = await this.db.select(SQL);
        console.log(ret);
    }

}
