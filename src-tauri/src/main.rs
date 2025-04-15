#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::path::PathBuf;
use tauri::api::dialog::FileDialogBuilder;
use tauri::{Manager, Runtime};

// Main entry point
fn main() {
    // Build the Tauri application
    tauri::Builder::default()
        .setup(|app| {
            // Setup code here if needed
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            open_folder_dialog,
            read_file_content,
            get_file_tree,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// Command to open folder dialog
#[tauri::command]
async fn open_folder_dialog<R: Runtime>(window: tauri::Window<R>) -> Result<Option<String>, String> {
    let file_dialog = FileDialogBuilder::new()
        .set_title("Select Project Folder")
        .set_directory("/")
        .pick_folder();

    Ok(file_dialog.map(|path| path.to_string_lossy().to_string()))
}

// Command to read file content
#[tauri::command]
async fn read_file_content(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

// Command to get file tree
#[tauri::command]
async fn get_file_tree(path: String) -> Result<FileEntry, String> {
    let path_buf = PathBuf::from(&path);
    build_file_tree(path_buf).map_err(|e| e.to_string())
}

// A struct representing a file or directory
#[derive(serde::Serialize, serde::Deserialize, Debug)]
struct FileEntry {
    name: String,
    path: String,
    is_directory: bool,
    children: Option<Vec<FileEntry>>,
}

// Helper function to build file tree recursively
fn build_file_tree(path: PathBuf) -> Result<FileEntry, std::io::Error> {
    let metadata = std::fs::metadata(&path)?;
    let file_name = path.file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| String::from(""));
    
    let path_str = path.to_string_lossy().to_string();
    
    let mut entry = FileEntry {
        name: file_name,
        path: path_str,
        is_directory: metadata.is_dir(),
        children: None,
    };
    
    if metadata.is_dir() {
        let mut children = Vec::new();
        for entry_result in std::fs::read_dir(path)? {
            let child_entry = entry_result?;
            let child_path = child_entry.path();
            
            // Skip hidden files and special directories
            let file_name = child_path.file_name()
                .map(|s| s.to_string_lossy().to_string())
                .unwrap_or_else(|| String::from(""));
            
            if file_name.starts_with(".") || file_name == "node_modules" || file_name == "target" {
                continue;
            }
            
            match build_file_tree(child_path) {
                Ok(file_entry) => children.push(file_entry),
                Err(e) => eprintln!("Error processing file: {}", e),
            }
        }
        
        entry.children = Some(children);
    }
    
    Ok(entry)
}
