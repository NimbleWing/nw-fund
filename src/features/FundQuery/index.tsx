import { Card, Chip } from '@heroui/react';
import { invoke } from '@tauri-apps/api/core';
import { Search, TrendingDown, TrendingUp } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import type { FundBrief, FundDetail, FundHolding, NavPoint } from './types';

export const FundQuery = () => {
  const { t } = useTranslation();
  const [keyword, setKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<FundBrief[]>([]);
  const [selectedFund, setSelectedFund] = useState<FundBrief | null>(null);
  const [fundDetail, setFundDetail] = useState<FundDetail | null>(null);
  const [holdings, setHoldings] = useState<FundHolding[]>([]);
  const [navHistory, setNavHistory] = useState<NavPoint[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleInputChange = (value: string) => {
    setKeyword(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    setShowDropdown(false);
    setSearchLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await invoke<FundBrief[]>('fund_search', { keyword: value.trim() });
        setSearchResults(results);
        setShowDropdown(results.length > 0);
      } catch {
        setSearchResults([]);
        setShowDropdown(false);
      }
      setSearchLoading(false);
    }, 300);
  };

  const selectFund = async (fund: FundBrief) => {
    setSearchResults([]);
    setShowDropdown(false);
    setKeyword(`${fund.code} - ${fund.name}`);
    setSelectedFund(fund);
    setDetailLoading(true);
    setFundDetail(null);
    setHoldings([]);
    setNavHistory([]);
    try {
      const [detailResult, holdingsResult, navResult] = await Promise.all([
        invoke<FundDetail>('fund_detail', { code: fund.code }),
        invoke<FundHolding[]>('fund_holdings', { code: fund.code }),
        invoke<NavPoint[]>('fund_nav_history', { code: fund.code }),
      ]);
      setFundDetail(detailResult);
      setHoldings(holdingsResult);
      setNavHistory(navResult);
    } catch (e) {
      console.error('load detail failed', e);
    }
    setDetailLoading(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-default-400 pointer-events-none z-10" />
        <input
          className="w-full h-9 pl-9 pr-3 rounded-lg bg-default-50 border border-default-200 text-sm outline-none focus:border-primary"
          placeholder={t('fund.query.search_placeholder')}
          value={keyword}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (searchResults.length > 0) setShowDropdown(true);
          }}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        />
        {searchLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
            <div className="size-3.5 border-2 border-default-300 border-t-primary rounded-full animate-spin" />
          </div>
        )}
        {showDropdown && searchResults.length > 0 && (
          <Card.Root className="absolute top-full mt-1 left-0 right-0 z-50 max-h-72 overflow-y-auto shadow-lg">
            <Card.Content className="px-2 py-2">
              <div className="flex flex-col gap-0.5">
                {searchResults.map((fund) => (
                  <button
                    key={fund.code}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors hover:bg-default-100 w-full"
                    onMouseDown={() => selectFund(fund)}
                  >
                    <span className="font-mono text-sm w-20 shrink-0">{fund.code}</span>
                    <span className="flex-1 text-sm truncate">{fund.name}</span>
                    <Chip size="sm" variant="soft" color="default">
                      {fund.type_name}
                    </Chip>
                  </button>
                ))}
              </div>
            </Card.Content>
          </Card.Root>
        )}
      </div>

      {detailLoading && <div className="flex justify-center py-8 text-default-400">Loading...</div>}

      {selectedFund && fundDetail && !detailLoading && (
        <>
          <Card.Root>
            <Card.Header className="pb-1 pt-3 px-4">
              <h3 className="text-base font-medium">{t('fund.detail.title')}</h3>
            </Card.Header>
            <Card.Content className="px-4 py-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <p className="text-xs text-default-400">{t('fund.detail.code')}</p>
                  <p className="text-sm font-mono">{fundDetail.code}</p>
                </div>
                <div>
                  <p className="text-xs text-default-400">{t('fund.detail.name')}</p>
                  <p className="text-sm">{fundDetail.name}</p>
                </div>
                <div>
                  <p className="text-xs text-default-400">{t('fund.detail.type')}</p>
                  <p className="text-sm">{fundDetail.type_name}</p>
                </div>
                <div>
                  <p className="text-xs text-default-400">{t('fund.detail.nav')}</p>
                  <p className="text-sm font-mono">
                    {fundDetail.nav !== null ? fundDetail.nav.toFixed(4) : '--'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-default-400">{t('fund.detail.estimated_nav')}</p>
                  <p className="text-sm font-mono">
                    {fundDetail.estimated_nav !== null ? fundDetail.estimated_nav.toFixed(4) : '--'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-default-400">{t('fund.detail.day_change')}</p>
                  <p className="text-sm font-mono flex items-center gap-1">
                    {fundDetail.day_change !== null ? (
                      <>
                        <span>{fundDetail.day_change.toFixed(2)}%</span>
                        {fundDetail.day_change >= 0 ? (
                          <TrendingUp className="size-3.5 text-success" />
                        ) : (
                          <TrendingDown className="size-3.5 text-danger" />
                        )}
                      </>
                    ) : (
                      '--'
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-default-400">{t('fund.detail.acc_nav')}</p>
                  <p className="text-sm font-mono">
                    {fundDetail.acc_nav !== null ? fundDetail.acc_nav.toFixed(4) : '--'}
                  </p>
                </div>
              </div>
            </Card.Content>
          </Card.Root>

          <Card.Root>
            <Card.Header className="pb-1 pt-3 px-4">
              <h3 className="text-base font-medium">{t('fund.holdings.title')}</h3>
            </Card.Header>
            <Card.Content className="px-0 py-0">
              {holdings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-divider text-default-400 text-xs">
                        <th className="px-4 py-2 text-left w-12">#</th>
                        <th className="px-4 py-2 text-left">{t('fund.holdings.code')}</th>
                        <th className="px-4 py-2 text-left">{t('fund.holdings.name')}</th>
                        <th className="px-4 py-2 text-right">{t('fund.holdings.percent')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holdings.map((h, i) => (
                        <tr
                          key={h.code}
                          className="border-b border-divider last:border-0 hover:bg-default-50"
                        >
                          <td className="px-4 py-2 text-default-400">{i + 1}</td>
                          <td className="px-4 py-2 font-mono">{h.code}</td>
                          <td className="px-4 py-2">{h.name}</td>
                          <td className="px-4 py-2 text-right">{h.percent.toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-default-400 text-sm px-4 py-4">{t('fund.holdings.empty')}</p>
              )}
            </Card.Content>
          </Card.Root>

          <Card.Root>
            <Card.Header className="pb-1 pt-3 px-4">
              <h3 className="text-base font-medium">{t('fund.nav_history.title')}</h3>
            </Card.Header>
            <Card.Content className="px-0 py-0">
              {navHistory.length > 0 ? (
                <div className="overflow-x-auto max-h-80 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-default-50">
                      <tr className="border-b border-divider text-default-400 text-xs">
                        <th className="px-4 py-2 text-left">{t('fund.nav_history.date')}</th>
                        <th className="px-4 py-2 text-right">{t('fund.nav_history.nav')}</th>
                        <th className="px-4 py-2 text-right">{t('fund.nav_history.acc_nav')}</th>
                        <th className="px-4 py-2 text-right">
                          {t('fund.nav_history.estimated_nav')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {navHistory.map((nv) => (
                        <tr
                          key={nv.date}
                          className="border-b border-divider last:border-0 hover:bg-default-50"
                        >
                          <td className="px-4 py-1.5 text-default-600">{nv.date}</td>
                          <td className="px-4 py-1.5 text-right font-mono">{nv.nav.toFixed(4)}</td>
                          <td className="px-4 py-1.5 text-right font-mono">
                            {nv.acc_nav.toFixed(4)}
                          </td>
                          <td className="px-4 py-1.5 text-right font-mono">
                            {nv.estimated_nav !== null ? nv.estimated_nav.toFixed(4) : '--'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-default-400 text-sm px-4 py-4">{t('fund.nav_history.empty')}</p>
              )}
            </Card.Content>
          </Card.Root>
        </>
      )}
    </div>
  );
};
