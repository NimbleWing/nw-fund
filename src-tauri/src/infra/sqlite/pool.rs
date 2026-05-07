use anyhow::Result;
use sqlx::{
  SqlitePool,
  sqlite::{SqliteConnectOptions, SqlitePoolOptions},
};
use std::{str::FromStr, time::Duration};
use tauri::AppHandle;
use tauri::Manager;
use tracing::info;
pub type DbPool = SqlitePool;

pub async fn init_db_pool(app_handle: &AppHandle) -> Result<DbPool> {
  info!("初始化数据库连接...");
  let db_path = if cfg!(debug_assertions) {
    std::env::current_dir()?.join("nw_fund.db")
  } else {
    let app_data_dir = app_handle.path().app_data_dir()?;
    std::fs::create_dir_all(&app_data_dir)?;
    app_data_dir.join("nw_fund.db")
  };
  info!(path = %db_path.display(), "数据库路径");
  unsafe {
    std::env::set_var("DATABASE_URL", format!("sqlite://{}", db_path.display()));
  }
  if let Ok(value) = std::env::var("DATABASE_URL") {
    println!("DATABASE_URL is set to: {}", value);
  } else {
    println!("DATABASE_URL is not set");
  }
  let options = SqliteConnectOptions::from_str(&format!("sqlite://{}", db_path.display()))?
    .create_if_missing(true)
    .busy_timeout(Duration::from_secs(30))
    .pragma("foreign_keys", "ON");

  let pool = SqlitePoolOptions::new()
    .max_connections(5)
    .connect_with(options)
    .await?;
  sqlx::migrate!().run(&pool).await?;
  info!("数据库连接成功!");
  Ok(pool)
}
