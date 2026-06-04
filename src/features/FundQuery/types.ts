export interface FundBrief {
  code: string;
  name: string;
  type_name: string;
}

export interface FundDetail {
  code: string;
  name: string;
  type_name: string;
  nav: number | null;
  acc_nav: number | null;
  estimated_nav: number | null;
  day_change: number | null;
}

export interface FundHolding {
  code: string;
  name: string;
  percent: number;
}

export interface NavPoint {
  date: string;
  nav: number;
  acc_nav: number;
  estimated_nav: number | null;
}
