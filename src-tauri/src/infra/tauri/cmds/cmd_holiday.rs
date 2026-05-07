use std::sync::Arc;

use anyhow::Result;
use tauri::State;

use crate::{AppService, features::holiday::vo::HolidayVO};
#[tauri::command]
pub async fn holiday_list_by_year(
  year: String,
  service: State<'_, Arc<AppService>>,
) -> Result<Vec<HolidayVO>, String> {
  service
    .holiday
    .list_by_year(&year)
    .await
    .map_err(|e| e.to_string())
}
