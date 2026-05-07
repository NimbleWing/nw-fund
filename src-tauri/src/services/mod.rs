use reqwest::Client;
use serde::Deserialize;
use std::collections::HashMap;
use tracing::{error, info};

type Year = String;
type Date = String;

#[derive(Debug, Deserialize)]
pub struct HolidayResponse {
  pub data: HashMap<Year, HashMap<Date, DayInfo>>,
}

#[derive(Debug, Deserialize)]
pub struct DayInfo {
  pub holiday: bool,
  pub name: String,
  pub date: Date,
}

pub struct ThirtyDataClient {
  client: Client,
}

impl ThirtyDataClient {
  pub fn new() -> Self {
    let client = Client::builder()
      .timeout(std::time::Duration::from_secs(10))
      .build()
      .unwrap_or_else(|e| {
        error!(error = %e, "创建 HTTP 客户端失败");
        Client::new()
      });
    Self { client }
  }

  pub async fn get_holiday(&self) -> anyhow::Result<HolidayResponse> {
    let url = "https://funds.rabt.top/funds/holiday.json";
    info!(url = %url, "请求假日列表");
    let response = self.client.get(url).send().await?;
    let data: HolidayResponse = response.json().await?;
    info!("获取假日数据成功");
    Ok(data)
  }
}
