use crate::features::holiday::repo::HolidayRepo;
use crate::features::holiday::vo::HolidayVO;
use crate::infra::sqlite::pool::DbPool;
use crate::services::ThirtyDataClient;
use anyhow::Result;
pub struct HolidayService {
  pool: DbPool,
}

impl HolidayService {
  pub fn new(pool: DbPool) -> Self {
    Self { pool }
  }

  pub async fn list_by_year(&self, year: &str) -> Result<Vec<HolidayVO>> {
    let rows = HolidayRepo::list_by_year(&self.pool, year).await?;
    if !rows.is_empty() {
      return Ok(rows.into_iter().map(HolidayVO::from).collect());
    }
    let client = ThirtyDataClient::new();
    let response = client.get_holiday().await?;
    let mut holidays = Vec::new();
    if let Some(year_data) = response.data.get(year) {
      for day_info in year_data.values() {
        if day_info.holiday {
          holidays.push(HolidayVO {
            year: year.to_string(),
            date: day_info.date.clone(),
            name: day_info.name.clone(),
          });
        }
      }
    }

    if !holidays.is_empty() {
      HolidayRepo::insert_holidays(&self.pool, &holidays).await?;
    }
    Ok(holidays)
  }
}
