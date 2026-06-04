use std::future::Future;
use std::pin::Pin;

use chrono::NaiveDate;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct FundBrief {
  pub code: String,
  pub name: String,
  pub type_name: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct NavPoint {
  pub date: NaiveDate,
  pub nav: f64,
  pub acc_nav: f64,
  pub estimated_nav: Option<f64>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct FundDetail {
  pub code: String,
  pub name: String,
  pub type_name: String,
  pub nav: Option<f64>,
  pub acc_nav: Option<f64>,
  pub estimated_nav: Option<f64>,
  pub day_change: Option<f64>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct FundHolding {
  pub code: String,
  pub name: String,
  pub percent: f64,
}

pub trait FundDataProvider: Send + Sync {
  fn id(&self) -> &'static str;
  fn name(&self) -> &'static str;

  fn search<'a>(
    &'a self,
    keyword: String,
  ) -> Pin<Box<dyn Future<Output = anyhow::Result<Vec<FundBrief>>> + Send + 'a>>;
  fn nav_history<'a>(
    &'a self,
    code: String,
  ) -> Pin<Box<dyn Future<Output = anyhow::Result<Vec<NavPoint>>> + Send + 'a>>;
  fn detail<'a>(
    &'a self,
    code: String,
  ) -> Pin<Box<dyn Future<Output = anyhow::Result<FundDetail>> + Send + 'a>>;
  fn holdings<'a>(
    &'a self,
    code: String,
  ) -> Pin<Box<dyn Future<Output = anyhow::Result<Vec<FundHolding>>> + Send + 'a>>;
}

pub mod providers;
