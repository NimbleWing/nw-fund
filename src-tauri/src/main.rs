// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use nw_fund_lib::Error;
#[tokio::main]
async fn main() -> Result<(), Error> {
  nw_fund_lib::run().await?;
  Ok(())
}
