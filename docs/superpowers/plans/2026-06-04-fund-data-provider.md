# Fund Data Provider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a multi-source fund data provider layer with graceful fallback between providers.

**Architecture:** Rust trait (`FundDataProvider`) defines the contract, each data source (eastmoney, sina, etc.) implements it. `FundDataService` orchestrates providers in priority order with silent degradation on failure.

**Tech Stack:** Rust + reqwest + tracing + serde + chrono (all existing deps), no new crates needed (Rust 1.94 supports `async fn` in traits natively).

---

### Task 1: Define FundDataProvider trait and unified models

**Files:**
- Create: `src-tauri/src/services/fund/mod.rs`
- Create: `src-tauri/src/services/fund/providers/mod.rs`
- Modify: `src-tauri/src/services/mod.rs`

- [ ] **Step 1: Create `services/fund/mod.rs` with trait and models**

```rust
use chrono::NaiveDate;

/// 基金简要信息
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct FundBrief {
    pub code: String,
    pub name: String,
    pub type_name: String,
}

/// 净值点
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct NavPoint {
    pub date: NaiveDate,
    pub nav: f64,
    pub acc_nav: f64,
    pub estimated_nav: Option<f64>,
}

/// 基金详情
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

/// 基金数据源提供者接口
pub trait FundDataProvider: Send + Sync {
    fn id(&self) -> &'static str;
    fn name(&self) -> &'static str;

    /// 搜索基金
    async fn search(&self, keyword: &str) -> anyhow::Result<Vec<FundBrief>>;
    /// 获取基金净值历史
    async fn nav_history(&self, code: &str) -> anyhow::Result<Vec<NavPoint>>;
    /// 获取基金详情
    async fn detail(&self, code: &str) -> anyhow::Result<FundDetail>;
}

pub mod providers;
```

- [ ] **Step 2: Create `services/fund/providers/mod.rs`**

```rust
pub mod eastmoney;
```

- [ ] **Step 3: Update `services/mod.rs`**

Add `pub mod fund;` after the closing brace of `impl ThirtyDataClient` or at the top of the module.

```rust
// at bottom of file, add:
pub mod fund;
```

---

### Task 2: Implement EastMoney provider

**Files:**
- Create: `src-tauri/src/services/fund/providers/eastmoney.rs`

- [ ] **Step 1: Create `eastmoney.rs` with stub provider**

This creates the provider struct and constructor only — search/nav_history/detail return `anyhow::bail!("not implemented")`.

```rust
use crate::services::fund::{FundBrief, FundDetail, FundDataProvider, NavPoint};

pub struct EastMoneyProvider;

impl EastMoneyProvider {
    pub fn new() -> Self {
        Self
    }
}

impl FundDataProvider for EastMoneyProvider {
    fn id(&self) -> &'static str {
        "eastmoney"
    }

    fn name(&self) -> &'static str {
        "天天基金"
    }

    async fn search(&self, _keyword: &str) -> anyhow::Result<Vec<FundBrief>> {
        anyhow::bail!("EastMoney search not implemented yet")
    }

    async fn nav_history(&self, _code: &str) -> anyhow::Result<Vec<NavPoint>> {
        anyhow::bail!("EastMoney nav_history not implemented yet")
    }

    async fn detail(&self, _code: &str) -> anyhow::Result<FundDetail> {
        anyhow::bail!("EastMoney detail not implemented yet")
    }
}
```

---

### Task 3: Create FundDataService with fallback orchestration

**Files:**
- Create: `src-tauri/src/features/fund/mod.rs`
- Create: `src-tauri/src/features/fund/service.rs`
- Modify: `src-tauri/src/features/mod.rs`

- [ ] **Step 1: Create `features/fund/mod.rs`**

```rust
pub mod service;
pub use service::FundDataService;
```

- [ ] **Step 2: Create `features/fund/service.rs`**

```rust
use std::sync::Arc;

use tracing::warn;

use crate::services::fund::{FundBrief, FundDetail, FundDataProvider, NavPoint};

pub struct FundDataService {
    providers: Vec<Box<dyn FundDataProvider>>,
}

impl FundDataService {
    pub fn new(providers: Vec<Box<dyn FundDataProvider>>) -> Self {
        Self { providers }
    }

    pub async fn search(&self, keyword: &str) -> anyhow::Result<Vec<FundBrief>> {
        try_providers(&self.providers, |p| async move { p.search(keyword).await }).await
    }

    pub async fn nav_history(&self, code: &str) -> anyhow::Result<Vec<NavPoint>> {
        try_providers(&self.providers, |p| async move { p.nav_history(code).await }).await
    }

    pub async fn detail(&self, code: &str) -> anyhow::Result<FundDetail> {
        try_providers(&self.providers, |p| async move { p.detail(code).await }).await
    }
}

async fn try_providers<T>(
    providers: &[Box<dyn FundDataProvider>],
    f: impl Fn(&dyn FundDataProvider) -> F,
) -> anyhow::Result<T>
where
    F: std::future::Future<Output = anyhow::Result<T>>,
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
```

- [ ] **Step 3: Update `features/mod.rs`**

```rust
pub mod fund;
pub mod holiday;
pub mod market_status;
```

---

### Task 4: Create Tauri command handler for fund

**Files:**
- Create: `src-tauri/src/infra/tauri/cmds/cmd_fund.rs`
- Modify: `src-tauri/src/infra/tauri/cmds/mod.rs`

- [ ] **Step 1: Create `cmd_fund.rs`**

```rust
use std::sync::Arc;

use tauri::State;

use crate::services::fund::{FundBrief, FundDetail, NavPoint};
use crate::AppService;

#[tauri::command]
pub async fn fund_search(
    keyword: String,
    service: State<'_, Arc<AppService>>,
) -> Result<Vec<FundBrief>, String> {
    service.fund.search(&keyword).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn fund_nav_history(
    code: String,
    service: State<'_, Arc<AppService>>,
) -> Result<Vec<NavPoint>, String> {
    service.fund.nav_history(&code).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn fund_detail(
    code: String,
    service: State<'_, Arc<AppService>>,
) -> Result<FundDetail, String> {
    service.fund.detail(&code).await.map_err(|e| e.to_string())
}
```

- [ ] **Step 2: Update `infra/tauri/cmds/mod.rs`**

```rust
pub mod cmd_fund;
pub mod cmd_holiday;
pub mod cmd_market_status;
```

---

### Task 5: Wire up AppService and register commands

**Files:**
- Modify: `src-tauri/src/lib.rs`

- [ ] **Step 1: Register `cmd_fund` in invoke_handler**

```rust
.invoke_handler(tauri::generate_handler![
    cmd_holiday::holiday_list_by_year,
    cmd_market_status::get_market_status,
    commands::window::show_window,
    cmd_fund::fund_search,
    cmd_fund::fund_nav_history,
    cmd_fund::fund_detail,
])
```

- [ ] **Step 2: Add `fund` field to `AppService`**

```rust
use crate::features::fund::FundDataService;
use crate::services::fund::providers::eastmoney::EastMoneyProvider;

pub struct AppService {
    pub holiday: Arc<holiday::HolidayService>,
    pub market_status: Arc<market_status::MarketStatusService>,
    pub fund: Arc<FundDataService>,
}

impl AppService {
    pub fn new(pool: DbPool) -> Self {
        let holiday = Arc::new(holiday::HolidayService::new(pool.clone()));
        let fund = Arc::new(FundDataService::new(vec![
            Box::new(EastMoneyProvider::new()),
        ]));
        Self {
            market_status: Arc::new(market_status::MarketStatusService::new(holiday.clone())),
            holiday,
            fund,
        }
    }
}
```

---

### Task 6: Verify compilation

- [ ] **Step 1: Build the project**

```bash
cargo build -p nw-fund
```

Expected: compilation succeeds without warnings.

- [ ] **Step 2: Run frontend build check**

```bash
pnpm lint:all
```
