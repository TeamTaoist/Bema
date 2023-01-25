#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::api::process::{Command, CommandEvent};
use tauri::Manager;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn main() {
    // `new_sidecar()` expects just the filename, NOT the whole path like in JavaScript
    let (mut rx, mut child) = Command::new_sidecar("ipfs")
        .expect("failed to create `ipfs` binary command")
        .spawn()
        .expect("Failed to spawn ipfs");

    tauri::async_runtime::spawn(async move {
        // read events such as stdout
        while let Some(event) = rx.recv().await {
            if let CommandEvent::Stdout(_line) = event {
                // window
                //     .emit("message", Some(format!("'{}'", _line)))
                //     .expect("failed to emit event");

                // write to stdin
                child.write("message from Rust\n".as_bytes()).unwrap();
            }
        }
    });

    // App itself
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(debug_assertions)] // only include this code on debug builds
            {
                let window = app.get_window("main").unwrap();
                window.open_devtools();
                window.close_devtools();
            }
            Ok(())
        })
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
