use std::sync::Arc;

use chrono::Timelike;
use serde::Serialize;

use crate::features::holiday::HolidayService;
use crate::features::holiday::vo::HolidayVO;

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum MarketStatus {
  Open,
  Closed,
  AfterHours,
}

pub struct MarketStatusService {
  holiday_service: Arc<HolidayService>,
}

impl MarketStatusService {
  pub fn new(holiday_service: Arc<HolidayService>) -> Self {
    Self { holiday_service }
  }

  pub async fn get_status(&self) -> MarketStatus {
    let now = chrono::Local::now();
    let year = now.format("%Y").to_string();

    let holidays = match self.holiday_service.list_by_year(&year).await {
      Ok(h) => h,
      Err(_) => return MarketStatus::Closed,
    };

    let weekday = now.format("%u").to_string().parse::<u32>().unwrap_or(0);
    if weekday >= 6 {
      return MarketStatus::Closed;
    }

    let date_str = now.format("%Y-%m-%d").to_string();
    if holidays.iter().any(|h: &HolidayVO| h.date == date_str) {
      return MarketStatus::Closed;
    }

    let time = now.hour() * 100 + now.minute();
    if (930..1130).contains(&time) {
      return MarketStatus::Open;
    }
    if (1300..1500).contains(&time) {
      return MarketStatus::Open;
    }

    MarketStatus::AfterHours
  }
}
