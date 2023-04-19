import { exists, createDir, removeDir, readTextFile, writeTextFile, writeBinaryFile, BaseDirectory } from '@tauri-apps/api/fs'
import { Command } from '@tauri-apps/api/shell'

export async function execSidecarCmd(cmdName: string, args: Array<string>): Promise<void> {
    const cmd = Command.sidecar(cmdName, args);
    const output = await cmd.execute();
    console.log(output);
}

export async function spawnSidecarCmd(cmdName: string, args: Array<string>): Promise<void> {
    const cmd = Command.sidecar(cmdName, args);
    cmd.on('close', data => {
        console.log(`command finished with code ${data.code} and signal ${data.signal}`)
    });
    cmd.on('error', error => console.error(`error: "${error}"`));
    cmd.stdout.on('data', line => console.log(`stdout: "${line}"`));
    cmd.stderr.on('data', line => console.log(`stderr: "${line}"`));

    await cmd.spawn();
}


export async function createDirIfNotExisting(dirName: string) {
    if (!await exists(dirName, { dir: BaseDirectory.AppData, })) {
        await createDir(dirName, { dir: BaseDirectory.AppData, recursive: true });
    }
}