use tracing_appender::rolling;
use tracing_subscriber::{
  EnvFilter,
  fmt::{self, format::FmtSpan},
  layer::SubscriberExt,
  util::SubscriberInitExt,
};

mod commands;
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  init_logging();
  tauri::Builder::default()
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_process::init())
    .invoke_handler(tauri::generate_handler![commands::window::show_window,])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
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
