use std::sync::Arc;

use tauri::State;

use crate::AppService;
use crate::features::market_status::MarketStatus;

#[tauri::command]
pub async fn get_market_status(
  service: State<'_, Arc<AppService>>,
) -> Result<MarketStatus, String> {
  Ok(service.market_status.get_status().await)
}
