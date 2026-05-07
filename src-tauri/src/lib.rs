use std::sync::Arc;

use anyhow::Result;

use serde::Serialize;
use tauri::Manager;
use tracing::{error, info};
use tracing_appender::rolling;
use tracing_subscriber::{
  EnvFilter,
  fmt::{self, format::FmtSpan},
  layer::SubscriberExt,
  util::SubscriberInitExt,
};
mod commands;
mod features;
mod infra;
use infra::tauri::cmds::*;

use crate::{
  features::holiday,
  infra::sqlite::pool::{DbPool, init_db_pool},
};
mod services;
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() -> Result<()> {
  init_logging();
  tauri::Builder::default()
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_process::init())
    .setup(|app| setup(app.handle().clone()))
    .invoke_handler(tauri::generate_handler![
      cmd_holiday::holiday_list_by_year,
      commands::window::show_window,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
  Ok(())
}
// 初始化日志系统
fn init_logging() {
  let file_appender = rolling::daily("logs", "nw_fund.log");
  let (non_blocking, _guard) = tracing_appender::non_blocking(file_appender);
  tracing_subscriber::registry()
    .with(EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")))
    .with(
      fmt::Layer::new()
        .with_writer(non_blocking)
        .with_ansi(false)
        .with_target(true)
        .with_level(true)
        .with_timer(fmt::time::ChronoLocal::new(
          "%Y-%m-%d %H:%M:%S%.3f".to_string(),
        ))
        .with_file(false)
        .with_line_number(false),
    )
    .with(
      fmt::Layer::new()
        .with_writer(std::io::stdout)
        .with_target(false)
        .with_span_events(FmtSpan::CLOSE)
        .with_level(true)
        .with_file(true)
        .with_line_number(true)
        .with_timer(fmt::time::ChronoLocal::new("%H:%M:%S".to_string())),
    )
    .init();
  tracing::info!("应用启动中...");
}

// 初始化
fn setup(app_handle: tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
  tauri::async_runtime::spawn(async move {
    info!("初始化数据库...");
    match init_db_pool(&app_handle).await {
      Ok(pool) => {
        let state = Arc::new(AppService::new(pool));
        app_handle.manage(state);
        info!("数据库初始化完成!");
      }
      Err(e) => {
        error!(error = %e, "数据库初始化失败");
      }
    }
  });

  Ok(())
}

#[derive(Debug, Clone, Serialize)]
pub struct Error {
  message: String,
}

impl From<anyhow::Error> for Error {
  fn from(err: anyhow::Error) -> Self {
    print!("{}", err);
    Self {
      message: err.to_string(),
    }
  }
}

pub struct AppService {
  pub holiday: Arc<holiday::HolidayService>,
}

impl AppService {
  pub fn new(pool: DbPool) -> Self {
    Self {
      holiday: Arc::new(holiday::HolidayService::new(pool.clone())),
    }
  }
}
