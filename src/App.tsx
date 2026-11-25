import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Database,
  Upload,
  Search,
  Sparkles,
  Copy,
  Check,
  Play,
  ChevronRight,
  ChevronLeft,
  X,
  AlertCircle,
  TrendingUp,
  Edit3,
  RotateCcw,
  Download,
  Key,
  ShieldCheck,
  FileText,
  Eye,
  Code,
  BarChart2,
  Menu
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

// ============================================================================
// LOCKED DEVELOPER / CREATOR ATTRIBUTION
// Change this single constant to your name before deploying to Vercel!
// ============================================================================

const CREATOR_NAME = 'Debayan Ghosh';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type CellValue = string | number | null;
type RowData = Record<string, CellValue>;

interface ColumnSchema {
  name: string;
  type: 'NUMERIC' | 'TEXT';
  sample: string;
}

interface SqlExecutionResult {
  columns: string[];
  rows: RowData[];
  executionTimeMs: number;
  error?: string;
}

interface QueryResponse {
  sql: string;
  takeaway?: string;
  executiveSummary?: string[];
  chartType: 'bar' | 'line';
  xKey?: string;
  yKey?: string;
}

type LlmProvider = 'gemini' | 'openai';

interface LiveAiConfig {
  enabled: boolean;
  provider: LlmProvider;
  apiKey: string;
}

// ============================================================================
// SAFE STORAGE HELPERS (SANDBOX-PROOF FOR SHARED IFRAMES)
// ============================================================================

function safeSessionGet(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return window.sessionStorage.getItem(key);
    }
  } catch {
    // Ignore SecurityError in restricted sandboxed frames
  }
  return null;
}

function safeSessionSet(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(key, value);
    }
  } catch {
    // Ignore SecurityError in restricted sandboxed frames
  }
}

function safeSessionRemove(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.removeItem(key);
    }
  } catch {
    // Ignore SecurityError in restricted sandboxed frames
  }
}

// ============================================================================
// REACT ERROR BOUNDARY (PREVENTS BLANK SCREEN ON RUNTIME ERRORS)
// ============================================================================

class PreviewErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || 'Unexpected rendering error' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white rounded-2xl border border-rose-200 shadow-lg p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h2 className="text-base font-bold text-slate-900">QueryLens AI Recovery</h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              The interface encountered an unexpected issue:{' '}
              <span className="font-mono text-rose-700">{this.state.message}</span>
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, message: '' })}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
            >
              Reload Workspace
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================================
// PRE-LOADED 40-ROW B2B ACCOUNT PERFORMANCE DATASET
// ============================================================================

const INITIAL_DATASET: RowData[] = [
  { account_name: 'Acme Cloud Corp', segment: 'Enterprise', region: 'North America', quarter: 'Q1', ad_spend: 42000, attributed_revenue: 245000, deals_closed: 14, churn_risk_score: 18 },
  { account_name: 'Vanguard Logistics', segment: 'Enterprise', region: 'North America', quarter: 'Q2', ad_spend: 48000, attributed_revenue: 289000, deals_closed: 16, churn_risk_score: 22 },
  { account_name: 'Helios Biotech', segment: 'Enterprise', region: 'EMEA', quarter: 'Q1', ad_spend: 39000, attributed_revenue: 218000, deals_closed: 12, churn_risk_score: 27 },
  { account_name: 'Kestrel Financial', segment: 'Enterprise', region: 'EMEA', quarter: 'Q3', ad_spend: 51000, attributed_revenue: 312000, deals_closed: 19, churn_risk_score: 15 },
  { account_name: 'Sakura Robotics', segment: 'Enterprise', region: 'APAC', quarter: 'Q2', ad_spend: 36000, attributed_revenue: 204000, deals_closed: 11, churn_risk_score: 31 },
  { account_name: 'Pacific Telecom', segment: 'Enterprise', region: 'APAC', quarter: 'Q4', ad_spend: 55000, attributed_revenue: 348000, deals_closed: 21, churn_risk_score: 14 },
  { account_name: 'Titan Manufacturing', segment: 'Enterprise', region: 'North America', quarter: 'Q4', ad_spend: 61000, attributed_revenue: 392000, deals_closed: 24, churn_risk_score: 19 },
  { account_name: 'Nordic Energy Group', segment: 'Enterprise', region: 'EMEA', quarter: 'Q4', ad_spend: 47000, attributed_revenue: 276000, deals_closed: 15, churn_risk_score: 64 },
  { account_name: 'Stratos Aerospace', segment: 'Enterprise', region: 'North America', quarter: 'Q3', ad_spend: 44000, attributed_revenue: 259000, deals_closed: 13, churn_risk_score: 24 },
  { account_name: 'Meridian Healthcare', segment: 'Enterprise', region: 'APAC', quarter: 'Q1', ad_spend: 33000, attributed_revenue: 185000, deals_closed: 10, churn_risk_score: 68 },

  { account_name: 'BrightPath Retail', segment: 'Mid-Market', region: 'North America', quarter: 'Q1', ad_spend: 18500, attributed_revenue: 94000, deals_closed: 8, churn_risk_score: 34 },
  { account_name: 'Canyon Media Labs', segment: 'Mid-Market', region: 'North America', quarter: 'Q2', ad_spend: 21000, attributed_revenue: 112000, deals_closed: 9, churn_risk_score: 29 },
  { account_name: 'Bavaria Auto Parts', segment: 'Mid-Market', region: 'EMEA', quarter: 'Q1', ad_spend: 16500, attributed_revenue: 82000, deals_closed: 7, churn_risk_score: 42 },
  { account_name: 'Thames FinTech', segment: 'Mid-Market', region: 'EMEA', quarter: 'Q3', ad_spend: 23000, attributed_revenue: 128000, deals_closed: 11, churn_risk_score: 25 },
  { account_name: 'Southern Cross Cargo', segment: 'Mid-Market', region: 'APAC', quarter: 'Q2', ad_spend: 19000, attributed_revenue: 98500, deals_closed: 8, churn_risk_score: 38 },
  { account_name: 'Seoul Digital Commerce', segment: 'Mid-Market', region: 'APAC', quarter: 'Q3', ad_spend: 22500, attributed_revenue: 119000, deals_closed: 10, churn_risk_score: 21 },
  { account_name: 'Redwood Security', segment: 'Mid-Market', region: 'North America', quarter: 'Q4', ad_spend: 26000, attributed_revenue: 146000, deals_closed: 13, churn_risk_score: 17 },
  { account_name: 'Alpine Hospitality', segment: 'Mid-Market', region: 'EMEA', quarter: 'Q2', ad_spend: 15000, attributed_revenue: 71000, deals_closed: 6, churn_risk_score: 74 },
  { account_name: 'Harbor Freight Tech', segment: 'Mid-Market', region: 'North America', quarter: 'Q3', ad_spend: 20500, attributed_revenue: 107000, deals_closed: 9, churn_risk_score: 33 },
  { account_name: 'Kyoto Precision Tools', segment: 'Mid-Market', region: 'APAC', quarter: 'Q4', ad_spend: 24500, attributed_revenue: 135000, deals_closed: 12, churn_risk_score: 26 },
  { account_name: 'Solstice Renewables', segment: 'Mid-Market', region: 'EMEA', quarter: 'Q4', ad_spend: 25500, attributed_revenue: 141000, deals_closed: 11, churn_risk_score: 30 },
  { account_name: 'Great Lakes Packaging', segment: 'Mid-Market', region: 'North America', quarter: 'Q1', ad_spend: 17000, attributed_revenue: 86000, deals_closed: 7, churn_risk_score: 62 },
  { account_name: 'Singapore Port Systems', segment: 'Mid-Market', region: 'APAC', quarter: 'Q1', ad_spend: 18000, attributed_revenue: 92000, deals_closed: 8, churn_risk_score: 35 },
  { account_name: 'Celtic Cloud Hosting', segment: 'Mid-Market', region: 'EMEA', quarter: 'Q3', ad_spend: 19500, attributed_revenue: 101000, deals_closed: 9, churn_risk_score: 48 },

  { account_name: 'PixelCraft Studio', segment: 'SMB', region: 'North America', quarter: 'Q1', ad_spend: 5200, attributed_revenue: 24500, deals_closed: 4, churn_risk_score: 45 },
  { account_name: 'BeanCounter Bookkeeping', segment: 'SMB', region: 'North America', quarter: 'Q2', ad_spend: 6100, attributed_revenue: 29800, deals_closed: 5, churn_risk_score: 39 },
  { account_name: 'Metro Dental Network', segment: 'SMB', region: 'North America', quarter: 'Q3', ad_spend: 6800, attributed_revenue: 33400, deals_closed: 6, churn_risk_score: 28 },
  { account_name: 'Summit Fitness Clubs', segment: 'SMB', region: 'North America', quarter: 'Q4', ad_spend: 7500, attributed_revenue: 38900, deals_closed: 7, churn_risk_score: 32 },
  { account_name: 'Lisbon Design Co', segment: 'SMB', region: 'EMEA', quarter: 'Q1', ad_spend: 4800, attributed_revenue: 21200, deals_closed: 3, churn_risk_score: 79 },
  { account_name: 'Amsterdam Bike Works', segment: 'SMB', region: 'EMEA', quarter: 'Q2', ad_spend: 5500, attributed_revenue: 26400, deals_closed: 4, churn_risk_score: 51 },
  { account_name: 'Dublin Legal Partners', segment: 'SMB', region: 'EMEA', quarter: 'Q3', ad_spend: 6200, attributed_revenue: 30100, deals_closed: 5, churn_risk_score: 36 },
  { account_name: 'Prague Craft Roasters', segment: 'SMB', region: 'EMEA', quarter: 'Q4', ad_spend: 6900, attributed_revenue: 34200, deals_closed: 6, churn_risk_score: 41 },
  { account_name: 'Bondi Surf Apparel', segment: 'SMB', region: 'APAC', quarter: 'Q1', ad_spend: 4500, attributed_revenue: 19800, deals_closed: 3, churn_risk_score: 83 },
  { account_name: 'Auckland AgriTech', segment: 'SMB', region: 'APAC', quarter: 'Q2', ad_spend: 5400, attributed_revenue: 25900, deals_closed: 4, churn_risk_score: 44 },
  { account_name: 'Taipei Micro Devices', segment: 'SMB', region: 'APAC', quarter: 'Q3', ad_spend: 6400, attributed_revenue: 31800, deals_closed: 5, churn_risk_score: 29 },
  { account_name: 'Manila Talent Hub', segment: 'SMB', region: 'APAC', quarter: 'Q4', ad_spend: 7100, attributed_revenue: 36500, deals_closed: 6, churn_risk_score: 37 },
  { account_name: 'Austin Solar Installers', segment: 'SMB', region: 'North America', quarter: 'Q2', ad_spend: 5900, attributed_revenue: 27600, deals_closed: 4, churn_risk_score: 71 },
  { account_name: 'Lyon Bistro Group', segment: 'SMB', region: 'EMEA', quarter: 'Q1', ad_spend: 4300, attributed_revenue: 18400, deals_closed: 3, churn_risk_score: 86 },
  { account_name: 'Osaka Indie Games', segment: 'SMB', region: 'APAC', quarter: 'Q3', ad_spend: 5800, attributed_revenue: 28100, deals_closed: 5, churn_risk_score: 40 },
  { account_name: 'Denver Outdoor Gear', segment: 'SMB', region: 'North America', quarter: 'Q4', ad_spend: 7300, attributed_revenue: 37100, deals_closed: 6, churn_risk_score: 23 }
];

const DEFAULT_SAMPLE_QUESTIONS = [
  'Total revenue by segment',
  'Compare ROAS and ad spend across regions',
  'Quarterly revenue and deals closed trend',
  'Top 8 high-risk accounts by churn score'
];

// ============================================================================
// ZERO-DEPENDENCY PURE TYPESCRIPT IN-BROWSER SQL ENGINE
// ============================================================================

function splitTopLevelCommas(input: string): string[] {
  const parts: string[] = [];
  let current = '';
  let depth = 0;
  let inSingleQuote = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === "'" && input[i - 1] !== '\\') {
      inSingleQuote = !inSingleQuote;
      current += ch;
    } else if (!inSingleQuote) {
      if (ch === '(') depth++;
      else if (ch === ')') depth = Math.max(0, depth - 1);
      if (ch === ',' && depth === 0) {
        parts.push(current.trim());
        current = '';
        continue;
      }
      current += ch;
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function evaluateArithmeticExpression(expr: string, resolver: (token: string) => number | null): number | null {
  const cleaned = expr.trim();
  if (!cleaned) return null;

  const tokens: string[] = [];
  let i = 0;
  while (i < cleaned.length) {
    const ch = cleaned[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if ('+-*/()'.includes(ch)) {
      tokens.push(ch);
      i++;
      continue;
    }
    const start = i;
    let parenDepth = 0;
    while (i < cleaned.length) {
      const c = cleaned[i];
      if (c === '(') parenDepth++;
      else if (c === ')') {
        if (parenDepth > 0) parenDepth--;
        else break;
      } else if (parenDepth === 0 && /[\s+\-*/()]/.test(c)) {
        break;
      }
      i++;
    }
    tokens.push(cleaned.slice(start, i));
  }

  if (tokens.length === 0) return null;

  let pos = 0;
  let hadNull = false;

  function parsePrimary(): number {
    const tok = tokens[pos++];
    if (tok === undefined) return 0;
    if (tok === '(') {
      const val = parseAddSub();
      if (tokens[pos] === ')') pos++;
      return val;
    }
    if (tok === '-') {
      return -parsePrimary();
    }
    if (tok === '+') {
      return parsePrimary();
    }
    const num = Number(tok);
    if (!Number.isNaN(num) && tok.trim() !== '') {
      return num;
    }
    const resolved = resolver(tok);
    if (resolved === null || resolved === undefined || Number.isNaN(resolved)) {
      hadNull = true;
      return 0;
    }
    return resolved;
  }

  function parseMulDiv(): number {
    let left = parsePrimary();
    while (pos < tokens.length && (tokens[pos] === '*' || tokens[pos] === '/')) {
      const op = tokens[pos++];
      const right = parsePrimary();
      if (op === '*') {
        left = left * right;
      } else {
        if (right === 0) {
          hadNull = true;
          return 0;
        }
        left = left / right;
      }
    }
    return left;
  }

  function parseAddSub(): number {
    let left = parseMulDiv();
    while (pos < tokens.length && (tokens[pos] === '+' || tokens[pos] === '-')) {
      const op = tokens[pos++];
      const right = parseMulDiv();
      left = op === '+' ? left + right : left - right;
    }
    return left;
  }

  const result = parseAddSub();
  if (hadNull || !Number.isFinite(result)) return null;
  return Math.round(result * 10000) / 10000;
}

function getCaseInsensitiveProp(row: RowData, colName: string): CellValue {
  if (colName in row) return row[colName];
  const lower = colName.toLowerCase();
  for (const key of Object.keys(row)) {
    if (key.toLowerCase() === lower) return row[key];
  }
  return null;
}

function evaluateWhereClause(row: RowData, whereClause: string): boolean {
  if (!whereClause.trim()) return true;

  const orParts = whereClause.split(/\s+OR\s+/i);
  return orParts.some((orPart) => {
    const andParts = orPart.split(/\s+AND\s+/i);
    return andParts.every((cond) => evaluateSingleCondition(row, cond.trim()));
  });
}

function evaluateSingleCondition(row: RowData, cond: string): boolean {
  const cleaned = cond.replace(/^\(+|\)+$/g, '').trim();
  if (!cleaned) return true;

  const nullMatch = cleaned.match(/^([a-zA-Z0-9_]+)\s+IS\s+(NOT\s+)?NULL$/i);
  if (nullMatch) {
    const val = getCaseInsensitiveProp(row, nullMatch[1]);
    const isNull = val === null || val === undefined || val === '';
    return nullMatch[2] ? !isNull : isNull;
  }

  const inMatch = cleaned.match(/^([a-zA-Z0-9_]+)\s+(NOT\s+)?IN\s*\((.+)\)$/i);
  if (inMatch) {
    const colVal = getCaseInsensitiveProp(row, inMatch[1]);
    const isNotIn = Boolean(inMatch[2]);
    const rawItems = splitTopLevelCommas(inMatch[3]).map((item) =>
      item.replace(/^['"]|['"]$/g, '').trim().toLowerCase()
    );
    const target = colVal === null || colVal === undefined ? '' : String(colVal).toLowerCase();
    const matched = rawItems.includes(target);
    return isNotIn ? !matched : matched;
  }

  const likeMatch = cleaned.match(/^([a-zA-Z0-9_]+)\s+(NOT\s+)?LIKE\s+['"](.*)['"]$/i);
  if (likeMatch) {
    const colVal = getCaseInsensitiveProp(row, likeMatch[1]);
    const isNotLike = Boolean(likeMatch[2]);
    const pattern = likeMatch[3]
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/%/g, '.*')
      .replace(/_/g, '.');
    const regex = new RegExp(`^${pattern}$`, 'i');
    const matched = colVal !== null && regex.test(String(colVal));
    return isNotLike ? !matched : matched;
  }

  const opMatch = cleaned.match(/^([a-zA-Z0-9_]+)\s*(>=|<=|!=|<>|=|>|<)\s*(.+)$/);
  if (!opMatch) return true;

  const [, col, op, rawRight] = opMatch;
  const leftVal = getCaseInsensitiveProp(row, col);
  const rightStr = rawRight.trim().replace(/^['"]|['"]$/g, '');
  const rightNum = Number(rightStr);
  const isRightNumeric = !Number.isNaN(rightNum) && rawRight.trim() !== '' && !/^['"]/.test(rawRight.trim());

  if (leftVal === null || leftVal === undefined) {
    return false;
  }

  if (typeof leftVal === 'number' && isRightNumeric) {
    switch (op) {
      case '=': return leftVal === rightNum;
      case '!=':
      case '<>': return leftVal !== rightNum;
      case '>': return leftVal > rightNum;
      case '>=': return leftVal >= rightNum;
      case '<': return leftVal < rightNum;
      case '<=': return leftVal <= rightNum;
      default: return false;
    }
  }

  const leftStrLower = String(leftVal).toLowerCase();
  const rightStrLower = rightStr.toLowerCase();
  switch (op) {
    case '=': return leftStrLower === rightStrLower;
    case '!=':
    case '<>': return leftStrLower !== rightStrLower;
    case '>': return leftStrLower > rightStrLower;
    case '>=': return leftStrLower >= rightStrLower;
    case '<': return leftStrLower < rightStrLower;
    case '<=': return leftStrLower <= rightStrLower;
    default: return false;
  }
}

function computeAggregate(rows: RowData[], fnName: string, argExpr: string): number | null {
  const fn = fnName.toUpperCase();
  const arg = argExpr.trim();

  if (fn === 'COUNT') {
    if (arg === '*') return rows.length;
    return rows.filter((r) => {
      const val = getCaseInsensitiveProp(r, arg);
      return val !== null && val !== undefined && val !== '';
    }).length;
  }

  const nums: number[] = [];
  for (const r of rows) {
    const val = evaluateArithmeticExpression(arg, (tok) => {
      const cell = getCaseInsensitiveProp(r, tok);
      if (typeof cell === 'number') return cell;
      if (cell !== null && cell !== undefined && cell !== '' && !Number.isNaN(Number(cell))) {
        return Number(cell);
      }
      return null;
    });
    if (val !== null && Number.isFinite(val)) {
      nums.push(val);
    }
  }

  if (nums.length === 0) return null;

  switch (fn) {
    case 'SUM':
      return Math.round(nums.reduce((acc, n) => acc + n, 0) * 10000) / 10000;
    case 'AVG':
      return Math.round((nums.reduce((acc, n) => acc + n, 0) / nums.length) * 10000) / 10000;
    case 'MIN':
      return Math.min(...nums);
    case 'MAX':
      return Math.max(...nums);
    default:
      return null;
  }
}

export function runSqlQuery(rows: RowData[], sql: string): SqlExecutionResult {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  try {
    const normalizedSql = sql.replace(/;+\s*$/, '').replace(/\s+/g, ' ').trim();
    if (!normalizedSql) {
      return { columns: [], rows: [], executionTimeMs: 0, error: 'Empty SQL query.' };
    }

    if (!/^SELECT\s+/i.test(normalizedSql)) {
      return {
        columns: [],
        rows: [],
        executionTimeMs: 0,
        error: 'Only SELECT queries are permitted in QueryLens AI.'
      };
    }

    const clauseRegex =
      /^SELECT\s+(.+?)\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+(.+?))?(?:\s+GROUP\s+BY\s+(.+?))?(?:\s+ORDER\s+BY\s+(.+?))?(?:\s+LIMIT\s+(\d+))?$/i;

    const match = normalizedSql.match(clauseRegex);
    if (!match) {
      return {
        columns: [],
        rows: [],
        executionTimeMs: 0,
        error:
          'Unable to parse SQL syntax. Expected: SELECT <cols> FROM <table> [WHERE ...] [GROUP BY ...] [ORDER BY ...] [LIMIT n]'
      };
    }

    const [, selectClause, , whereClause = '', groupByClause = '', orderByClause = '', limitStr] = match;

    const filteredRows = whereClause ? rows.filter((r) => evaluateWhereClause(r, whereClause)) : [...rows];

    const rawSelectItems = splitTopLevelCommas(selectClause);
    interface SelectItem {
      expr: string;
      alias: string;
      hasAgg: boolean;
    }

    const selectItems: SelectItem[] = [];
    const aliasToExprMap: Record<string, string> = {};

    for (const item of rawSelectItems) {
      if (item === '*') {
        const sampleKeys = rows.length > 0 ? Object.keys(rows[0]) : [];
        for (const k of sampleKeys) {
          selectItems.push({ expr: k, alias: k, hasAgg: false });
          aliasToExprMap[k.toLowerCase()] = k;
        }
        continue;
      }

      const asMatch = item.match(/^(.+?)\s+AS\s+([a-zA-Z0-9_]+)$/i);
      let expr = item.trim();
      let alias = '';
      if (asMatch) {
        expr = asMatch[1].trim();
        alias = asMatch[2].trim();
      } else {
        const cleanAuto = expr
          .replace(/\(\*\)/g, '_all')
          .replace(/[^a-zA-Z0-9_]+/g, '_')
          .replace(/^_+|_+$/g, '')
          .toLowerCase();
        alias = /^[a-zA-Z0-9_]+$/.test(expr) ? expr : cleanAuto || 'metric';
      }

      const hasAgg = /\b(SUM|AVG|COUNT|MIN|MAX)\s*\(/i.test(expr);
      selectItems.push({ expr, alias, hasAgg });
      aliasToExprMap[alias.toLowerCase()] = expr;
    }

    const hasAnyAggregate = selectItems.some((s) => s.hasAgg);
    const groupByCols = groupByClause
      ? splitTopLevelCommas(groupByClause).map((g) => {
          const gClean = g.trim();
          const mappedExpr = aliasToExprMap[gClean.toLowerCase()];
          if (mappedExpr && !/\b(SUM|AVG|COUNT|MIN|MAX)\s*\(/i.test(mappedExpr)) {
            return mappedExpr;
          }
          return gClean;
        })
      : [];

    const evaluateSelectExprForGroup = (expr: string, groupRows: RowData[]): CellValue => {
      if (!/\b(SUM|AVG|COUNT|MIN|MAX)\s*\(/i.test(expr) && /^[a-zA-Z0-9_]+$/.test(expr)) {
        return groupRows.length > 0 ? getCaseInsensitiveProp(groupRows[0], expr) : null;
      }

      const pureAggMatch = expr.match(/^(SUM|AVG|COUNT|MIN|MAX)\s*\((.+)\)$/i);
      if (pureAggMatch && !/[+\-*/]/.test(expr.replace(/^(SUM|AVG|COUNT|MIN|MAX)\s*\(|\)$/gi, ''))) {
        return computeAggregate(groupRows, pureAggMatch[1], pureAggMatch[2]);
      }

      return evaluateArithmeticExpression(expr, (token) => {
        const aggTokMatch = token.match(/^(SUM|AVG|COUNT|MIN|MAX)\s*\((.+)\)$/i);
        if (aggTokMatch) {
          return computeAggregate(groupRows, aggTokMatch[1], aggTokMatch[2]);
        }
        if (groupRows.length === 0) return null;
        const val = getCaseInsensitiveProp(groupRows[0], token);
        if (typeof val === 'number') return val;
        if (val !== null && val !== undefined && val !== '' && !Number.isNaN(Number(val))) {
          return Number(val);
        }
        return null;
      });
    };

    let outputRows: RowData[] = [];

    if (groupByCols.length > 0) {
      const groups = new Map<string, RowData[]>();
      for (const r of filteredRows) {
        const keyParts = groupByCols.map((col) => {
          const val = getCaseInsensitiveProp(r, col);
          return val === null || val === undefined ? '__NULL__' : String(val);
        });
        const compositeKey = keyParts.join('|||');
        const bucket = groups.get(compositeKey);
        if (bucket) bucket.push(r);
        else groups.set(compositeKey, [r]);
      }

      for (const [, bucketRows] of groups.entries()) {
        const outRow: RowData = {};
        for (const item of selectItems) {
          outRow[item.alias] = evaluateSelectExprForGroup(item.expr, bucketRows);
        }
        outputRows.push(outRow);
      }
    } else if (hasAnyAggregate) {
      const outRow: RowData = {};
      for (const item of selectItems) {
        outRow[item.alias] = evaluateSelectExprForGroup(item.expr, filteredRows);
      }
      outputRows.push(outRow);
    } else {
      for (const r of filteredRows) {
        const outRow: RowData = {};
        for (const item of selectItems) {
          outRow[item.alias] = evaluateSelectExprForGroup(item.expr, [r]);
        }
        outputRows.push(outRow);
      }
    }

    if (orderByClause) {
      const orderSpecs = splitTopLevelCommas(orderByClause).map((part) => {
        const oMatch = part.trim().match(/^(.+?)(?:\s+(ASC|DESC))?$/i);
        return {
          field: oMatch ? oMatch[1].trim() : part.trim(),
          dir: oMatch && oMatch[2]?.toUpperCase() === 'DESC' ? -1 : 1
        };
      });

      outputRows.sort((a, b) => {
        for (const spec of orderSpecs) {
          const valA = getCaseInsensitiveProp(a, spec.field);
          const valB = getCaseInsensitiveProp(b, spec.field);

          if (valA === valB) continue;
          if (valA === null || valA === undefined) return 1;
          if (valB === null || valB === undefined) return -1;

          if (typeof valA === 'number' && typeof valB === 'number') {
            return (valA - valB) * spec.dir;
          }
          return String(valA).localeCompare(String(valB), undefined, { numeric: true }) * spec.dir;
        }
        return 0;
      });
    }

    if (limitStr) {
      const limitNum = parseInt(limitStr, 10);
      if (!Number.isNaN(limitNum) && limitNum >= 0) {
        outputRows = outputRows.slice(0, limitNum);
      }
    }

    const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    return {
      columns: selectItems.map((s) => s.alias),
      rows: outputRows,
      executionTimeMs: Math.max(1, Math.round((endTime - startTime) * 10) / 10)
    };
  } catch (err: unknown) {
    return {
      columns: [],
      rows: [],
      executionTimeMs: 0,
      error: err instanceof Error ? err.message : 'Unexpected SQL execution error.'
    };
  }
}

// ============================================================================
// SCHEMA INFERENCE, HEADER SANITIZATION & CHUNKED CSV PARSING
// ============================================================================

function sanitizeColumnName(raw: string): string {
  let cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (/^[0-9]/.test(cleaned)) {
    cleaned = `col_${cleaned}`;
  }
  return cleaned;
}

function inferSchema(rows: RowData[]): ColumnSchema[] {
  if (!rows || rows.length === 0) return [];
  const keys = Object.keys(rows[0]);
  const sampleSlice = rows.slice(0, 100);

  return keys.map((key) => {
    let numericCount = 0;
    let nonNullCount = 0;
    let sampleVal = 'NULL';

    for (const r of sampleSlice) {
      const v = r[key];
      if (v !== null && v !== undefined && v !== '') {
        if (sampleVal === 'NULL') sampleVal = String(v);
        nonNullCount++;
        if (typeof v === 'number' || !Number.isNaN(Number(v))) {
          numericCount++;
        }
      }
    }

    const isNumeric = nonNullCount > 0 && numericCount / nonNullCount >= 0.8;
    return {
      name: key,
      type: isNumeric ? 'NUMERIC' : 'TEXT',
      sample: sampleVal
    };
  });
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

async function parseCsvTextAsync(
  csvText: string,
  onProgress?: (parsedCount: number) => void
): Promise<RowData[]> {
  const lines = csvText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((l) => l.trim().length > 0);

  if (lines.length < 2) return [];

  const rawHeaders = parseCsvLine(lines[0]);
  const usedHeaders = new Set<string>();
  const sanitizedHeaders = rawHeaders.map((h, idx) => {
    const base = sanitizeColumnName(h) || `column_${idx + 1}`;
    let candidate = base;
    let suffix = 2;
    while (usedHeaders.has(candidate)) {
      candidate = `${base}_${suffix++}`;
    }
    usedHeaders.add(candidate);
    return candidate;
  });

  const parsedRows: RowData[] = [];
  const CHUNK_SIZE = 2500;

  for (let start = 1; start < lines.length; start += CHUNK_SIZE) {
    const end = Math.min(start + CHUNK_SIZE, lines.length);
    for (let i = start; i < end; i++) {
      const cells = parseCsvLine(lines[i]);
      const rowObj: RowData = {};
      for (let c = 0; c < sanitizedHeaders.length; c++) {
        const rawCell = cells[c] ?? '';
        if (rawCell === '' || rawCell.toLowerCase() === 'null' || rawCell.toLowerCase() === 'na') {
          rowObj[sanitizedHeaders[c]] = null;
        } else {
          const cleanNumStr = rawCell.replace(/[$,]/g, '');
          const numVal = Number(cleanNumStr);
          if (!Number.isNaN(numVal) && cleanNumStr !== '') {
            rowObj[sanitizedHeaders[c]] = numVal;
          } else {
            rowObj[sanitizedHeaders[c]] = rawCell;
          }
        }
      }
      parsedRows.push(rowObj);
    }

    if (onProgress) {
      onProgress(parsedRows.length);
    }

    if (end < lines.length) {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
  }

  return parsedRows;
}

function buildDynamicSampleChips(schema: ColumnSchema[], tableName: string): string[] {
  const cols = schema.map((c) => c.name);
  const hasDefaultCols =
    cols.includes('segment') &&
    cols.includes('region') &&
    cols.includes('quarter') &&
    cols.includes('attributed_revenue') &&
    cols.includes('ad_spend') &&
    cols.includes('churn_risk_score');

  if (hasDefaultCols && tableName === 'account_performance') {
    return DEFAULT_SAMPLE_QUESTIONS;
  }

  const numCols = schema.filter((c) => c.type === 'NUMERIC').map((c) => c.name);
  const textCols = schema.filter((c) => c.type === 'TEXT').map((c) => c.name);

  const primaryText = textCols[0];
  const secondaryText = textCols[1] || textCols[0];
  const primaryNum = numCols[0];
  const secondaryNum = numCols[1] || numCols[0];

  if (primaryText && primaryNum) {
    return [
      `Total ${primaryNum} by ${primaryText}`,
      `Average ${secondaryNum} across ${secondaryText}`,
      `Top 10 records by ${primaryNum}`,
      `Record count by ${primaryText}`
    ];
  }

  if (primaryNum) {
    return [
      `Summary statistics for ${primaryNum}`,
      `Top 10 highest ${primaryNum} rows`,
      `Average ${primaryNum} across ${tableName}`,
      `Preview first 15 rows of ${tableName}`
    ];
  }

  return [
    `Preview first 15 rows of ${tableName}`,
    `Count records by ${primaryText || 'all rows'}`,
    `Show distinct ${primaryText || 'columns'}`,
    `Inspect ${tableName} dataset`
  ];
}

// ============================================================================
// NATURAL-LANGUAGE QUERY GENERATOR (LIVE API + INTELLIGENT DEMO FALLBACK)
// ============================================================================

async function fetchWithBackoff(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  let delay = 1000;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, options);
    if (res.status !== 429 && res.status < 500) {
      return res;
    }
    if (attempt === maxRetries) return res;
    await new Promise((r) => setTimeout(r, delay));
    delay *= 2;
  }
  throw new Error('Network request failed after retries.');
}

async function generateQueryFromNL(
  question: string,
  schema: ColumnSchema[],
  tableName: string,
  sampleRows: RowData[],
  totalRowCount: number,
  liveConfig: LiveAiConfig
): Promise<QueryResponse> {
  const schemaSummary = schema.map((c) => `${c.name} (${c.type})`).join(', ');
  const previewPayload = sampleRows.slice(0, 5);

  const systemPrompt = `You are QueryLens AI, an executive analytics SQL engine.
Translate the user's natural-language question into a valid SQL SELECT query against table "${tableName}".
Table metadata:
- Total rows: ${totalRowCount}
- Columns & inferred types: ${schemaSummary}
- 5 sample rows (JSON): ${JSON.stringify(previewPayload)}

Rules for SQL:
- ONLY use standard SELECT, AS aliases, WHERE (=, !=, <, <=, >, >=, LIKE, IN, AND, OR), GROUP BY, SUM, AVG, COUNT, MIN, MAX, arithmetic (+, -, *, /), ORDER BY (ASC/DESC), and LIMIT.
- Do NOT use JOIN, subqueries, CTEs (WITH), HAVING, CASE WHEN, or window functions.
- Always alias aggregated expressions cleanly with AS (e.g., SUM(attributed_revenue) AS total_revenue).
- Use exact column names from the schema above.
- Output STRICT JSON matching:
  {
    "sql": "SELECT ...",
    "chartType": "bar" | "line",
    "xKey": "exact_output_column_for_x_axis",
    "yKey": "exact_output_numeric_column_for_y_axis",
    "executiveSummary": [
      "Bullet 1 with concrete insight",
      "Bullet 2 with comparison or driver",
      "Bullet 3 with actionable recommendation"
    ]
  }`;

  if (liveConfig.enabled && liveConfig.apiKey.trim()) {
    const trimmedKey = liveConfig.apiKey.trim();

    if (liveConfig.provider === 'gemini') {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${encodeURIComponent(
        trimmedKey
      )}`;

      const payload = {
        contents: [{ role: 'user', parts: [{ text: question }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              sql: { type: 'STRING' },
              chartType: { type: 'STRING', enum: ['bar', 'line'] },
              xKey: { type: 'STRING' },
              yKey: { type: 'STRING' },
              executiveSummary: {
                type: 'ARRAY',
                items: { type: 'STRING' }
              }
            },
            required: ['sql', 'chartType', 'xKey', 'yKey', 'executiveSummary']
          }
        }
      };

      const response = await fetchWithBackoff(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        throw new Error(
          `Gemini API error (${response.status}): ${errBody.slice(0, 180) || response.statusText}`
        );
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('Gemini API returned an empty response payload.');
      }

      const parsed = JSON.parse(rawText);
      const bullets: string[] = Array.isArray(parsed.executiveSummary)
        ? parsed.executiveSummary.filter((b: unknown) => typeof b === 'string' && b.trim()).slice(0, 3)
        : [];

      return {
        sql: String(parsed.sql || '').trim(),
        chartType: parsed.chartType === 'line' ? 'line' : 'bar',
        xKey: parsed.xKey ? String(parsed.xKey).trim() : undefined,
        yKey: parsed.yKey ? String(parsed.yKey).trim() : undefined,
        executiveSummary:
          bullets.length > 0
            ? bullets
            : ['Live Gemini query executed successfully against the active dataset.']
      };
    } else {
      const response = await fetchWithBackoff('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${trimmedKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: question }
          ],
          temperature: 0.1
        })
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        throw new Error(
          `OpenAI API error (${response.status}): ${errBody.slice(0, 180) || response.statusText}`
        );
      }

      const data = await response.json();
      const rawText = data?.choices?.[0]?.message?.content;
      if (!rawText) {
        throw new Error('OpenAI API returned an empty response payload.');
      }

      const parsed = JSON.parse(rawText);
      const bullets: string[] = Array.isArray(parsed.executiveSummary)
        ? parsed.executiveSummary.filter((b: unknown) => typeof b === 'string' && b.trim()).slice(0, 3)
        : [];

      return {
        sql: String(parsed.sql || '').trim(),
        chartType: parsed.chartType === 'line' ? 'line' : 'bar',
        xKey: parsed.xKey ? String(parsed.xKey).trim() : undefined,
        yKey: parsed.yKey ? String(parsed.yKey).trim() : undefined,
        executiveSummary:
          bullets.length > 0
            ? bullets
            : ['Live OpenAI query executed successfully against the active dataset.']
      };
    }
  }

  return buildLocalDemoQuery(question, schema, tableName);
}

function buildLocalDemoQuery(
  question: string,
  schema: ColumnSchema[],
  tableName: string
): QueryResponse {
  const q = question.toLowerCase();
  const cols = schema.map((c) => c.name);
  const hasDefaultCols =
    cols.includes('segment') &&
    cols.includes('region') &&
    cols.includes('quarter') &&
    cols.includes('attributed_revenue') &&
    cols.includes('ad_spend') &&
    cols.includes('churn_risk_score');

  if (hasDefaultCols) {
    if (q.includes('segment') && (q.includes('revenue') || q.includes('total'))) {
      return {
        sql: `SELECT segment, SUM(attributed_revenue) AS total_revenue, SUM(deals_closed) AS total_deals FROM ${tableName} GROUP BY segment ORDER BY total_revenue DESC`,
        executiveSummary: [
          'Enterprise leads all segments in attributed revenue, outperforming Mid-Market and SMB on deal value.',
          'Mid-Market delivers strong deal velocity with balanced acquisition spend efficiency.',
          'Prioritize Enterprise expansion playbooks while optimizing SMB conversion funnels.'
        ],
        chartType: 'bar',
        xKey: 'segment',
        yKey: 'total_revenue'
      };
    }
    if (q.includes('roas') || (q.includes('region') && q.includes('spend'))) {
      return {
        sql: `SELECT region, SUM(attributed_revenue) AS total_revenue, SUM(ad_spend) AS total_spend, SUM(attributed_revenue) / SUM(ad_spend) AS roas FROM ${tableName} GROUP BY region ORDER BY roas DESC`,
        executiveSummary: [
          'North America generates the highest absolute revenue volume across all active territories.',
          'APAC and EMEA demonstrate competitive Return on Ad Spend (ROAS) efficiency per dollar invested.',
          'Reallocate incremental paid media budget toward top-ROAS regional campaigns.'
        ],
        chartType: 'bar',
        xKey: 'region',
        yKey: 'roas'
      };
    }
    if (q.includes('quarter') || q.includes('trend') || q.includes('deals')) {
      return {
        sql: `SELECT quarter, SUM(attributed_revenue) AS quarterly_revenue, SUM(deals_closed) AS deals_closed FROM ${tableName} GROUP BY quarter ORDER BY quarter ASC`,
        executiveSummary: [
          'Attributed revenue scales steadily from Q1 through Q4, confirming strong second-half momentum.',
          'Q4 marks peak deal closure velocity as Enterprise procurement cycles finalize.',
          'Front-load pipeline generation in Q1/Q2 to smooth seasonal revenue concentration.'
        ],
        chartType: 'line',
        xKey: 'quarter',
        yKey: 'quarterly_revenue'
      };
    }
    if (q.includes('churn') || q.includes('risk') || q.includes('top 8') || q.includes('high-risk')) {
      return {
        sql: `SELECT account_name, segment, region, attributed_revenue, churn_risk_score FROM ${tableName} WHERE churn_risk_score >= 60 ORDER BY churn_risk_score DESC LIMIT 8`,
        executiveSummary: [
          'Several high-revenue accounts exhibit churn risk scores above 60, representing material ARR exposure.',
          'Elevated risk is concentrated among accounts with lower recent deal expansion velocity.',
          'Assign executive customer success sponsors to top-ranked at-risk accounts immediately.'
        ],
        chartType: 'bar',
        xKey: 'account_name',
        yKey: 'churn_risk_score'
      };
    }
  }

  const numericCols = schema.filter((c) => c.type === 'NUMERIC').map((c) => c.name);
  const textCols = schema.filter((c) => c.type === 'TEXT').map((c) => c.name);

  const matchedTextCol =
    textCols.find((col) => q.includes(col.toLowerCase().replace(/_/g, ' ')) || q.includes(col.toLowerCase())) ||
    textCols[0];
  const matchedNumCol =
    numericCols.find((col) => q.includes(col.toLowerCase().replace(/_/g, ' ')) || q.includes(col.toLowerCase())) ||
    numericCols[0];

  const isTopLimit = q.includes('top ') || q.includes('highest') || q.includes('limit');
  const isAvg = q.includes('average') || q.includes('avg') || q.includes('mean');
  const isCount = q.includes('count') || q.includes('how many');
  const isTrend = q.includes('trend') || q.includes('quarter') || q.includes('month') || q.includes('year') || q.includes('date');

  if (matchedTextCol && matchedNumCol && !isTopLimit) {
    const aggFn = isAvg ? 'AVG' : isCount ? 'COUNT' : 'SUM';
    const alias = isAvg ? `avg_${matchedNumCol}` : isCount ? 'record_count' : `total_${matchedNumCol}`;
    return {
      sql: `SELECT ${matchedTextCol}, ${aggFn}(${matchedNumCol}) AS ${alias}, COUNT(*) AS row_count FROM ${tableName} GROUP BY ${matchedTextCol} ORDER BY ${alias} DESC LIMIT 12`,
      executiveSummary: [
        `Aggregated ${aggFn}(${matchedNumCol}) grouped across distinct ${matchedTextCol} categories.`,
        `Top-performing ${matchedTextCol} cohorts drive the majority of cumulative volume.`,
        `Focus operational attention on leading ${matchedTextCol} segments while auditing underperformers.`
      ],
      chartType: isTrend ? 'line' : 'bar',
      xKey: matchedTextCol,
      yKey: alias
    };
  }

  if (matchedTextCol && matchedNumCol && isTopLimit) {
    return {
      sql: `SELECT ${matchedTextCol}, ${matchedNumCol} FROM ${tableName} ORDER BY ${matchedNumCol} DESC LIMIT 10`,
      executiveSummary: [
        `Ranked top 10 records in ${tableName} sorted descending by ${matchedNumCol}.`,
        `Clear separation exists between top-decile leaders and median entries.`,
        `Benchmark top-ranked ${matchedTextCol} records to replicate best practices.`
      ],
      chartType: 'bar',
      xKey: matchedTextCol,
      yKey: matchedNumCol
    };
  }

  if (matchedNumCol) {
    return {
      sql: `SELECT COUNT(*) AS total_rows, SUM(${matchedNumCol}) AS total_${matchedNumCol}, AVG(${matchedNumCol}) AS avg_${matchedNumCol}, MAX(${matchedNumCol}) AS max_${matchedNumCol} FROM ${tableName}`,
      executiveSummary: [
        `Computed portfolio-wide summary statistics for ${matchedNumCol} across ${tableName}.`,
        `Provides baseline total, mean, and peak bounds for executive benchmarking.`,
        `Segment by a categorical dimension to uncover variance drivers.`
      ],
      chartType: 'bar'
    };
  }

  return {
    sql: `SELECT * FROM ${tableName} LIMIT 15`,
    executiveSummary: [
      `Previewing the first 15 records from ${tableName} (${schema.length} columns detected).`,
      `All columns are indexed and ready for SQL aggregation or filtering.`,
      `Ask a grouped aggregation question or customize the SQL editor directly.`
    ],
    chartType: 'bar'
  };
}

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================

function QueryLensWorkspace() {
  // Application Data State
  const [tableName, setTableName] = useState<string>('account_performance');
  const [dataset, setDataset] = useState<RowData[]>(() => INITIAL_DATASET);
  const [originalDataset, setOriginalDataset] = useState<RowData[]>(() => INITIAL_DATASET);
  const [sampleQuestions, setSampleQuestions] = useState<string[]>(DEFAULT_SAMPLE_QUESTIONS);

  // Live AI Mode State (persisted safely in sessionStorage)
  const [liveAiConfig, setLiveAiConfig] = useState<LiveAiConfig>(() => {
    const savedEnabled = safeSessionGet('querylens_live_enabled') === 'true';
    const savedProvider = (safeSessionGet('querylens_live_provider') as LlmProvider) || 'gemini';
    const savedKey = safeSessionGet('querylens_live_apikey') || '';
    return {
      enabled: savedEnabled && Boolean(savedKey.trim()),
      provider: savedProvider === 'openai' ? 'openai' : 'gemini',
      apiKey: savedKey
    };
  });

  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [draftProvider, setDraftProvider] = useState<LlmProvider>('gemini');
  const [draftApiKey, setDraftApiKey] = useState<string>('');
  const [draftLiveEnabled, setDraftLiveEnabled] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Query & Execution State
  const [question, setQuestion] = useState<string>(DEFAULT_SAMPLE_QUESTIONS[0]);
  const [sqlText, setSqlText] = useState<string>('');
  const [sqlResult, setSqlResult] = useState<SqlExecutionResult>({
    columns: [],
    rows: [],
    executionTimeMs: 0
  });
  const [takeawayBullets, setTakeawayBullets] = useState<string[]>([]);
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [preferredXKey, setPreferredXKey] = useState<string | undefined>(undefined);
  const [preferredYKey, setPreferredYKey] = useState<string | undefined>(undefined);
  const [liveAiError, setLiveAiError] = useState<string | null>(null);

  // UI & Layout State (Schema sidebar collapsed on mobile < 768px, visible on desktop)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const [isSqlOpen, setIsSqlOpen] = useState<boolean>(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // CSV Chunked Ingestion State
  const [isParsingCsv, setIsParsingCsv] = useState<boolean>(false);
  const [csvParsedCount, setCsvParsedCount] = useState<number>(0);

  // Results Table Pagination State (25 rows per page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 25;

  // Edit Headers Workflow State
  const [isEditingHeaders, setIsEditingHeaders] = useState<boolean>(false);
  const [headerDrafts, setHeaderDrafts] = useState<Record<string, string>>({});
  const [headerError, setHeaderError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  }, []);

  const schema = useMemo(() => inferSchema(dataset), [dataset]);

  const hasRenamedHeaders = useMemo(() => {
    if (dataset.length === 0 || originalDataset.length === 0) return false;
    const curKeys = Object.keys(dataset[0]);
    const origKeys = Object.keys(originalDataset[0]);
    if (curKeys.length !== origKeys.length) return true;
    return curKeys.some((k, idx) => k !== origKeys[idx]);
  }, [dataset, originalDataset]);

  // Core Question Execution Pipeline
  const handleAskQuestion = useCallback(
    async (
      targetQuestion: string,
      activeDataset: RowData[] = dataset,
      activeTable: string = tableName,
      overrideLiveConfig?: LiveAiConfig
    ) => {
      if (!targetQuestion.trim()) return;
      setIsLoading(true);
      setQuestion(targetQuestion);
      setCurrentPage(1);
      setLiveAiError(null);

      const effectiveConfig = overrideLiveConfig || liveAiConfig;

      try {
        const currentSchema = inferSchema(activeDataset);
        const response = await generateQueryFromNL(
          targetQuestion,
          currentSchema,
          activeTable,
          activeDataset.slice(0, 5),
          activeDataset.length,
          effectiveConfig
        );

        const execResult = runSqlQuery(activeDataset, response.sql);
        setSqlText(response.sql);
        setSqlResult(execResult);
        setChartType(response.chartType);
        setPreferredXKey(response.xKey);
        setPreferredYKey(response.yKey);

        if (execResult.error) {
          setLiveAiError(`Generated SQL failed execution: ${execResult.error}`);
          setTakeawayBullets([
            'The generated SQL query encountered an execution error against the current schema.',
            'Inspect the SQL editor below or click "Reset to Demo Query" to restore a verified query.'
          ]);
        } else if (response.executiveSummary && response.executiveSummary.length > 0) {
          setTakeawayBullets(response.executiveSummary);
        } else if (response.takeaway) {
          setTakeawayBullets([response.takeaway]);
        } else {
          setTakeawayBullets([
            `Query executed in ${execResult.executionTimeMs}ms across ${activeDataset.length.toLocaleString()} rows.`
          ]);
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Unexpected error generating AI query.';
        setLiveAiError(errMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [dataset, tableName, liveAiConfig]
  );

  // Reset back to a guaranteed local Demo Mode query if Live AI fails
  const handleResetToDemoQuery = async () => {
    const demoConfig: LiveAiConfig = {
      ...liveAiConfig,
      enabled: false
    };
    setLiveAiConfig(demoConfig);
    safeSessionSet('querylens_live_enabled', 'false');
    setLiveAiError(null);
    const fallbackQuestion = sampleQuestions[0] || DEFAULT_SAMPLE_QUESTIONS[0];
    showToast('Switched to Demo Mode & restored verified query');
    await handleAskQuestion(fallbackQuestion, dataset, tableName, demoConfig);
  };

  // Open Live API Modal
  const openAiSettingsModal = () => {
    setDraftProvider(liveAiConfig.provider);
    setDraftApiKey(liveAiConfig.apiKey);
    setDraftLiveEnabled(liveAiConfig.enabled);
    setModalError(null);
    setIsAiModalOpen(true);
  };

  // Save Live AI Settings to sessionStorage
  const handleSaveAiSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (draftLiveEnabled && !draftApiKey.trim()) {
      setModalError('Please paste a valid API key before enabling Live AI Mode.');
      return;
    }
    const nextConfig: LiveAiConfig = {
      enabled: draftLiveEnabled,
      provider: draftProvider,
      apiKey: draftApiKey.trim()
    };
    setLiveAiConfig(nextConfig);
    safeSessionSet('querylens_live_enabled', String(nextConfig.enabled));
    safeSessionSet('querylens_live_provider', nextConfig.provider);
    if (nextConfig.apiKey) {
      safeSessionSet('querylens_live_apikey', nextConfig.apiKey);
    } else {
      safeSessionRemove('querylens_live_apikey');
    }
    setIsAiModalOpen(false);
    setLiveAiError(null);
    showToast(
      nextConfig.enabled
        ? `Live AI Mode enabled (${nextConfig.provider === 'gemini' ? 'Google Gemini' : 'OpenAI'})`
        : 'Demo Mode active (offline SQL engine)'
    );
  };

  // Auto-run first sample question on initial mount
  useEffect(() => {
    handleAskQuestion(DEFAULT_SAMPLE_QUESTIONS[0], INITIAL_DATASET, 'account_performance');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Direct Editable SQL Execution Handler
  const handleRunEditedSql = () => {
    if (!sqlText.trim()) return;
    setCurrentPage(1);
    setLiveAiError(null);
    setPreferredXKey(undefined);
    setPreferredYKey(undefined);
    const execResult = runSqlQuery(dataset, sqlText);
    setSqlResult(execResult);
    if (!execResult.error) {
      setTakeawayBullets([
        `Custom SQL query executed in ${execResult.executionTimeMs}ms across ${dataset.length.toLocaleString()} source rows.`,
        `Returned ${execResult.rows.length.toLocaleString()} result row${execResult.rows.length === 1 ? '' : 's'} spanning ${execResult.columns.length} column${execResult.columns.length === 1 ? '' : 's'}.`
      ]);
    }
  };

  // Copy SQL to Clipboard (iFrame safe)
  const handleCopySql = () => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = sqlText;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedSql(true);
      showToast('SQL query copied to clipboard');
      setTimeout(() => setCopiedSql(false), 2000);
    } catch {
      showToast('Unable to copy SQL');
    }
  };

  // Upload CSV Handler (Chunked async parsing for 10,000+ rows)
  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const cleanTable = sanitizeColumnName(file.name.replace(/\.csv$/i, '')) || 'uploaded_data';
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = String(e.target?.result || '');
      setIsParsingCsv(true);
      setCsvParsedCount(0);

      try {
        const parsed = await parseCsvTextAsync(text, (count) => {
          setCsvParsedCount(count);
        });

        if (parsed.length === 0) {
          showToast('CSV file appeared empty or invalid');
          return;
        }

        setTableName(cleanTable);
        setDataset(parsed);
        setOriginalDataset(parsed.map((r) => ({ ...r })));
        setIsEditingHeaders(false);
        setHeaderError(null);
        setLiveAiError(null);
        setCurrentPage(1);

        const newSchema = inferSchema(parsed);
        const dynamicChips = buildDynamicSampleChips(newSchema, cleanTable);
        setSampleQuestions(dynamicChips);

        showToast(`Loaded ${parsed.length.toLocaleString()} rows into "${cleanTable}"`);
        await handleAskQuestion(dynamicChips[0], parsed, cleanTable);
      } finally {
        setIsParsingCsv(false);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Toggle Edit Headers Mode
  const handleToggleEditHeaders = () => {
    if (!isEditingHeaders) {
      const initialDrafts: Record<string, string> = {};
      schema.forEach((col) => {
        initialDrafts[col.name] = col.name;
      });
      setHeaderDrafts(initialDrafts);
      setHeaderError(null);
      setIsEditingHeaders(true);
    } else {
      setIsEditingHeaders(false);
      setHeaderError(null);
    }
  };

  // Apply Renamed Headers
  const handleApplyHeaderChanges = () => {
    const sanitizedMapping: Record<string, string> = {};
    const seenNames = new Set<string>();

    for (const col of schema) {
      const rawInput = headerDrafts[col.name] ?? col.name;
      const sanitized = sanitizeColumnName(rawInput);

      if (!sanitized) {
        setHeaderError(`Column "${col.name}" cannot have an empty name.`);
        return;
      }
      if (seenNames.has(sanitized)) {
        setHeaderError(`Duplicate column name "${sanitized}" detected. Each header must be unique.`);
        return;
      }
      seenNames.add(sanitized);
      sanitizedMapping[col.name] = sanitized;
    }

    const remappedRows: RowData[] = dataset.map((row) => {
      const nextRow: RowData = {};
      for (const oldKey of Object.keys(row)) {
        const newKey = sanitizedMapping[oldKey] || oldKey;
        nextRow[newKey] = row[oldKey];
      }
      return nextRow;
    });

    setDataset(remappedRows);
    setIsEditingHeaders(false);
    setHeaderError(null);
    setLiveAiError(null);
    setPreferredXKey(undefined);
    setPreferredYKey(undefined);
    setSqlResult((prev) => ({ ...prev, error: undefined }));

    const updatedSchema = inferSchema(remappedRows);
    const updatedChips = buildDynamicSampleChips(updatedSchema, tableName);
    setSampleQuestions(updatedChips);
    setQuestion(updatedChips[0]);

    showToast('Column headers updated & sample prompts refreshed');
  };

  // Reset Original Headers Handler
  const handleResetOriginalHeaders = () => {
    const restoredRows = originalDataset.map((r) => ({ ...r }));
    setDataset(restoredRows);
    setIsEditingHeaders(false);
    setHeaderError(null);
    setLiveAiError(null);
    setPreferredXKey(undefined);
    setPreferredYKey(undefined);
    setSqlResult((prev) => ({ ...prev, error: undefined }));

    const restoredSchema = inferSchema(restoredRows);
    const restoredChips = buildDynamicSampleChips(restoredSchema, tableName);
    setSampleQuestions(restoredChips);
    setQuestion(restoredChips[0]);

    showToast('Original headers restored');
  };

  // Download Current Result Set as CSV
  const handleDownloadResultCsv = () => {
    if (!sqlResult.columns.length || !sqlResult.rows.length) return;

    const escapeCsvCell = (val: CellValue): string => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headerLine = sqlResult.columns.map(escapeCsvCell).join(',');
    const bodyLines = sqlResult.rows.map((row) =>
      sqlResult.columns.map((col) => escapeCsvCell(row[col])).join(',')
    );
    const csvContent = [headerLine, ...bodyLines].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${tableName}_query_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Exported ${sqlResult.rows.length.toLocaleString()} rows to CSV`);
  };

  // Export Executive Brief as a clean Markdown file
  const handleExportBriefMarkdown = () => {
    const timestamp = new Date().toLocaleString();
    const modeLabel = liveAiConfig.enabled
      ? `Live AI (${liveAiConfig.provider === 'gemini' ? 'Google Gemini' : 'OpenAI'})`
      : 'Demo Mode (Built-In SQL Engine)';

    const bulletsMarkdown =
      takeawayBullets.length > 0
        ? takeawayBullets.map((b) => `- ${b}`).join('\n')
        : '- No executive summary available.';

    const markdownLines = [
      `# QueryLens AI — Executive Analytics Brief`,
      ``,
      `- **Created By:** ${CREATOR_NAME}`,
      `- **Dataset:** \`${tableName}\` (${dataset.length.toLocaleString()} rows)`,
      `- **Engine Mode:** ${modeLabel}`,
      `- **Generated:** ${timestamp}`,
      ``,
      `## Analytical Question`,
      `> ${question}`,
      ``,
      `## Executive Key Findings`,
      bulletsMarkdown,
      ``,
      `## Executed SQL Query`,
      '```sql',
      sqlText.trim() || '-- No SQL query recorded',
      '```',
      ``,
      `## Result Metrics`,
      `- **Rows Returned:** ${sqlResult.rows.length.toLocaleString()}`,
      `- **Execution Time:** ${sqlResult.executionTimeMs}ms`,
      ``
    ];

    const blob = new Blob([markdownLines.join('\n')], {
      type: 'text/markdown;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${tableName}_executive_brief.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Downloaded Executive Brief (.md)');
  };

  // Derive Chart Configuration safely: aggregates duplicates & caps high-cardinality categories
  const chartConfig = useMemo(() => {
    if (!sqlResult.rows || sqlResult.rows.length === 0 || sqlResult.columns.length < 2) {
      return null;
    }

    const cols = sqlResult.columns;
    const xAxisKey =
      (preferredXKey && cols.includes(preferredXKey) ? preferredXKey : null) ||
      cols.find((col) => {
        const sampleVal = sqlResult.rows.find((r) => r[col] !== null)?.[col];
        return typeof sampleVal === 'string';
      }) ||
      cols[0];

    const numericSeries = cols.filter((col) => {
      if (col === xAxisKey) return false;
      return sqlResult.rows.some(
        (r) => typeof r[col] === 'number' && Number.isFinite(r[col] as number)
      );
    });

    if (numericSeries.length === 0) return null;

    let orderedSeries = [...numericSeries];
    if (preferredYKey && orderedSeries.includes(preferredYKey)) {
      orderedSeries = [preferredYKey, ...orderedSeries.filter((c) => c !== preferredYKey)];
    }

    const activeSeries = orderedSeries.slice(0, 2);
    const MAX_CHART_CATEGORIES = 15;

    const groupedMap = new Map<string, Record<string, number>>();
    for (const row of sqlResult.rows) {
      const rawCat = row[xAxisKey];
      const catLabel =
        rawCat === null || rawCat === undefined || String(rawCat).trim() === ''
          ? 'Unknown'
          : String(rawCat);

      let entry = groupedMap.get(catLabel);
      if (!entry) {
        entry = {};
        for (const s of activeSeries) entry[s] = 0;
        groupedMap.set(catLabel, entry);
      }

      for (const s of activeSeries) {
        const val = row[s];
        if (typeof val === 'number' && Number.isFinite(val)) {
          entry[s] += val;
        }
      }
    }

    const aggregatedEntries = Array.from(groupedMap.entries()).map(([cat, metrics]) => ({
      [xAxisKey]: cat,
      ...metrics
    }));

    let finalChartData = aggregatedEntries;
    let isCapped = false;

    if (aggregatedEntries.length > MAX_CHART_CATEGORIES) {
      isCapped = true;
      const primaryMetric = activeSeries[0];
      const sorted = [...aggregatedEntries].sort(
        (a, b) => Number(b[primaryMetric] ?? 0) - Number(a[primaryMetric] ?? 0)
      );
      const topSlice = sorted.slice(0, MAX_CHART_CATEGORIES - 1);
      const tailSlice = sorted.slice(MAX_CHART_CATEGORIES - 1);

      const otherBucket: Record<string, string | number> = {
        [xAxisKey]: `Other (${tailSlice.length.toLocaleString()})`
      };
      for (const s of activeSeries) {
        otherBucket[s] =
          Math.round(
            tailSlice.reduce((sum, item) => sum + Number(item[s] ?? 0), 0) * 100
          ) / 100;
      }

      finalChartData = [...topSlice, otherBucket];
    }

    return {
      xAxisKey,
      series: activeSeries,
      data: finalChartData,
      isCapped,
      totalUniqueCategories: groupedMap.size
    };
  }, [sqlResult, preferredXKey, preferredYKey]);

  // Paginated slice of SQL results (25 rows per page)
  const totalPages = Math.max(1, Math.ceil(sqlResult.rows.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedRows = useMemo(() => {
    const startIdx = (safeCurrentPage - 1) * PAGE_SIZE;
    return sqlResult.rows.slice(startIdx, startIdx + PAGE_SIZE);
  }, [sqlResult.rows, safeCurrentPage]);

  const formatCellDisplay = (val: CellValue): string => {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') {
      if (Number.isInteger(val)) return val.toLocaleString();
      return val.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
    return String(val);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAskQuestion(question);
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Application Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Schema Sidebar Toggle Button */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            aria-label="Toggle Schema Explorer"
            className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Menu className="w-4 h-4" />
            <span className="hidden md:inline text-xs font-medium">Schema</span>
          </button>

          {/* Brand Title & Locked Creator Badge */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-lg font-bold tracking-tight text-slate-900 leading-none truncate">
                  QueryLens AI
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] sm:text-[11px] font-semibold">
                  Created by {CREATOR_NAME}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block mt-0.5">
                Executive NL-to-SQL Analytics
              </p>
            </div>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Interactive Demo Mode / Live API Pill */}
          <button
            type="button"
            onClick={openAiSettingsModal}
            title="Configure Live AI Provider (Gemini / OpenAI) or Demo Mode"
            className={`px-2.5 sm:px-3 py-1.5 rounded-full border text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs ${
              liveAiConfig.enabled
                ? 'bg-indigo-50 hover:bg-indigo-100 border-indigo-300 text-indigo-800'
                : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                liveAiConfig.enabled ? 'bg-indigo-600 animate-pulse' : 'bg-emerald-500'
              }`}
            />
            {liveAiConfig.enabled ? <span>Live API</span> : <span>Demo Mode</span>}
          </button>

          {/* Upload CSV Button + Chunk Loading Indicator */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleCsvUpload}
            className="hidden"
          />
          <button
            type="button"
            disabled={isParsingCsv}
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 sm:px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
          >
            {isParsingCsv ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{csvParsedCount.toLocaleString()}...</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>Upload CSV</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 flex relative w-full">
        {/* Mobile Backdrop for Collapsible Sidebar */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/30 z-20 md:hidden"
          />
        )}

        {/* Collapsible Schema Explorer Sidebar */}
        {isSidebarOpen && (
          <aside className="fixed md:static inset-y-0 left-0 z-20 w-72 sm:w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 shadow-lg md:shadow-none pt-14 md:pt-0">
            {/* Schema Explorer Header with Edit Headers Toggle */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <Database className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>Schema Explorer</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-800 font-mono truncate">
                    {tableName}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold shrink-0">
                    {dataset.length.toLocaleString()} rows
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleToggleEditHeaders}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors ${
                    isEditingHeaders
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{isEditingHeaders ? 'Cancel' : 'Edit Headers'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Inline Header Validation Error */}
            {isEditingHeaders && headerError && (
              <div className="mx-3 mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{headerError}</span>
              </div>
            )}

            {/* Column List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {schema.map((col) => {
                const draftVal = headerDrafts[col.name] ?? col.name;
                const sanitizedPreview = sanitizeColumnName(draftVal);

                return (
                  <div
                    key={col.name}
                    className={`p-2.5 rounded-xl border transition-colors ${
                      isEditingHeaders
                        ? 'bg-indigo-50/40 border-indigo-200'
                        : 'bg-slate-50/80 hover:bg-indigo-50/50 border-slate-100 hover:border-indigo-100'
                    }`}
                  >
                    {isEditingHeaders ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={draftVal}
                            onChange={(e) => {
                              setHeaderDrafts((prev) => ({
                                ...prev,
                                [col.name]: e.target.value
                              }));
                              if (headerError) setHeaderError(null);
                            }}
                            placeholder="column_name"
                            className="flex-1 min-w-0 px-2 py-1 rounded-lg border border-slate-300 bg-white text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                          />
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                              col.type === 'NUMERIC'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-sky-100 text-sky-800'
                            }`}
                          >
                            {col.type}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono px-0.5">
                          <span>SQL key:</span>
                          <span
                            className={
                              sanitizedPreview ? 'text-indigo-700 font-semibold' : 'text-rose-600'
                            }
                          >
                            {sanitizedPreview || '(invalid)'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-mono font-semibold text-slate-800 truncate">
                            {col.name}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                              col.type === 'NUMERIC'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-sky-100 text-sky-800'
                            }`}
                          >
                            {col.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-1">
                          e.g. <span className="text-slate-600">{col.sample}</span>
                        </p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Edit Headers Action Bar or Quick Preview Footer */}
            <div className="p-3.5 border-t border-slate-200 bg-slate-50/70 space-y-2">
              {isEditingHeaders ? (
                <>
                  <button
                    type="button"
                    onClick={handleApplyHeaderChanges}
                    className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply Changes</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetOriginalHeaders}
                    className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Original Headers</span>
                  </button>
                </>
              ) : (
                <>
                  {hasRenamedHeaders && (
                    <button
                      type="button"
                      onClick={handleResetOriginalHeaders}
                      className="w-full py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Original Headers</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsPreviewOpen(true)}
                    className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Quick Preview Rows</span>
                  </button>
                </>
              )}
            </div>
          </aside>
        )}

        {/* Main Analytics Workspace */}
        <main className="flex-1 min-w-0 p-3 sm:p-6 max-w-7xl mx-auto w-full space-y-5">
          {/* CSV Ingestion Progress Banner */}
          {isParsingCsv && (
            <div className="rounded-2xl bg-indigo-50 border border-indigo-200 px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-indigo-800 text-xs font-semibold">
                <span className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin shrink-0" />
                <span>
                  Streaming CSV in non-blocking batches... {csvParsedCount.toLocaleString()} rows processed
                </span>
              </div>
              <span className="text-[11px] font-mono bg-white px-2.5 py-0.5 rounded-full text-indigo-700 border border-indigo-200">
                Chunked Loader
              </span>
            </div>
          )}

          {/* Natural-Language Question Bar & Sample Chips */}
          <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3.5">
            <form onSubmit={handleFormSubmit} className="relative">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask an analytical question in plain English..."
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-slate-300 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-sm text-slate-800 placeholder:text-slate-400 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !question.trim()}
                  className="px-5 py-2.5 sm:py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all shrink-0"
                >
                  {isLoading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>{liveAiConfig.enabled ? 'Ask Live AI' : 'Ask QueryLens'}</span>
                </button>
              </div>
            </form>

            {/* 4 Clickable Sample Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-1">
                Try:
              </span>
              {sampleQuestions.map((chip) => {
                const isActive = question.trim().toLowerCase() === chip.trim().toLowerCase();
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleAskQuestion(chip)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all text-left ${
                      isActive
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Live AI Error Recovery Banner */}
          {liveAiError && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-2.5 text-rose-800">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm">
                  <p className="font-bold">Live AI Query Error</p>
                  <p className="text-rose-700 mt-0.5 break-words">{liveAiError}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResetToDemoQuery}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs shrink-0 self-start sm:self-center transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Demo Query</span>
              </button>
            </div>
          )}

          {/* Executive Takeaway Card (Top of Results + Export Brief Button) */}
          <section className="rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 text-white p-5 sm:p-6 shadow-md border border-indigo-500/30">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0 mt-0.5">
                <TrendingUp className="w-5 h-5 text-indigo-100" />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-100">
                      Executive Takeaway
                    </span>
                    <span className="text-[11px] font-mono bg-white/15 px-2.5 py-0.5 rounded-full text-indigo-50">
                      {sqlResult.executionTimeMs}ms • {sqlResult.rows.length.toLocaleString()} rows
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleExportBriefMarkdown}
                    className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Export Brief</span>
                  </button>
                </div>

                {takeawayBullets.length > 1 ? (
                  <ul className="space-y-1.5 text-sm sm:text-[15px] leading-relaxed font-medium text-white/95">
                    {takeawayBullets.map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-indigo-200 font-bold select-none">•</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm sm:text-base leading-relaxed font-medium text-white/95">
                    {takeawayBullets[0] ||
                      'Analyzing dataset metrics to surface executive insights...'}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Toggleable Generated SQL Card */}
          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsSqlOpen((prev) => !prev)}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-indigo-600 transition-colors"
              >
                <Code className="w-4 h-4 text-indigo-600" />
                <span>Generated SQL</span>
                <ChevronRight
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    isSqlOpen ? 'rotate-90' : ''
                  }`}
                />
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleRunEditedSql}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Run SQL</span>
                </button>
              </div>
            </div>

            {isSqlOpen && (
              <div className="p-3.5 bg-slate-900">
                <textarea
                  value={sqlText}
                  onChange={(e) => setSqlText(e.target.value)}
                  rows={3}
                  spellCheck={false}
                  aria-label="Editable SQL query"
                  className="w-full bg-transparent text-emerald-300 font-mono text-xs sm:text-sm focus:outline-none resize-y leading-relaxed"
                />
              </div>
            )}

            {sqlResult.error && (
              <div className="p-3.5 bg-rose-50 border-t border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{sqlResult.error}</span>
              </div>
            )}
          </section>

          {/* Dynamic Recharts Visualization (Aggregated & High-Cardinality Protected) */}
          {chartConfig && !sqlResult.error && (
            <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-sm font-bold text-slate-800">Visual Breakdown</h2>
                  {chartConfig.isCapped && (
                    <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                      Top 14 of {chartConfig.totalUniqueCategories.toLocaleString()} categories + Other
                    </span>
                  )}
                </div>

                {/* Chart Type Switcher */}
                <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setChartType('bar')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      chartType === 'bar'
                        ? 'bg-white text-indigo-600 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Bar
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartType('line')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      chartType === 'line'
                        ? 'bg-white text-indigo-600 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Line
                  </button>
                </div>
              </div>

              <div className="w-full h-72 sm:h-80">
                <ResponsiveContainer width="100%" height={300}>
                  {chartType === 'line' ? (
                    <LineChart data={chartConfig.data} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey={chartConfig.xAxisKey}
                        tick={{ fontSize: 11, fill: '#475569' }}
                        tickMargin={8}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#475569' }}
                        tickFormatter={(val) =>
                          typeof val === 'number'
                            ? val >= 1000
                              ? `${(val / 1000).toFixed(0)}k`
                              : String(val)
                            : String(val)
                        }
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          borderColor: '#e2e8f0',
                          fontSize: '12px'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                      {chartConfig.series.map((serie, idx) => (
                        <Line
                          key={serie}
                          type="monotone"
                          dataKey={serie}
                          stroke={idx === 0 ? '#4f46e5' : '#10b981'}
                          strokeWidth={2.5}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      ))}
                    </LineChart>
                  ) : (
                    <BarChart data={chartConfig.data} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey={chartConfig.xAxisKey}
                        tick={{ fontSize: 11, fill: '#475569' }}
                        tickMargin={8}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#475569' }}
                        tickFormatter={(val) =>
                          typeof val === 'number'
                            ? val >= 1000
                              ? `${(val / 1000).toFixed(0)}k`
                              : String(val)
                            : String(val)
                        }
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          borderColor: '#e2e8f0',
                          fontSize: '12px'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                      {chartConfig.series.map((serie, idx) => (
                        <Bar
                          key={serie}
                          dataKey={serie}
                          fill={idx === 0 ? '#4f46e5' : '#10b981'}
                          radius={[6, 6, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {/* Paginated Results Data Table + CSV Download */}
          {!sqlResult.error && (
            <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Query Results
                  </h2>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {sqlResult.rows.length.toLocaleString()} total row{sqlResult.rows.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={sqlResult.rows.length === 0}
                    onClick={handleDownloadResultCsv}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Download CSV</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/60">
                      {sqlResult.columns.map((col) => (
                        <th
                          key={col}
                          className="py-2.5 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                    {paginatedRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={Math.max(1, sqlResult.columns.length)}
                          className="py-8 text-center text-slate-400 text-xs"
                        >
                          No matching rows returned for this query.
                        </td>
                      </tr>
                    ) : (
                      paginatedRows.map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          className="hover:bg-indigo-50/30 transition-colors"
                        >
                          {sqlResult.columns.map((col) => {
                            const val = row[col];
                            const isNum = typeof val === 'number';
                            return (
                              <td
                                key={col}
                                className={`py-2.5 px-4 whitespace-nowrap ${
                                  isNum
                                    ? 'font-mono text-slate-800 font-medium'
                                    : val === null
                                    ? 'text-slate-400 italic'
                                    : 'text-slate-700'
                                }`}
                              >
                                {formatCellDisplay(val)}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls Footer (25 rows per page) */}
              {sqlResult.rows.length > 0 && (
                <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                  <div>
                    Showing{' '}
                    <span className="font-semibold text-slate-900">
                      {((safeCurrentPage - 1) * PAGE_SIZE + 1).toLocaleString()}
                    </span>
                    –
                    <span className="font-semibold text-slate-900">
                      {Math.min(safeCurrentPage * PAGE_SIZE, sqlResult.rows.length).toLocaleString()}
                    </span>{' '}
                    of{' '}
                    <span className="font-semibold text-slate-900">
                      {sqlResult.rows.length.toLocaleString()}
                    </span>{' '}
                    rows (25/page)
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={safeCurrentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none font-semibold text-slate-700 flex items-center gap-1 transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Prev</span>
                    </button>

                    <span className="px-2.5 py-1 font-mono text-xs font-semibold text-slate-700">
                      Page {safeCurrentPage.toLocaleString()} of {totalPages.toLocaleString()}
                    </span>

                    <button
                      type="button"
                      disabled={safeCurrentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none font-semibold text-slate-700 flex items-center gap-1 transition-colors"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      {/* Persistent Locked Developer / Creator Footer Bar */}
      <footer className="bg-white border-t border-slate-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800">QueryLens AI</span>
          <span>•</span>
          <span>
            Developed &amp; Created by{' '}
            <strong className="text-indigo-700 font-bold">{CREATOR_NAME}</strong>
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          © {new Date().getFullYear()} {CREATOR_NAME}. All rights reserved.
        </span>
      </footer>

      {/* Quick Preview Rows Modal */}
      {isPreviewOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Quick Preview: <span className="font-mono text-indigo-600">{tableName}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showing first 10 of {dataset.length.toLocaleString()} rows
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 sticky top-0">
                    {schema.map((col) => (
                      <th
                        key={col.name}
                        className="py-2.5 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap"
                      >
                        {col.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {dataset.slice(0, 10).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      {schema.map((col) => (
                        <td
                          key={col.name}
                          className="py-2 px-3.5 whitespace-nowrap text-slate-700 font-mono"
                        >
                          {formatCellDisplay(row[col.name])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Live AI Mode Configuration Modal */}
      {isAiModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsAiModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">AI Engine & API Settings</h3>
                  <p className="text-xs text-slate-500">
                    Switch between Demo Mode and Live LLM SQL generation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAiSettings} className="p-5 space-y-4">
              {/* Live Mode Toggle Switch */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {draftLiveEnabled ? 'Live AI Mode Enabled' : 'Demo Mode (Built-In Engine)'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {draftLiveEnabled
                      ? 'Generates SQL & 3-bullet briefs via live LLM'
                      : 'Works offline with zero external API calls'}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={draftLiveEnabled}
                  onClick={() => {
                    setDraftLiveEnabled((v) => !v);
                    setModalError(null);
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    draftLiveEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                      draftLiveEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Provider Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  LLM Provider
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDraftProvider('gemini')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      draftProvider === 'gemini'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Google Gemini</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraftProvider('openai')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      draftProvider === 'openai'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>OpenAI</span>
                  </button>
                </div>
              </div>

              {/* API Key Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  {draftProvider === 'gemini' ? 'Gemini API Key' : 'OpenAI API Key'}
                </label>
                <input
                  type="password"
                  value={draftApiKey}
                  onChange={(e) => {
                    setDraftApiKey(e.target.value);
                    if (modalError) setModalError(null);
                  }}
                  placeholder={draftProvider === 'gemini' ? 'AIzaSy...' : 'sk-proj-...'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />
                <div className="flex items-start gap-1.5 text-[11px] text-slate-500 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    Saved in <code className="font-mono text-slate-700">sessionStorage</code> only.
                    Only column metadata, row count, and 5 sample rows are ever sent—never your full CSV.
                  </span>
                </div>
              </div>

              {modalError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-lg border border-slate-700">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <PreviewErrorBoundary>
      <QueryLensWorkspace />
    </PreviewErrorBoundary>
  );
}
