use std::future::Future;
use std::pin::Pin;

use tracing::warn;

use crate::services::fund::{FundBrief, FundDataProvider, FundDetail, FundHolding, NavPoint};

pub struct FundDataService {
  providers: Vec<Box<dyn FundDataProvider>>,
}

impl FundDataService {
  pub fn new(providers: Vec<Box<dyn FundDataProvider>>) -> Self {
    Self { providers }
  }

  pub async fn search(&self, keyword: &str) -> anyhow::Result<Vec<FundBrief>> {
    let keyword = keyword.to_string();
    try_providers(&self.providers, move |p| p.search(keyword.clone())).await
  }

  pub async fn nav_history(&self, code: &str) -> anyhow::Result<Vec<NavPoint>> {
    let code = code.to_string();
    try_providers(&self.providers, move |p| p.nav_history(code.clone())).await
  }

  pub async fn detail(&self, code: &str) -> anyhow::Result<FundDetail> {
    let code = code.to_string();
    try_providers(&self.providers, move |p| p.detail(code.clone())).await
  }

  pub async fn holdings(&self, code: &str) -> anyhow::Result<Vec<FundHolding>> {
    let code = code.to_string();
    try_providers(&self.providers, move |p| p.holdings(code.clone())).await
  }
}

async fn try_providers<T>(
  providers: &[Box<dyn FundDataProvider>],
  f: impl for<'a> Fn(
    &'a (dyn FundDataProvider + 'a),
  ) -> Pin<Box<dyn Future<Output = anyhow::Result<T>> + Send + 'a>>,
) -> anyhow::Result<T>
where
  T: 'static,
{
  let mut last_error = None;
  for provider in providers {
    match f(provider.as_ref()).await {
      Ok(result) => return Ok(result),
      Err(e) => {
        warn!(provider = %provider.id(), error = %e, "数据源请求失败，尝试下一个");
        last_error = Some(e);
      }
    }
  }
  Err(anyhow::anyhow!("所有数据源均失败: {:?}", last_error))
}
