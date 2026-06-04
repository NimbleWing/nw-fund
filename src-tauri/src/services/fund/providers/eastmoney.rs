use std::future::Future;
use std::pin::Pin;
use std::sync::RwLock;
use std::time::Instant;

use chrono::NaiveDate;
use reqwest::Client;
use serde::Deserialize;
use tracing::info;

use crate::services::fund::{FundBrief, FundDataProvider, FundDetail, FundHolding, NavPoint};

const FUND_LIST_CACHE_DURATION: std::time::Duration = std::time::Duration::from_secs(3600);

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct FundRealtime {
  fundcode: String,
  name: String,
  jzrq: String,
  dwjz: String,
  gsz: String,
  gszzl: String,
  gztime: String,
}

#[derive(Debug, Clone)]
struct FundCacheItem {
  code: String,
  name: String,
  type_name: String,
}

pub struct EastMoneyProvider {
  client: Client,
  fund_list_cache: RwLock<(Vec<FundCacheItem>, Instant)>,
}

impl EastMoneyProvider {
  pub fn new() -> Self {
    let client = Client::builder()
      .timeout(std::time::Duration::from_secs(10))
      .build()
      .unwrap_or_else(|_| Client::new());
    Self {
      client,
      fund_list_cache: RwLock::new((Vec::new(), Instant::now())),
    }
  }

  async fn get_cached_fund_list(&self) -> anyhow::Result<Vec<FundCacheItem>> {
    {
      let guard = self
        .fund_list_cache
        .read()
        .map_err(|e| anyhow::anyhow!("读锁: {}", e))?;
      let (list, fetched_at) = &*guard;
      if !list.is_empty() && fetched_at.elapsed() < FUND_LIST_CACHE_DURATION {
        return Ok(list.clone());
      }
    }
    let fresh = self.fetch_fund_list().await?;
    {
      let mut guard = self
        .fund_list_cache
        .write()
        .map_err(|e| anyhow::anyhow!("写锁: {}", e))?;
      *guard = (fresh.clone(), Instant::now());
    }
    Ok(fresh)
  }

  async fn fetch_fund_list(&self) -> anyhow::Result<Vec<FundCacheItem>> {
    let url = "https://fund.eastmoney.com/js/fundcode_search.js";
    info!(url, "请求基金列表");
    let resp = self.client.get(url).send().await?;
    let text = resp.text().await?;
    let text = text.trim_start_matches('\u{feff}');
    let json_str = text
      .strip_prefix("var r = ")
      .and_then(|s| s.strip_suffix(";"))
      .ok_or_else(|| anyhow::anyhow!("无效的基金列表数据"))?;
    let raw: Vec<Vec<String>> = serde_json::from_str(json_str)?;
    let list: Vec<FundCacheItem> = raw
      .into_iter()
      .filter(|item| item.len() >= 5)
      .map(|item| FundCacheItem {
        code: item[0].clone(),
        name: item[2].clone(),
        type_name: item[3].clone(),
      })
      .collect();
    info!(count = list.len(), "基金列表已获取");
    Ok(list)
  }

  async fn fetch_realtime(&self, code: &str) -> anyhow::Result<FundRealtime> {
    let url = format!("https://fundgz.1234567.com.cn/js/{}.js", code);
    info!(url, "请求实时估值");
    let resp = self.client.get(&url).send().await?;
    let text = resp.text().await?;
    let json_str = text
      .strip_prefix("jsonpgz(")
      .and_then(|s| s.strip_suffix(");"))
      .ok_or_else(|| anyhow::anyhow!("无效的 JSONP 响应"))?;
    let data: FundRealtime = serde_json::from_str(json_str)?;
    Ok(data)
  }

  #[allow(dead_code)]
  async fn fetch_manager(&self, code: &str) -> Option<String> {
    let url = format!("https://fund.eastmoney.com/pingzhongdata/{}.js", code);
    let text = self.client.get(&url).send().await.ok()?.text().await.ok()?;
    let marker = "Data_currentFundManager =";
    let start = text.find(marker)?;
    let json_start = start + marker.len();
    let end = text[json_start..].find(";")?;
    let json_str = text[json_start..json_start + end].trim();
    let managers: Vec<serde_json::Value> = serde_json::from_str(json_str).ok()?;
    managers
      .first()?
      .get("name")?
      .as_str()
      .map(|s| s.to_string())
  }

  #[allow(dead_code)]
  async fn fetch_company(&self, code: &str) -> Option<String> {
    let url = format!("https://fundf10.eastmoney.com/jbgk_{}.html", code);
    let html = self.client.get(&url).send().await.ok()?.text().await.ok()?;
    let start = html.find("基金管理人</th>")?;
    let td_start = html[start..].find("<td")?;
    let link_start = html[start + td_start..].find(">")?;
    let link_end = html[start + td_start + link_start..].find("</a>")?;
    let content =
      &html[start + td_start + link_start + 1..start + td_start + link_start + link_end];
    let text_start = content.rfind('>')?;
    Some(content[text_start + 1..].trim().to_string())
  }

  async fn try_fetch_holdings_f10(&self, code: &str) -> anyhow::Result<Vec<FundHolding>> {
    let url = format!(
      "https://fundf10.eastmoney.com/FundArchivesDatas.aspx?type=jjcc&code={}&topline=10",
      code
    );
    info!(url, "请求基金持仓");
    let resp = self
      .client
      .get(&url)
      .header("Referer", "https://fundf10.eastmoney.com/")
      .header("User-Agent", "Mozilla/5.0")
      .send()
      .await?;
    let text = resp.text().await?;
    let html = Self::extract_apidata_content(&text).ok_or_else(|| {
      let snippet: String = text.chars().take(200).collect();
      anyhow::anyhow!("无效的持仓响应: {}", snippet)
    })?;
    Ok(Self::parse_holdings_html(&html))
  }

  /// 从 `var apidata={ content:"...", records:... }` 中提取 content 的 HTML 字符串。
  fn extract_apidata_content(text: &str) -> Option<String> {
    let marker = "content:\"";
    let start = text.find(marker)?;
    let remaining = &text[start + marker.len()..];
    let mut i = 0;
    let bytes = remaining.as_bytes();
    while i < bytes.len() {
      if bytes[i] == b'\\' {
        i += 2;
        continue;
      }
      if bytes[i] == b'"' {
        let after = remaining[i + 1..].trim_start();
        if after.starts_with(',') || after.starts_with('}') {
          return Some(remaining[..i].to_string());
        }
      }
      i += 1;
    }
    None
  }

  /// Strip HTML tags and trim whitespace from a fragment.
  fn text_content(s: &str) -> String {
    let mut result = String::with_capacity(s.len());
    let mut in_tag = false;
    for ch in s.chars() {
      match ch {
        '<' => in_tag = true,
        '>' => in_tag = false,
        _ if !in_tag => result.push(ch),
        _ => {}
      }
    }
    result.trim().to_string()
  }

  fn parse_holdings_html(html: &str) -> Vec<FundHolding> {
    let mut holdings = Vec::new();
    for line in html.split("</tr>") {
      if !line.contains("<td") || line.contains("<th") {
        continue;
      }
      let cells: Vec<&str> = line.split("</td>").collect();
      if cells.len() < 7 {
        continue;
      }
      let stock_code = Self::text_content(cells[1]);
      let stock_name = Self::text_content(cells[2]);
      let percent_str = Self::text_content(cells[6]).replace(['%', ',', '\u{a0}'], "");
      if let Ok(percent) = percent_str.parse::<f64>()
        && !stock_code.is_empty()
      {
        holdings.push(FundHolding {
          code: stock_code,
          name: stock_name,
          percent,
        });
      }
    }
    holdings
  }
}

impl FundDataProvider for EastMoneyProvider {
  fn id(&self) -> &'static str {
    "eastmoney"
  }

  fn name(&self) -> &'static str {
    "天天基金"
  }

  fn search<'a>(
    &'a self,
    keyword: String,
  ) -> Pin<Box<dyn Future<Output = anyhow::Result<Vec<FundBrief>>> + Send + 'a>> {
    Box::pin(async move {
      let list = self.get_cached_fund_list().await?;
      let keyword = keyword.to_lowercase();
      let results: Vec<FundBrief> = list
        .into_iter()
        .filter(|f| f.code.contains(&keyword) || f.name.to_lowercase().contains(&keyword))
        .take(20)
        .map(|f| FundBrief {
          code: f.code,
          name: f.name,
          type_name: f.type_name,
        })
        .collect();
      Ok(results)
    })
  }

  fn nav_history<'a>(
    &'a self,
    code: String,
  ) -> Pin<Box<dyn Future<Output = anyhow::Result<Vec<NavPoint>>> + Send + 'a>> {
    Box::pin(async move {
      let url = format!(
        "https://fundf10.eastmoney.com/F10DataApi.aspx?type=lsjz&code={}&page=1&per=30",
        code
      );
      info!(url, "请求净值历史");
      let resp = self.client.get(&url).send().await?;
      let text = resp.text().await?;
      let html_content = text
        .strip_prefix("var apidata={ content:\"")
        .and_then(|s| s.split("\",records:").next())
        .ok_or_else(|| anyhow::anyhow!("无效的净值历史响应"))?;

      let mut records = Vec::new();
      for line in html_content.split("</tr>") {
        if !line.contains("<td") {
          continue;
        }
        let cells: Vec<&str> = line.split("</td>").collect();
        if cells.len() < 4 {
          continue;
        }
        let extract =
          |cell: &str| -> String { cell.split('>').next_back().unwrap_or("").trim().to_string() };
        let date_str = extract(cells[0]);
        let nav_str = extract(cells[1]);
        let acc_nav_str = extract(cells[2]);
        if let (Ok(date), Ok(nav), Ok(acc_nav)) = (
          NaiveDate::parse_from_str(&date_str, "%Y-%m-%d"),
          nav_str.parse::<f64>(),
          acc_nav_str.parse::<f64>(),
        ) {
          records.push(NavPoint {
            date,
            nav,
            acc_nav,
            estimated_nav: None,
          });
        }
      }
      Ok(records)
    })
  }

  fn holdings<'a>(
    &'a self,
    code: String,
  ) -> Pin<Box<dyn Future<Output = anyhow::Result<Vec<FundHolding>>> + Send + 'a>> {
    Box::pin(async move {
      let holdings = self.try_fetch_holdings_f10(&code).await?;
      Ok(holdings)
    })
  }

  fn detail<'a>(
    &'a self,
    code: String,
  ) -> Pin<Box<dyn Future<Output = anyhow::Result<FundDetail>> + Send + 'a>> {
    Box::pin(async move {
      let realtime = self.fetch_realtime(&code).await?;
      let type_name = self
        .get_cached_fund_list()
        .await
        .ok()
        .and_then(|list| list.into_iter().find(|f| f.code == code))
        .map(|f| f.type_name)
        .unwrap_or_default();
      Ok(FundDetail {
        code: realtime.fundcode.clone(),
        name: realtime.name.clone(),
        type_name,
        nav: realtime.dwjz.parse::<f64>().ok(),
        acc_nav: None,
        estimated_nav: realtime.gsz.parse::<f64>().ok(),
        day_change: realtime.gszzl.parse::<f64>().ok(),
      })
    })
  }
}
