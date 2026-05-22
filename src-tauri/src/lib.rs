use std::sync::Arc;

use anyhow::Result;

use serde::Serialize;
use tauri::{Emitter, Manager};
use tracing::{error, info};
use tracing_appender::rolling;
use tracing_subscriber::{
  EnvFilter,
  fmt::{self, format::FmtSpan},
  layer::SubscriberExt,
  util::SubscriberInitExt,
};
mod commands;
mod constants;
mod features;
mod infra;
use infra::tauri::cmds::*;

use crate::{
  features::{holiday, market_status},
  infra::sqlite::pool::{DbPool, init_db_pool},
};
mod services;

use crate::features::market_status::MarketStatus;
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() -> Result<()> {
  init_logging();
  tauri::Builder::default()
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_process::init())
    .setup(|app| setup(app.handle().clone()))
    .invoke_handler(tauri::generate_handler![
      cmd_holiday::holiday_list_by_year,
      cmd_market_status::get_market_status,
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
        app_handle.manage(state.clone());
        info!("数据库初始化完成!");

        let handle = app_handle.clone();
        tauri::async_runtime::spawn(async move {
          broadcast_market_status(handle, state).await;
        });
      }
      Err(e) => {
        error!(error = %e, "数据库初始化失败");
      }
    }
  });

  Ok(())
}

async fn broadcast_market_status(app_handle: tauri::AppHandle, state: Arc<AppService>) {
  let mut interval = tokio::time::interval(std::time::Duration::from_secs(
    constants::MARKET_STATUS_BROADCAST_INTERVAL_SECS,
  ));
  let mut prev_status: Option<MarketStatus> = None;
  loop {
    interval.tick().await;
    let status = state.market_status.get_status().await;
    if prev_status.as_ref() != Some(&status) {
      info!(?status, prev = ?prev_status, "股市状态已变更");
      prev_status = Some(status.clone());
    }
    if let Err(e) = app_handle.emit("market-status-changed", &status) {
      error!(error = %e, "广播市场状态失败");
    }
  }
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
  pub market_status: Arc<market_status::MarketStatusService>,
}

impl AppService {
  pub fn new(pool: DbPool) -> Self {
    let holiday = Arc::new(holiday::HolidayService::new(pool.clone()));
    Self {
      market_status: Arc::new(market_status::MarketStatusService::new(holiday.clone())),
      holiday,
    }
  }
}
