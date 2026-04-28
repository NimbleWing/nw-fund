use tauri::{AppHandle, WebviewWindow};

#[tauri::command]
pub async fn show_window(_app_handle: AppHandle, window: WebviewWindow) {
  let _ = window.show();
  let _ = window.unminimize();
  let _ = window.set_focus();
}
