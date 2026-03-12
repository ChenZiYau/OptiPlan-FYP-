import { useCallback } from 'react';
import { useSettings, CURRENCY_CONFIG } from '@/contexts/SettingsContext';

export function useCurrency() {
  const { settings } = useSettings();
  const cfg = CURRENCY_CONFIG[settings.currency];

  /** Full precision: RM1,234.56 or $1,234.56 */
  const fmt = useCallback(
    (n: number) => {
      return `${cfg.symbol}${n.toLocaleString(cfg.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    },
    [cfg],
  );

  /** Compact: RM1.2k, $10k */
  const fmtCompact = useCallback(
    (n: number) => {
      const num = Number(n) || 0;
      const abs = Math.abs(num);
      const sign = num < 0 ? '-' : '';
      if (abs >= 1_000_000) {
        const v = abs / 1_000_000;
        return `${sign}${cfg.symbol}${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}m`;
      }
      if (abs >= 100_000) {
        return `${sign}${cfg.symbol}${Math.round(abs / 1_000)}k`;
      }
      if (abs >= 1_000) {
        const v = abs / 1_000;
        return `${sign}${cfg.symbol}${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}k`;
      }
      return `${sign}${cfg.symbol}${abs.toFixed(2)}`;
    },
    [cfg],
  );

  return { currency: settings.currency, symbol: cfg.symbol, fmt, fmtCompact };
}
