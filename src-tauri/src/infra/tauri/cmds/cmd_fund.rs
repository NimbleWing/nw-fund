use std::sync::Arc;

use anyhow::Result;
use tauri::State;

use crate::AppService;
use crate::services::fund::{FundBrief, FundDetail, FundHolding, NavPoint};

#[tauri::command]
pub async fn fund_search(
  keyword: String,
  service: State<'_, Arc<AppService>>,
) -> Result<Vec<FundBrief>, String> {
  service
    .fund
    .search(&keyword)
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn fund_nav_history(
  code: String,
  service: State<'_, Arc<AppService>>,
) -> Result<Vec<NavPoint>, String> {
  service
    .fund
    .nav_history(&code)
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn fund_detail(
  code: String,
  service: State<'_, Arc<AppService>>,
) -> Result<FundDetail, String> {
  service.fund.detail(&code).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn fund_holdings(
  code: String,
  service: State<'_, Arc<AppService>>,
) -> Result<Vec<FundHolding>, String> {
  service
    .fund
    .holdings(&code)
    .await
    .map_err(|e| e.to_string())
}
