use crate::features::holiday::vo::HolidayVO;
use crate::infra::sqlite::pool::DbPool;
use anyhow::Result;
use sqlx::FromRow;

#[derive(Debug, FromRow)]
pub struct HolidayRow {
  pub id: i64,
  pub name: Option<String>,
  pub date: String,
  pub year: String,
}

impl From<HolidayRow> for HolidayVO {
  fn from(row: HolidayRow) -> Self {
    HolidayVO {
      year: row.year,
      date: row.date,
      name: row.name.unwrap_or_default(),
    }
  }
}

pub struct HolidayRepo;
impl HolidayRepo {
  pub async fn list_by_year(pool: &DbPool, year: &str) -> Result<Vec<HolidayRow>> {
    let rows = sqlx::query_as!(
      HolidayRow,
      r#"SELECT id, name, date , year FROM holiday WHERE year = ? ORDER BY date ASC"#,
      year
    )
    .fetch_all(pool)
    .await?;
    Ok(rows)
  }
  pub async fn insert_holidays(pool: &DbPool, holidays: &[HolidayVO]) -> Result<()> {
    for h in holidays {
      sqlx::query!(
        "INSERT OR IGNORE INTO holiday (year, date, name) VALUES (?, ?, ?)",
        h.year,
        h.date,
        h.name
      )
      .execute(pool)
      .await?;
    }
    Ok(())
  }
}
