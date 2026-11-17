import React, { useEffect } from 'react';
import * as api from './api';
import { useAsync, Coin } from './ui';
import { isScored } from './homework';

// The homework_on_time rule: the default coins per assignment.
export function useHomeworkRule() {
  const rules = useAsync(() => api.rewardRules().catch(() => []), []);
  const rule = (rules.data || []).find((r) => r.key === 'homework_on_time');
  return rule ? { coins: rule.coins, enabled: rule.enabled } : null;
}

export const PASS_OPTIONS = [0, 50, 60, 70, 80, 90, 100];

// Coins + pass mark fields for the assignment forms. coins is a string ('' until
// the rule's default arrives); pass is a number.
export function CoinFields({ kind, coins, setCoins, pass, setPass, idPrefix = 'ac' }) {
  const rule = useHomeworkRule();
  useEffect(() => {
    if (rule && coins === '') setCoins(String(rule.coins));
  }, [rule, coins, setCoins]);
  return (
    <div className="hub-form-row">
      <div className="form-field">
        <label className="form-label" htmlFor={`${idPrefix}-coins`}><Coin size={12} /> Coins</label>
        <input id={`${idPrefix}-coins`} type="number" min="0" max="1000" className="form-input" value={coins}
          onChange={(e) => setCoins(e.target.value)} placeholder={rule ? String(rule.coins) : ''} />
        <p className="form-help">Paid when it's done by the deadline. 0 for none.</p>
      </div>
      {isScored(kind) && (
        <div className="form-field">
          <label className="form-label" htmlFor={`${idPrefix}-pass`}>Coins need at least</label>
          <select id={`${idPrefix}-pass`} className="form-select" value={pass} onChange={(e) => setPass(Number(e.target.value))}>
            {PASS_OPTIONS.map((n) => <option key={n} value={n}>{n ? `${n}% correct` : 'Any score'}</option>)}
          </select>
          <p className="form-help">Below this it doesn't earn coins or count for the perfect week. The best attempt counts.</p>
        </div>
      )}
    </div>
  );
}

export const coinsValue = (s) => (s === '' || s == null ? null : Math.max(0, Math.min(1000, Math.round(Number(s) || 0))));
