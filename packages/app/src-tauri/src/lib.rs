mod commands;

use tauri::menu::{AboutMetadata, MenuBuilder, MenuItemBuilder, SubmenuBuilder};
use tauri::{Emitter, Manager};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::export_diagram_pdf,
            commands::export_diagram_png
        ])
        .setup(|app| {
            // macOS: the root menu bar can only contain submenus. Flat MenuItems produce an empty menu bar.
            let handle = app.handle();

            let file_new = MenuItemBuilder::new("New Document")
                .id("file:new")
                .accelerator("CmdOrCtrl+N")
                .build(app)?;
            let file_open = MenuItemBuilder::new("Open…")
                .id("file:open")
                .accelerator("CmdOrCtrl+O")
                .build(app)?;
            let file_save = MenuItemBuilder::new("Save")
                .id("file:save")
                .accelerator("CmdOrCtrl+S")
                .build(app)?;
            let file_export = MenuItemBuilder::new("Export…")
                .id("file:export")
                .accelerator("CmdOrCtrl+Shift+E")
                .build(app)?;

            let edit_undo = MenuItemBuilder::new("Undo")
                .id("edit:undo")
                .accelerator("CmdOrCtrl+Z")
                .build(app)?;
            let edit_redo = MenuItemBuilder::new("Redo")
                .id("edit:redo")
                .accelerator("CmdOrCtrl+Shift+Z")
                .build(app)?;

            let app_submenu = SubmenuBuilder::new(handle, "agentsdraw")
                .about(Some(AboutMetadata::default()))
                .separator()
                .services()
                .separator()
                .hide()
                .hide_others()
                .show_all()
                .separator()
                .quit()
                .build()?;

            let file_submenu = SubmenuBuilder::new(handle, "File")
                .item(&file_new)
                .item(&file_open)
                .separator()
                .item(&file_save)
                .item(&file_export)
                .separator()
                .close_window()
                .build()?;

            let edit_submenu = SubmenuBuilder::new(handle, "Edit")
                .item(&edit_undo)
                .item(&edit_redo)
                .separator()
                .cut()
                .copy()
                .paste()
                .select_all()
                .build()?;

            let window_submenu = SubmenuBuilder::new(handle, "Window")
                .minimize()
                .maximize()
                .separator()
                .fullscreen()
                .build()?;

            let menu = MenuBuilder::new(handle)
                .items(&[&app_submenu, &file_submenu, &edit_submenu, &window_submenu])
                .build()?;
            app.set_menu(menu)?;

            // Open devtools in debug builds so blank-screen issues are visible.
            #[cfg(debug_assertions)]
            if let Some(w) = app.get_webview_window("main") {
                w.open_devtools();
            }

            Ok(())
        })
        .on_menu_event(|app, event| match event.id().as_ref() {
            "file:new" => {
                let _ = app.emit("file-new", ());
            }
            "file:open" => {
                let _ = app.emit("file-open", ());
            }
            "file:save" => {
                let _ = app.emit("file-save", ());
            }
            "file:export" => {
                let _ = app.emit("open-export", ());
            }
            "edit:undo" => {
                let _ = app.emit("doc-undo", ());
            }
            "edit:redo" => {
                let _ = app.emit("doc-redo", ());
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
