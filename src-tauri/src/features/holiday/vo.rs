use serde::Serialize;
use sqlx::FromRow;

#[derive(Debug, FromRow, Serialize)]
pub struct HolidayVO {
  pub year: String,
  pub date: String,
  pub name: String,
}
