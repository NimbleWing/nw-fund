# Fund Data Provider — 多数据源基金数据接入层

## 目标

为 nw-fund 实现第三方基金数据接入层，支持多数据源无缝切换和静默降级。

## 架构

```
Tauri invoke
    │
    ▼
infra/tauri/cmds/cmd_fund.rs     ← 参数校验 → 调 service
    │
    ▼
features/fund/service.rs         ← FundDataService: 降级编排 + 可选缓存
    │                    │
    │              (future) SQLite Cache
    │
    ▼
services/fund/provider.rs        ← FundDataProvider trait + 统一模型
    │
    ├── services/fund/providers/eastmoney.rs
    ├── services/fund/providers/sina.rs
    └── (future providers)
```

## FundDataProvider Trait

```rust
#[async_trait]
pub trait FundDataProvider: Send + Sync {
    fn id(&self) -> &'static str;
    fn name(&self) -> &'static str;

    async fn search(&self, keyword: &str) -> Result<Vec<FundBrief>>;
    async fn nav_history(&self, code: &str) -> Result<Vec<NavPoint>>;
    async fn detail(&self, code: &str) -> Result<FundDetail>;
}
```

## 统一数据模型

```rust
pub struct FundBrief {
    pub code: String,
    pub name: String,
    pub type_name: String,
}

pub struct NavPoint {
    pub date: NaiveDate,
    pub nav: f64,
    pub acc_nav: f64,
    pub estimated_nav: Option<f64>,
}

pub struct FundDetail {
    pub code: String,
    pub name: String,
    pub type_name: String,
    pub nav: Option<f64>,
    pub acc_nav: Option<f64>,
    pub estimated_nav: Option<f64>,
    pub day_change: Option<f64>,
}
```

## FundDataService

```rust
pub struct FundDataService {
    providers: Vec<Box<dyn FundDataProvider>>,
}

impl FundDataService {
    pub async fn search(&self, keyword: &str) -> Result<Vec<FundBrief>>;
    pub async fn nav_history(&self, code: &str) -> Result<Vec<NavPoint>>;
    pub async fn detail(&self, code: &str) -> Result<FundDetail>;
}
```

限流/失败时日志警告 + 按序尝试下一个 provider。全部失败则返回最终 Error。

## 实现顺序

1. `services/fund/` — trait + 统一模型 + eastmoney 实现（HTTP 框架
2. `features/fund/` — FundDataService（降级编排）
3. `infra/tauri/cmds/cmd_fund.rs` — Tauri 命令
4. `lib.rs` — 注册到 AppService
5. 前端简单 invoke 验证

## 不包含（YAGNI）

- 无前端 UI
- 无缓存
- 无运行时热切换配置
- 无多版本 Provider 接口
