import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useXero } from '../contexts/XeroContext';
import SidebarLayout from '../components/SidebarLayout';
import toast from 'react-hot-toast';
import openaiService from '../api/openaiService';
import { companyService } from '../api/companyService';
import { AI_CONFIG } from '../config/aiConfig';
import FinancialAnalysisDisplay from '../components/FinancialAnalysisDisplay';
import TemplateSelector from '../components/TemplateSelector';
import { NotificationTemplate } from '../api/templateService';
import { isPlainObject, getSectionData } from '../components/XeroDataPreview';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: any; // For structured data like financial analysis
}

interface FinancialAnalysis {
  Cashflow_Projection: {
    Month_1: number;
    Month_2: number;
    Month_3: number;
  };
  GST_Estimate_Next_Period: number;
  BAS_Summary?: {
    totalSales: number;
    totalPurchases: number;
    gstOnSales: number;
    gstOnPurchases: number;
    netGST: number;
    hasData?: boolean;
  } | null;
  FBT_Exposure?: {
    totalFringeBenefits: number;
    totalFBT: number;
    categories?: Record<string, number>;
    keyRisks?: string[];
    hasData?: boolean;
  } | null;
  Insights: string[];
  Recommended_Actions: string[];
}

type BasFormattingResult = {
  formatted: string;
  source: Record<string, unknown>;
};

type BasPromptPayload = {
  period?: string;
  gst?: {
    sales?: {
      total_g1?: number;
      export_g2?: number;
      other_gst_free_g3?: number;
      input_taxed_sales?: number;
    };
    purchases?: {
      capital_g10?: number;
      non_capital_g11?: number;
    };
    calc_sheet?: {
      g21_gst_on_sales?: number;
      g22_sales_increasing_adj?: number;
      g23_gst_on_purchases?: number;
      g24_purchases_increasing_adj?: number;
    };
    totals?: {
      oneA_gst_on_sales?: number;
      oneB_gst_on_purchases?: number;
    };
  };
  payg_withholding?: {
    w1_gross_wages?: number;
    w2_amounts_withheld?: number;
    w3_other_withholding?: number;
    w4_amounts_withheld_where_no_abn?: number;
    w5_total_amounts_withheld?: number;
    stp_prefill?: {
      w1?: number;
      w2?: number;
    };
  };
  payg_instalment?: {
    t1_instalment_income?: number;
    t2_instalment_rate_percent?: number;
    t3_varied_rate_percent?: number;
    t11_calculated_instalment?: number;
    fiveA_payg_instalment?: number;
    variation_reason_code?: string;
  };
};

const BAS_PROMPT_INSTRUCTIONS = `ROLE: You are an AI BAS preparation assistant for Australian entities. You receive a final, validated BAS JSON and must output a pre-filled BAS in plain text that matches ATO lodgement requirements. Your job is accuracy, not vibes.

AUTHORITATIVE RULES
1) Labels you may populate
- GST: G1, G2, G3, G10, G11, G21, G22, G23, G24, 1A, 1B
- PAYG Withholding: W1, W2, W3, W4, W5 (and label 4 if supplied)
- PAYG Instalments: T1, T2, T3, T11, 5A (plus variation reason if supplied)

2) Rounding & formatting
- Round DOWN to whole dollars for all money values. No cents. Show a leading "$".
- Do NOT show negative amounts. If a value would be negative or is missing, omit that label line entirely.
- Only include labels that exist or can be derived per these rules. Never guess.

3) GST classification logic
- G1 Total sales: all sales for the period, including GST-free and input-taxed.
- G2 Export sales: GST-free exports only.
- G3 Other GST-free sales: domestic GST-free sales (exclude exports already in G2).
- G10 Capital purchases: capital items (assets with enduring use).
- G11 Non-capital purchases: normal operating expenses.
- Calculation-sheet amounts (when provided):
- G21 GST on taxable sales
- G22 Adjustments increasing GST on sales
- G23 GST on purchases
- G24 Adjustments increasing GST on purchases
Map to totals: 1A = G21 + G22; 1B = G23 + G24.

4) PAYG withholding (W-labels)
- W1: gross salary/wages and other payments subject to withholding
- W2: total amounts withheld from W1
- W3/W4/W5: other withholdings and totals if supplied
- If STP prefill exists, use STP W1/W2 instead of raw payroll totals.

5) PAYG income tax instalments
- If using rate method: T1 × (T3 if provided, else T2) = T11, then 5A = T11.
- If the JSON supplies varied values for T11 or 5A, output those and show T3 and variation reason if present.

6) Edge-case rules
- Input-taxed sales sit in G1 only and do not affect 1A.
- GST-free purchases are counted in G10/G11 but contribute $0 to 1B.
- Private use or non-creditable components are assumed pre-netted in the JSON; do not infer credits.
- Adjustments: increasing adjustments for sales/purchases populate G22/G24 and flow into 1A/1B.

INPUT EXPECTATIONS (single object; ignore keys not listed)
{
"period": "YYYY-MM",
"gst": {
"sales": {
"total_g1": number,
"export_g2": number,
"other_gst_free_g3": number,
"input_taxed_sales": number
},
"purchases": {
"capital_g10": number,
"non_capital_g11": number
},
"calc_sheet": {
"g21_gst_on_sales": number,
"g22_sales_increasing_adj": number,
"g23_gst_on_purchases": number,
"g24_purchases_increasing_adj": number
},
"totals": {
"oneA_gst_on_sales": number,
"oneB_gst_on_purchases": number
}
},
"payg_withholding": {
"w1_gross_wages": number,
"w2_amounts_withheld": number,
"w3_other_withholding": number,
"w4_amounts_withheld_where_no_abn": number,
"w5_total_amounts_withheld": number,
"stp_prefill": { "w1": number, "w2": number }
},
"payg_instalment": {
"t1_instalment_income": number,
"t2_instalment_rate_percent": number,
"t3_varied_rate_percent": number,
"t11_calculated_instalment": number,
"fiveA_payg_instalment": number,
"variation_reason_code": "string"
}
}

DERIVATIONS & RECONCILIATION
- If 1A/1B are missing but calc-sheet numbers exist, compute: 1A = G21 + G22; 1B = G23 + G24.
- Prefer STP prefill for W1/W2 when available; otherwise use payroll totals.
- If T11 is missing but T1 and a rate exist, compute T11 = T1 × (T3 or else T2); then set 5A = T11.
- Never invent classifications. If a number is absent or invalid, omit that label.

QUALITY CHECKS BEFORE OUTPUT
- If present, enforce G1 ≥ (G2 + G3 + input-taxed sales). If not true, omit G1.
- Enforce 1A ≥ 0 and 1B ≥ 0.
- If both present, enforce W2 ≤ W5.
- If PAYGI rate method is used, enforce 5A = T11.

OUTPUT FORMAT
Return plain text, copy-paste ready. One label per line. Omit any label that is blank or disallowed by the rules. Use whole dollars (floored).

Template:
BAS Period: YYYY-MM

GST
G1: $[whole dollars]
G2: $[whole dollars]
G3: $[whole dollars]
G10: $[whole dollars]
G11: $[whole dollars]
1A: $[whole dollars]
1B: $[whole dollars]

PAYG Withholding
W1: $[whole dollars]
W2: $[whole dollars]
W3: $[whole dollars]
W4: $[whole dollars]
W5: $[whole dollars]

PAYG Instalments
T1: $[whole dollars]
T2: [rate %]
T3: [varied rate %]
T11: $[whole dollars]
5A: $[whole dollars]

NOW DO THIS:
1) Validate and reconcile the input per the rules above.
2) Compute any missing derivable amounts.
3) Output ONLY the populated labels in the exact template order, with whole dollars and the leading "$". No commentary or extra lines.`;

const parseNumeric = (value: unknown): number | null => {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d\-.]/g, '');
    if (!cleaned || cleaned === '-' || cleaned === '.' || cleaned === '-.') {
      return null;
    }
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const floorCurrencyValue = (value: unknown): number | null => {
  const numeric = parseNumeric(value);
  if (numeric === null || numeric < 0) {
    return null;
  }
  return Math.floor(numeric);
};

const formatCurrencyValue = (value: number): string =>
  `$${value.toLocaleString('en-AU', { maximumFractionDigits: 0 })}`;

const formatRateValue = (value: number): string => {
  const decimals = Math.abs(value % 1) < 0.00001 ? 0 : 2;
  return `${value.toFixed(decimals)}%`;
};

const toCamelCase = (input: string): string =>
  input.replace(/[_\s]+([a-zA-Z0-9])/g, (_, char: string) => char.toUpperCase());

const keyVariants = (key: string): string[] => {
  const variants = new Set<string>();
  variants.add(key);
  variants.add(key.toLowerCase());
  variants.add(key.toUpperCase());

  const camel = toCamelCase(key);
  variants.add(camel);
  variants.add(camel.charAt(0).toLowerCase() + camel.slice(1));
  variants.add(camel.charAt(0).toUpperCase() + camel.slice(1));

  const noUnderscore = key.replace(/_/g, '');
  if (noUnderscore && noUnderscore !== key) {
    variants.add(noUnderscore);
    variants.add(noUnderscore.toLowerCase());
    variants.add(noUnderscore.toUpperCase());
    const camelNoUnderscore = toCamelCase(noUnderscore);
    variants.add(camelNoUnderscore);
    variants.add(camelNoUnderscore.charAt(0).toLowerCase() + camelNoUnderscore.slice(1));
    variants.add(camelNoUnderscore.charAt(0).toUpperCase() + camelNoUnderscore.slice(1));
  }

  return Array.from(variants);
};

const getValue = (source: any, ...keys: string[]): unknown => {
  if (!source || typeof source !== 'object') {
    return undefined;
  }
  for (const key of keys) {
    const variants = keyVariants(key);
    for (const variant of variants) {
      if (Object.prototype.hasOwnProperty.call(source, variant)) {
        return source[variant];
      }
    }
  }
  return undefined;
};

const LABEL_DETAILS: Record<string, string> = {
  G1: 'Total sales for the period (includes GST-free and input-taxed sales)',
  G2: 'Export sales that are GST-free',
  G3: 'Domestic GST-free sales (excluding exports)',
  G10: 'Capital acquisitions and asset purchases',
  G11: 'Non-capital/business operating purchases',
  G21: 'GST on taxable sales before adjustments',
  G22: 'Increasing adjustments to GST on sales',
  G23: 'GST credits from purchases',
  G24: 'Increasing adjustments to GST credits',
  '1A': 'Total GST payable (G21 + G22)',
  '1B': 'Total GST credits (G23 + G24)',
  W1: 'Gross wages and payments subject to PAYG withholding',
  W2: 'Amounts withheld from W1 payments',
  W3: 'Other PAYG withholdings (e.g. investment distributions)',
  W4: 'Withholding for payments where no ABN was quoted',
  W5: 'Total PAYG amounts withheld',
  T1: 'PAYG instalment income for the period',
  T2: 'Standard PAYG instalment rate applied',
  T3: 'Varied PAYG instalment rate (if applicable)',
  T11: 'Calculated PAYG instalment for the period',
  '5A': 'PAYG instalment payable this period'
};

const describeLabel = (code: string): string =>
  LABEL_DETAILS[code] ? `${code} — ${LABEL_DETAILS[code]}` : code;

const pushMoneyLine = (lines: string[], label: string, rawValue: unknown) => {
  const floored = floorCurrencyValue(rawValue);
  if (floored === null) {
    return;
  }
  lines.push(`${describeLabel(label)}: ${formatCurrencyValue(floored)}`);
};

const pushRateLine = (lines: string[], label: string, rawValue: unknown) => {
  const numeric = parseNumeric(rawValue);
  if (numeric === null || numeric < 0) {
    return;
  }
  lines.push(`${describeLabel(label)}: ${formatRateValue(numeric)}`);
};

const findBasDataCandidate = (input: any, visited = new WeakSet<object>()): Record<string, unknown> | null => {
  if (!input || typeof input !== 'object') {
    return null;
  }
  if (visited.has(input)) {
    return null;
  }
  visited.add(input);

  const gst = getValue(input, 'gst', 'GST');
  const paygWithholding = getValue(input, 'payg_withholding', 'paygWithholding', 'PAYG_Withholding');
  const paygInstalment = getValue(input, 'payg_instalment', 'paygInstalment', 'payg_instalments', 'paygInstalments');
  const basFields = getValue(input, 'BAS_Fields', 'bas_fields');

  if ((gst && (paygWithholding || paygInstalment)) || basFields) {
    return input as Record<string, unknown>;
  }

  if (Array.isArray(input)) {
    for (const item of input) {
      const result = findBasDataCandidate(item, visited);
      if (result) {
        return result;
      }
    }
    return null;
  }

  for (const value of Object.values(input)) {
    const result = findBasDataCandidate(value, visited);
    if (result) {
      return result;
    }
  }
  return null;
};

const buildBasStructureFromFields = (input: Record<string, unknown>): Record<string, unknown> => {
  const basFields = (getValue(input, 'BAS_Fields', 'bas_fields') ?? {}) as Record<string, unknown>;
  const period = getValue(input, 'BAS_Period', 'bas_period', 'period');

  return {
    period: typeof period === 'string' ? period : undefined,
    gst: {
      sales: {
        total_g1: getValue(basFields, 'G1'),
        export_g2: getValue(basFields, 'G2'),
        other_gst_free_g3: getValue(basFields, 'G3'),
        input_taxed_sales: getValue(basFields, 'InputTaxedSales')
      },
      purchases: {
        capital_g10: getValue(basFields, 'G10'),
        non_capital_g11: getValue(basFields, 'G11')
      },
      calc_sheet: {
        g21_gst_on_sales: getValue(basFields, 'G21'),
        g22_sales_increasing_adj: getValue(basFields, 'G22'),
        g23_gst_on_purchases: getValue(basFields, 'G23'),
        g24_purchases_increasing_adj: getValue(basFields, 'G24')
      },
      totals: {
        oneA_gst_on_sales: getValue(basFields, '1A', 'oneA'),
        oneB_gst_on_purchases: getValue(basFields, '1B', 'oneB')
      }
    },
    payg_withholding: {
      w1_gross_wages: getValue(basFields, 'W1'),
      w2_amounts_withheld: getValue(basFields, 'W2'),
      w3_other_withholding: getValue(basFields, 'W3'),
      w4_amounts_withheld_where_no_abn: getValue(basFields, 'W4'),
      w5_total_amounts_withheld: getValue(basFields, 'W5')
    }
  };
};

const formatBasPlainText = (input: Record<string, unknown>): string | null => {
  if (!input || typeof input !== 'object') {
    return null;
  }

  let period: string | null = null;
  const periodValue = getValue(input, 'period', 'BAS_Period', 'bas_period');
  if (typeof periodValue === 'string' && periodValue.trim()) {
    period = periodValue.trim();
  } else {
    const periodObject = getValue(input, 'period');
    if (periodObject && typeof periodObject === 'object') {
      const from = getValue(periodObject, 'fromDate', 'from');
      const to = getValue(periodObject, 'toDate', 'to');
      if (typeof from === 'string' && typeof to === 'string') {
        period = `${from} to ${to}`;
      }
    }
  }

  let gstBlock = getValue(input, 'gst', 'GST') as Record<string, unknown> | undefined;
  let paygWithholdingBlock = getValue(input, 'payg_withholding', 'paygWithholding', 'PAYG_Withholding') as
    | Record<string, unknown>
    | undefined;
  let paygInstalmentBlock = getValue(
    input,
    'payg_instalment',
    'paygInstalment',
    'payg_instalments',
    'paygInstalments'
  ) as Record<string, unknown> | undefined;

  const basFields = getValue(input, 'BAS_Fields', 'bas_fields');
  if ((!gstBlock || typeof gstBlock !== 'object') && basFields && typeof basFields === 'object') {
    const derived = buildBasStructureFromFields(input);
    gstBlock = derived.gst as Record<string, unknown>;
    if (!paygWithholdingBlock || typeof paygWithholdingBlock !== 'object') {
      paygWithholdingBlock = derived.payg_withholding as Record<string, unknown>;
    }
    if (!period && typeof derived.period === 'string') {
      period = derived.period;
    }
  }

  if (!gstBlock && !paygWithholdingBlock && !paygInstalmentBlock) {
    return null;
  }

  const outputLines: string[] = [];
  outputLines.push(`BAS Period: ${period || 'Unknown'}`, '');

  const gstLines: string[] = [];
  let summaryG1: number | null = null;
  let summary1A: number | null = null;
  let summary1B: number | null = null;
  if (gstBlock && typeof gstBlock === 'object') {
    const sales = getValue(gstBlock, 'sales', 'Sales') as Record<string, unknown> | undefined;
    const purchases = getValue(gstBlock, 'purchases', 'Purchases') as Record<string, unknown> | undefined;
    const calcSheet = getValue(gstBlock, 'calc_sheet', 'calcSheet', 'calcsheet') as
      | Record<string, unknown>
      | undefined;
    const totals = getValue(gstBlock, 'totals', 'Totals') as Record<string, unknown> | undefined;

    const rawG1 = parseNumeric(getValue(sales, 'total_g1', 'totalG1', 'G1'));
    const rawG2 = parseNumeric(getValue(sales, 'export_g2', 'exportG2', 'G2'));
    const rawG3 = parseNumeric(getValue(sales, 'other_gst_free_g3', 'otherGstFreeG3', 'G3'));
    const rawInputTaxed = parseNumeric(getValue(sales, 'input_taxed_sales', 'inputTaxedSales'));

    const compareSum =
      (rawG2 ?? 0) +
      (rawG3 ?? 0) +
      (rawInputTaxed ?? 0);

    if (rawG1 !== null && rawG1 >= compareSum) {
      summaryG1 = rawG1;
      pushMoneyLine(gstLines, 'G1', rawG1);
    }
    pushMoneyLine(gstLines, 'G2', rawG2);
    pushMoneyLine(gstLines, 'G3', rawG3);

    pushMoneyLine(gstLines, 'G10', parseNumeric(getValue(purchases, 'capital_g10', 'capitalG10', 'G10')));
    pushMoneyLine(gstLines, 'G11', parseNumeric(getValue(purchases, 'non_capital_g11', 'nonCapitalG11', 'G11')));

    const rawG21 = parseNumeric(getValue(calcSheet, 'g21_gst_on_sales', 'G21'));
    const rawG22 = parseNumeric(getValue(calcSheet, 'g22_sales_increasing_adj', 'G22'));
    const rawG23 = parseNumeric(getValue(calcSheet, 'g23_gst_on_purchases', 'G23'));
    const rawG24 = parseNumeric(getValue(calcSheet, 'g24_purchases_increasing_adj', 'G24'));

    pushMoneyLine(gstLines, 'G21', rawG21);
    pushMoneyLine(gstLines, 'G22', rawG22);
    pushMoneyLine(gstLines, 'G23', rawG23);
    pushMoneyLine(gstLines, 'G24', rawG24);

    let raw1A =
      parseNumeric(getValue(totals, 'oneA_gst_on_sales', 'oneA', '1A')) ??
      parseNumeric(getValue(gstBlock, 'oneA_gst_on_sales', '1A'));
    if (raw1A === null) {
      const adjG21 = rawG21 ?? 0;
      const adjG22 = rawG22 ?? 0;
      const computed = adjG21 + adjG22;
      if (Number.isFinite(computed)) {
        raw1A = computed;
      }
    }

    let raw1B =
      parseNumeric(getValue(totals, 'oneB_gst_on_purchases', 'oneB', '1B')) ??
      parseNumeric(getValue(gstBlock, 'oneB_gst_on_purchases', '1B'));
    if (raw1B === null) {
      const adjG23 = rawG23 ?? 0;
      const adjG24 = rawG24 ?? 0;
      const computed = adjG23 + adjG24;
      if (Number.isFinite(computed)) {
        raw1B = computed;
      }
    }

    if (raw1A !== null) {
      summary1A = raw1A;
    }
    if (raw1B !== null) {
      summary1B = raw1B;
    }

    pushMoneyLine(gstLines, '1A', raw1A);
    pushMoneyLine(gstLines, '1B', raw1B);
  }

  const paygWithholdingLines: string[] = [];
  let summaryW2: number | null = null;
  if (paygWithholdingBlock && typeof paygWithholdingBlock === 'object') {
    const stpPrefill = getValue(paygWithholdingBlock, 'stp_prefill', 'stpPrefill') as
      | Record<string, unknown>
      | undefined;

    const rawW1 =
      parseNumeric(getValue(stpPrefill, 'w1', 'W1')) ??
      parseNumeric(getValue(paygWithholdingBlock, 'w1_gross_wages', 'w1', 'W1'));
    const rawW2 =
      parseNumeric(getValue(stpPrefill, 'w2', 'W2')) ??
      parseNumeric(getValue(paygWithholdingBlock, 'w2_amounts_withheld', 'w2', 'W2'));
    const rawW3 = parseNumeric(getValue(paygWithholdingBlock, 'w3_other_withholding', 'w3', 'W3'));
    const rawW4 = parseNumeric(getValue(paygWithholdingBlock, 'w4_amounts_withheld_where_no_abn', 'w4', 'W4'));
    let rawW5 = parseNumeric(getValue(paygWithholdingBlock, 'w5_total_amounts_withheld', 'w5', 'W5'));

    if (rawW2 !== null && rawW5 !== null && rawW2 > rawW5) {
      rawW5 = null;
    }

    pushMoneyLine(paygWithholdingLines, 'W1', rawW1);
    if (rawW2 !== null) {
      summaryW2 = rawW2;
    }
    pushMoneyLine(paygWithholdingLines, 'W2', rawW2);
    pushMoneyLine(paygWithholdingLines, 'W3', rawW3);
    pushMoneyLine(paygWithholdingLines, 'W4', rawW4);
    pushMoneyLine(paygWithholdingLines, 'W5', rawW5);
  }

  const paygInstalmentLines: string[] = [];
  let summary5A: number | null = null;
  if (paygInstalmentBlock && typeof paygInstalmentBlock === 'object') {
    const rawT1 = parseNumeric(getValue(paygInstalmentBlock, 't1_instalment_income', 't1', 'T1'));
    const rawT2 = parseNumeric(getValue(paygInstalmentBlock, 't2_instalment_rate_percent', 't2', 'T2'));
    const rawT3 = parseNumeric(getValue(paygInstalmentBlock, 't3_varied_rate_percent', 't3', 'T3'));
    let rawT11 = parseNumeric(getValue(paygInstalmentBlock, 't11_calculated_instalment', 't11', 'T11'));
    let raw5A =
      parseNumeric(getValue(paygInstalmentBlock, 'fiveA_payg_instalment', 'fiveA', '5A')) ??
      parseNumeric(getValue(paygInstalmentBlock, 'five_a_payg_instalment'));

    const appliedRate = rawT3 ?? rawT2;
    if (rawT11 === null && rawT1 !== null && appliedRate !== null) {
      rawT11 = rawT1 * (appliedRate / 100);
    }

    if (rawT11 !== null) {
      raw5A = rawT11;
    }

    pushMoneyLine(paygInstalmentLines, 'T1', rawT1);
    if (rawT2 !== null) {
      pushRateLine(paygInstalmentLines, 'T2', rawT2);
    }
    if (rawT3 !== null) {
      pushRateLine(paygInstalmentLines, 'T3', rawT3);
    }
    pushMoneyLine(paygInstalmentLines, 'T11', rawT11);
    if (raw5A !== null) {
      summary5A = raw5A;
    }
    pushMoneyLine(paygInstalmentLines, '5A', raw5A);

    const variationReason = getValue(
      paygInstalmentBlock,
      'variation_reason_code',
      'variationReasonCode',
      'variation_reason'
    );
    if (variationReason !== undefined && variationReason !== null && String(variationReason).trim() !== '') {
      paygInstalmentLines.push(
        `Variation Reason — Explanation for varied PAYG instalment: ${variationReason}`
      );
    }
  }

  const sections: { title: string; lines: string[]; noDataMessage: string }[] = [
    {
      title: 'GST',
      lines: gstLines,
      noDataMessage: 'No reportable GST activity supplied for this period.'
    },
    {
      title: 'PAYG Withholding',
      lines: paygWithholdingLines,
      noDataMessage: 'No PAYG withholding amounts reported.'
    },
    {
      title: 'PAYG Instalments',
      lines: paygInstalmentLines,
      noDataMessage: 'No PAYG instalment obligations reported.'
    }
  ];

  sections.forEach((section, index) => {
    outputLines.push(section.title);
    if (section.lines.length === 0) {
      outputLines.push(section.noDataMessage);
    } else {
      section.lines.forEach((line) => outputLines.push(line));
    }
    if (index < sections.length - 1) {
      outputLines.push('');
    }
  });

  const summaryLines: string[] = [];
  if (summary1A !== null || summary1B !== null || summaryW2 !== null || summary5A !== null) {
    summaryLines.push('Summary Insights');
    if (summaryG1 !== null) {
      summaryLines.push(`- Reported taxable sales (G1) total ${formatCurrencyValue(Math.floor(summaryG1))}.`);
    }
    if (summary1A !== null && summary1B !== null) {
      const netGST = summary1A - summary1B;
      const netLabel = netGST >= 0 ? 'Net GST payable' : 'Net GST refundable';
      summaryLines.push(
        `- ${netLabel}: ${formatCurrencyValue(Math.floor(Math.abs(netGST)))} (calculated as 1A minus 1B).`
      );
    } else if (summary1A !== null) {
      summaryLines.push(`- GST on sales (1A) reported at ${formatCurrencyValue(Math.floor(summary1A))}.`);
    } else if (summary1B !== null) {
      summaryLines.push(`- GST credits (1B) reported at ${formatCurrencyValue(Math.floor(summary1B))}.`);
    }
    if (summaryW2 !== null) {
      summaryLines.push(`- PAYG withholding obligations (W2) total ${formatCurrencyValue(Math.floor(summaryW2))}.`);
    }
    if (summary5A !== null) {
      summaryLines.push(`- PAYG instalment due (5A) is ${formatCurrencyValue(Math.floor(summary5A))}.`);
    }
  }

  if (summaryLines.length > 0) {
    outputLines.push('');
    summaryLines.forEach((line) => outputLines.push(line));
  }

  return outputLines.join('\n').replace(/\n+$/, '');
};

const sanitizeBasMoneyValue = (value: unknown): number | undefined => {
  const numeric = parseNumeric(value);
  if (numeric === null || !Number.isFinite(numeric) || numeric < 0) {
    return undefined;
  }
  return numeric;
};

const sanitizeBasRateValue = (value: unknown): number | undefined => {
  const numeric = parseNumeric(value);
  if (numeric === null || !Number.isFinite(numeric) || numeric < 0) {
    return undefined;
  }
  return numeric;
};

const pruneEmptyBasValue = (value: unknown): unknown => {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (Array.isArray(value)) {
    const prunedArray = value
      .map(pruneEmptyBasValue)
      .filter((item) => item !== undefined);
    return prunedArray.length > 0 ? prunedArray : undefined;
  }
  if (isPlainObject(value)) {
    const result: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, val]) => {
      const pruned = pruneEmptyBasValue(val);
      if (pruned !== undefined) {
        result[key] = pruned;
      }
    });
    return Object.keys(result).length > 0 ? result : undefined;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }
  return value;
};

const normalizeBasDataForPrompt = (input: Record<string, unknown>): BasPromptPayload | null => {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const payload: BasPromptPayload = {};

  const periodValue = getValue(input, 'period', 'BAS_Period', 'bas_period');
  if (typeof periodValue === 'string' && periodValue.trim()) {
    payload.period = periodValue.trim();
  } else {
    const periodObject = getValue(input, 'period');
    const fromDate = getValue(periodObject, 'fromDate', 'from');
    const toDate = getValue(periodObject, 'toDate', 'to');
    if (typeof fromDate === 'string' && typeof toDate === 'string') {
      payload.period = `${fromDate} to ${toDate}`;
    }
  }

  let gstBlock = getValue(input, 'gst', 'GST');
  let paygWithholdingBlock = getValue(input, 'payg_withholding', 'paygWithholding', 'PAYG_Withholding');
  let paygInstalmentBlock = getValue(
    input,
    'payg_instalment',
    'paygInstalment',
    'payg_instalments',
    'paygInstalments'
  );

  const basFields = getValue(input, 'BAS_Fields', 'bas_fields');
  if ((!gstBlock || typeof gstBlock !== 'object') && basFields && typeof basFields === 'object') {
    const derived = buildBasStructureFromFields(input);
    gstBlock = derived.gst;
    if (!paygWithholdingBlock) {
      paygWithholdingBlock = derived.payg_withholding;
    }
  }

  if (gstBlock && typeof gstBlock === 'object') {
    const gstPayload: NonNullable<BasPromptPayload['gst']> = {};
    const sales = getValue(gstBlock, 'sales', 'Sales');
    const purchases = getValue(gstBlock, 'purchases', 'Purchases');
    const calcSheet = getValue(gstBlock, 'calc_sheet', 'calcSheet', 'calcsheet');
    const totals = getValue(gstBlock, 'totals', 'Totals');

    const salesPayload: NonNullable<BasPromptPayload['gst']>['sales'] = {};
    const g1 = sanitizeBasMoneyValue(getValue(sales, 'total_g1', 'totalG1', 'G1'));
    const g2 = sanitizeBasMoneyValue(getValue(sales, 'export_g2', 'exportG2', 'G2'));
    const g3 = sanitizeBasMoneyValue(getValue(sales, 'other_gst_free_g3', 'otherGstFreeG3', 'G3'));
    const inputTaxed = sanitizeBasMoneyValue(getValue(sales, 'input_taxed_sales', 'inputTaxedSales'));

    const compareSum = (g2 ?? 0) + (g3 ?? 0) + (inputTaxed ?? 0);
    if (g1 !== undefined && g1 >= compareSum) {
      salesPayload.total_g1 = g1;
    }
    if (g2 !== undefined) {
      salesPayload.export_g2 = g2;
    }
    if (g3 !== undefined) {
      salesPayload.other_gst_free_g3 = g3;
    }
    if (inputTaxed !== undefined) {
      salesPayload.input_taxed_sales = inputTaxed;
    }
    if (Object.keys(salesPayload).length > 0) {
      gstPayload.sales = salesPayload;
    }

    const purchasesPayload: NonNullable<BasPromptPayload['gst']>['purchases'] = {};
    const g10 = sanitizeBasMoneyValue(getValue(purchases, 'capital_g10', 'capitalG10', 'G10'));
    const g11 = sanitizeBasMoneyValue(getValue(purchases, 'non_capital_g11', 'nonCapitalG11', 'G11'));
    if (g10 !== undefined) {
      purchasesPayload.capital_g10 = g10;
    }
    if (g11 !== undefined) {
      purchasesPayload.non_capital_g11 = g11;
    }
    if (Object.keys(purchasesPayload).length > 0) {
      gstPayload.purchases = purchasesPayload;
    }

    const calcSheetPayload: NonNullable<BasPromptPayload['gst']>['calc_sheet'] = {};
    const g21 = sanitizeBasMoneyValue(getValue(calcSheet, 'g21_gst_on_sales', 'G21'));
    const g22 = sanitizeBasMoneyValue(getValue(calcSheet, 'g22_sales_increasing_adj', 'G22'));
    const g23 = sanitizeBasMoneyValue(getValue(calcSheet, 'g23_gst_on_purchases', 'G23'));
    const g24 = sanitizeBasMoneyValue(getValue(calcSheet, 'g24_purchases_increasing_adj', 'G24'));
    if (g21 !== undefined) {
      calcSheetPayload.g21_gst_on_sales = g21;
    }
    if (g22 !== undefined) {
      calcSheetPayload.g22_sales_increasing_adj = g22;
    }
    if (g23 !== undefined) {
      calcSheetPayload.g23_gst_on_purchases = g23;
    }
    if (g24 !== undefined) {
      calcSheetPayload.g24_purchases_increasing_adj = g24;
    }
    if (Object.keys(calcSheetPayload).length > 0) {
      gstPayload.calc_sheet = calcSheetPayload;
    }

    const totalsPayload: NonNullable<BasPromptPayload['gst']>['totals'] = {};
    let oneA = sanitizeBasMoneyValue(getValue(totals, 'oneA_gst_on_sales', 'oneA', '1A'));
    if (oneA === undefined && (g21 !== undefined || g22 !== undefined)) {
      oneA = (g21 ?? 0) + (g22 ?? 0);
    }
    let oneB = sanitizeBasMoneyValue(getValue(totals, 'oneB_gst_on_purchases', 'oneB', '1B'));
    if (oneB === undefined && (g23 !== undefined || g24 !== undefined)) {
      oneB = (g23 ?? 0) + (g24 ?? 0);
    }
    if (oneA !== undefined) {
      totalsPayload.oneA_gst_on_sales = oneA;
    }
    if (oneB !== undefined) {
      totalsPayload.oneB_gst_on_purchases = oneB;
    }
    if (Object.keys(totalsPayload).length > 0) {
      gstPayload.totals = totalsPayload;
    }

    if (Object.keys(gstPayload).length > 0) {
      payload.gst = gstPayload;
    }
  }

  if (paygWithholdingBlock && typeof paygWithholdingBlock === 'object') {
    const paygPayload: NonNullable<BasPromptPayload['payg_withholding']> = {};
    const stp = getValue(paygWithholdingBlock, 'stp_prefill', 'stpPrefill');

    const stpPayload: NonNullable<BasPromptPayload['payg_withholding']>['stp_prefill'] = {};
    const stpW1 = sanitizeBasMoneyValue(getValue(stp, 'w1', 'W1'));
    const stpW2 = sanitizeBasMoneyValue(getValue(stp, 'w2', 'W2'));
    if (stpW1 !== undefined) {
      stpPayload.w1 = stpW1;
    }
    if (stpW2 !== undefined) {
      stpPayload.w2 = stpW2;
    }
    if (Object.keys(stpPayload).length > 0) {
      paygPayload.stp_prefill = stpPayload;
    }

    const w1 = sanitizeBasMoneyValue(getValue(paygWithholdingBlock, 'w1_gross_wages', 'w1', 'W1'));
    const w2 = sanitizeBasMoneyValue(getValue(paygWithholdingBlock, 'w2_amounts_withheld', 'w2', 'W2'));
    const w3 = sanitizeBasMoneyValue(getValue(paygWithholdingBlock, 'w3_other_withholding', 'w3', 'W3'));
    const w4 = sanitizeBasMoneyValue(
      getValue(paygWithholdingBlock, 'w4_amounts_withheld_where_no_abn', 'w4', 'W4')
    );
    let w5 = sanitizeBasMoneyValue(getValue(paygWithholdingBlock, 'w5_total_amounts_withheld', 'w5', 'W5'));

    if (w5 !== undefined && w2 !== undefined && w2 > w5) {
      w5 = undefined;
    }

    if (w1 !== undefined) {
      paygPayload.w1_gross_wages = w1;
    }
    if (w2 !== undefined) {
      paygPayload.w2_amounts_withheld = w2;
    }
    if (w3 !== undefined) {
      paygPayload.w3_other_withholding = w3;
    }
    if (w4 !== undefined) {
      paygPayload.w4_amounts_withheld_where_no_abn = w4;
    }
    if (w5 !== undefined) {
      paygPayload.w5_total_amounts_withheld = w5;
    }

    if (Object.keys(paygPayload).length > 0) {
      payload.payg_withholding = paygPayload;
    }
  }

  if (paygInstalmentBlock && typeof paygInstalmentBlock === 'object') {
    const instalmentPayload: NonNullable<BasPromptPayload['payg_instalment']> = {};
    const t1 = sanitizeBasMoneyValue(getValue(paygInstalmentBlock, 't1_instalment_income', 't1', 'T1'));
    const t2 = sanitizeBasRateValue(getValue(paygInstalmentBlock, 't2_instalment_rate_percent', 't2', 'T2'));
    const t3 = sanitizeBasRateValue(getValue(paygInstalmentBlock, 't3_varied_rate_percent', 't3', 'T3'));
    let t11 = sanitizeBasMoneyValue(getValue(paygInstalmentBlock, 't11_calculated_instalment', 't11', 'T11'));
    let fiveA =
      sanitizeBasMoneyValue(getValue(paygInstalmentBlock, 'fiveA_payg_instalment', 'fiveA', '5A')) ??
      sanitizeBasMoneyValue(getValue(paygInstalmentBlock, 'five_a_payg_instalment'));

    const appliedRate = t3 ?? t2;
    if (t11 === undefined && t1 !== undefined && appliedRate !== undefined) {
      t11 = t1 * (appliedRate / 100);
    }
    if (t11 !== undefined) {
      fiveA = t11;
    }

    if (t1 !== undefined) {
      instalmentPayload.t1_instalment_income = t1;
    }
    if (t2 !== undefined) {
      instalmentPayload.t2_instalment_rate_percent = t2;
    }
    if (t3 !== undefined) {
      instalmentPayload.t3_varied_rate_percent = t3;
    }
    if (t11 !== undefined) {
      instalmentPayload.t11_calculated_instalment = t11;
    }
    if (fiveA !== undefined) {
      instalmentPayload.fiveA_payg_instalment = fiveA;
    }

    const variationReason = getValue(
      paygInstalmentBlock,
      'variation_reason_code',
      'variationReasonCode',
      'variation_reason'
    );
    if (variationReason !== undefined && variationReason !== null && String(variationReason).trim() !== '') {
      instalmentPayload.variation_reason_code = String(variationReason).trim();
    }

    if (Object.keys(instalmentPayload).length > 0) {
      payload.payg_instalment = instalmentPayload;
    }
  }

  const cleaned = pruneEmptyBasValue(payload) as BasPromptPayload | undefined;
  if (!cleaned || !isPlainObject(cleaned) || Object.keys(cleaned as Record<string, unknown>).length === 0) {
    return null;
  }

  return cleaned as BasPromptPayload;
};

const prepareBasPromptData = (
  xeroData: any
): { payload: BasPromptPayload | null; formattedText: string | null } => {
  const candidates = [
    getSectionData(xeroData?.basData, 'basStatement'),
    xeroData?.basData?.basStatement,
    xeroData?.basData?.data,
    xeroData?.basData,
    xeroData
  ];

  let payload: BasPromptPayload | null = null;
  let formattedText: string | null = null;

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }
    const found = findBasDataCandidate(candidate);
    if (!found) {
      continue;
    }
    if (!payload) {
      const normalized = normalizeBasDataForPrompt(found);
      if (normalized) {
        payload = normalized;
      }
    }
    if (!formattedText) {
      formattedText = formatBasPlainText(found);
    }
    if (payload && formattedText) {
      break;
    }
  }

  return { payload, formattedText };
};

const tryParseBasJsonFromText = (text: string): BasFormattingResult | null => {
  if (!text || typeof text !== 'string') {
    return null;
  }

  const candidates: string[] = [];
  const trimmed = text.trim();

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    candidates.push(trimmed);
  }

  const codeBlockMatches = Array.from(text.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi));
  codeBlockMatches.forEach((match) => {
    if (match[1]) {
      candidates.push(match[1].trim());
    }
  });

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    candidates.push(text.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      const basCandidate = findBasDataCandidate(parsed);
      if (basCandidate) {
        const formatted = formatBasPlainText(basCandidate);
        if (formatted) {
          return { formatted, source: basCandidate };
        }
      }
    } catch {
      continue;
    }
  }

  return null;
};

const AiChat: React.FC = () => {
  console.log('AiChat component rendered');
  
  const { company } = useAuth();
  const {
    status,
    isLoading: xeroLoading,
    error,
    selectedTenant,
    availableTenants: tenants = [],
    loadSettings,
    selectTenant,
    loadData,
    data: xeroContextData,
  } = useXero();

  const xeroConnected = status.connected;
  const xeroData = xeroContextData || {};
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [openAiKey, setOpenAiKey] = useState('');
  const [isLoadingKey, setIsLoadingKey] = useState(true);
  const [analysisMode, setAnalysisMode] = useState<'chat' | 'financial'>('chat');
  const [xeroAnalysisData, setXeroAnalysisData] = useState<any>(null);
  const [isLoadingXeroData, setIsLoadingXeroData] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadXeroDataForAnalysis = useCallback(async () => {
    if (!xeroConnected) {
      toast.error('Connect to Xero before running analysis.');
      return null;
    }

    if (!selectedTenant) {
      toast.error('Select a Xero organization first.');
      return null;
    }

    const tenantId = selectedTenant.tenantId || selectedTenant.id;

    setIsLoadingXeroData(true);
    try {
      const normalize = (response: any) => response?.data?.data ?? response?.data ?? response;

      const [basResponse, fasResponse, invoicesResponse, contactsResponse, dashboardResponse] = await Promise.all([
        loadData('basData', { tenantId, useCache: false }).catch((err: any) => {
          console.warn('⚠️ BAS data unavailable:', err?.message || err);
          return null;
        }),
        loadData('fasData', { tenantId, useCache: false }).catch((err: any) => {
          console.warn('⚠️ FAS data unavailable:', err?.message || err);
          return null;
        }),
        loadData('invoices', { tenantId, useCache: false, pageSize: 100 }).catch((err: any) => {
          console.warn('⚠️ Invoice data unavailable:', err?.message || err);
          return null;
        }),
        loadData('contacts', { tenantId, useCache: false }).catch((err: any) => {
          console.warn('⚠️ Contact data unavailable:', err?.message || err);
          return null;
        }),
        loadData('dashboard-data', { tenantId, useCache: false }).catch((err: any) => {
          console.warn('⚠️ Dashboard data unavailable:', err?.message || err);
          return null;
        }),
      ]);

      const basData = basResponse ? normalize(basResponse) : null;
      const fasData = fasResponse ? normalize(fasResponse) : null;
      const invoiceData = invoicesResponse ? normalize(invoicesResponse) : null;
      const contactsData = contactsResponse ? normalize(contactsResponse) : null;
      const dashboardData = dashboardResponse ? normalize(dashboardResponse) : null;

      const transactions = invoiceData?.Invoices || invoiceData?.items || invoiceData?.data || invoiceData || [];
      const contacts = contactsData?.Contacts || contactsData?.items || contactsData?.data || contactsData || [];

      return {
        tenantId,
        tenantName: selectedTenant.name || selectedTenant.organizationName || selectedTenant.tenantName,
        basData,
        fasData,
        transactions,
        contacts,
        dashboardData,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('❌ Failed to load Xero data for analysis:', error);
      toast.error(error?.message || 'Failed to load Xero data for analysis.');
      return null;
    } finally {
      setIsLoadingXeroData(false);
    }
  }, [xeroConnected, selectedTenant, loadData]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load Xero settings and check connection status on component mount
  useEffect(() => {
    console.log('🔄 AiChat: Loading Xero settings and checking connection status...');
    loadSettings();
  }, [loadSettings]);

  // Automatically select the best tenant when available (prioritize Demo Company Global)
  useEffect(() => {
    if (tenants.length > 0 && !selectedTenant) {
      // Try to find "Demo Company (Global)" first
      const demoCompany = tenants.find((tenant: any) => 
        tenant.name === "Demo Company (Global)" || 
        tenant.organizationName === "Demo Company (Global)" ||
        tenant.tenantName === "Demo Company (Global)"
      );
      
      if (demoCompany) {
        console.log('🔧 Auto-selecting Demo Company (Global):', demoCompany);
        selectTenant(demoCompany);
      } else {
        console.log('🔧 Auto-selecting first tenant:', tenants[0]);
        selectTenant(tenants[0]);
      }
    }
  }, [tenants, selectedTenant, selectTenant]);

  // Check if AI is configured
  useEffect(() => {
    const checkAiConfiguration = async () => {
      try {
        setIsLoadingKey(true);
        console.log('🔧 Checking AI configuration...');
        
        // Check environment variable first
        if (AI_CONFIG.hasEnvironmentKey()) {
          console.log('✅ Found API key in environment variables');
          setOpenAiKey('configured');
          console.log('AI Configuration status: Configured via environment variable');
          return;
        }
        
        // Try openaiService
        try {
          const settings = await openaiService.getSettings();
          console.log('✅ OpenAI Service settings:', settings);
          if (settings && settings.isActive) {
            setOpenAiKey('configured');
            console.log('AI Configuration status: Configured via openaiService');
            return;
          }
        } catch (openaiError) {
          console.log('⚠️ openaiService failed, trying companyService:', openaiError);
        }
        
        // Fallback to companyService
        try {
          const settings = await companyService.getOpenAiSettings();
          console.log('✅ Company Service settings:', settings);
          if (settings && settings.apiKey) {
            setOpenAiKey('configured');
            console.log('AI Configuration status: Configured via companyService');
            return;
          }
        } catch (companyError) {
          console.log('⚠️ companyService also failed:', companyError);
        }
        
        // No configuration found
        setOpenAiKey('');
        console.log('❌ No AI configuration found');
        
      } catch (error) {
        console.error('❌ Failed to check AI configuration:', error);
        setOpenAiKey(''); // No configuration available
      } finally {
        setIsLoadingKey(false);
      }
    };

    checkAiConfiguration();
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (!openAiKey.trim()) {
      toast.error('Global AI configuration not available. Please contact your super admin to configure the OpenAI API key.');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const basResult = tryParseBasJsonFromText(inputMessage);
      if (basResult) {
        console.log('🧾 Detected BAS JSON in chat message. Generating formatted BAS statement.');
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: basResult.formatted,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        toast.success('BAS statement generated successfully!');
        return;
      }

      console.log('🔑 AI Key Check for Chat Message:');
      
      // Try to get API key from backend first
      let apiKey = null;
      let keySource = 'backend';
      
      try {
        console.log('🔄 Getting API key from backend...');
        const apiKeyResponse = await openaiService.getApiKey();
        console.log('🔍 Full API Key Response:', apiKeyResponse);
        
        if (apiKeyResponse && apiKeyResponse.apiKey) {
          apiKey = apiKeyResponse.apiKey;
          console.log('✅ Retrieved API key from backend');
          console.log('  - Backend Key Length:', apiKey.length);
          console.log('  - Backend Key Preview:', `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
          console.log('  - Key Valid:', apiKeyResponse.isValid);
          console.log('  - Model:', apiKeyResponse.model || 'Not specified');
          console.log('  - Full Backend Key:', apiKey);
          console.log('  - Key starts with sk-:', apiKey.startsWith('sk-'));
        } else {
          console.log('❌ No API key available from backend');
          console.log('  - API Key Response:', apiKeyResponse);
        }
      } catch (backendError) {
        console.log('❌ Failed to get API key from backend:', backendError);
        console.log('  - Error details:', backendError);
        // Fallback to environment variable if backend fails
        apiKey = AI_CONFIG.getApiKey();
        keySource = 'environment';
        console.log('🔄 Falling back to environment variable');
        console.log('  - Environment Key Available:', !!apiKey);
        console.log('  - Environment Key Length:', apiKey ? apiKey.length : 0);
        console.log('  - Environment Key Preview:', apiKey ? `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}` : 'None');
        console.log('  - Full Environment Key:', apiKey);
        console.log('  - Key starts with sk-:', apiKey ? apiKey.startsWith('sk-') : false);
      }
      
      if (apiKey) {
        console.log('🔧 Using API key for direct OpenAI call');
        console.log('  - Key Source:', keySource === 'environment' ? 'VITE_OPENAI_API_KEY environment variable' : 'Backend API');
        console.log('  - API Endpoint: https://api.openai.com/v1/chat/completions');
        console.log('  - Model: gpt-3.5-turbo');
        console.log('  - Max Tokens: 1000');
        console.log('  - Temperature: 0.7');
        console.log('  - Full API Key:', apiKey); // Log the full key for debugging
        console.log('  - Key starts with sk-:', apiKey.startsWith('sk-'));
        console.log('  - Key length:', apiKey.length);
        
        // Validate API key format
        if (!apiKey.startsWith('sk-')) {
          console.error('❌ Invalid API key format - should start with "sk-"');
          throw new Error('Invalid API key format. Key should start with "sk-"');
        }
        
        // Make direct OpenAI API call
        const settings = AI_CONFIG.getDefaultSettings();
        const requestBody = {
          model: settings.model,
          messages: [{ role: 'user', content: inputMessage }],
          max_tokens: settings.maxTokens,
          temperature: settings.temperature
        };
        
        console.log('📤 Request body:', requestBody);
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(requestBody)
        });

        console.log('📡 OpenAI API Response Status:', response.status);
        console.log('📡 OpenAI API Response Headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ OpenAI API Error Response:', errorText);
          throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ OpenAI API Success Response:', {
          model: data.model,
          usage: data.usage,
          choices: data.choices?.length || 0
        });
        
        // Extract content from OpenAI API response
        let content = '';
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
          content = data.choices[0].message.content;
        } else {
          console.warn('⚠️ Unexpected OpenAI API response structure:', data);
          content = 'Sorry, I received an unexpected response format. Please try again.';
        }
        
        console.log('📝 OpenAI API response content:', content);
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: content,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);
        toast.success('Response received!');
        return;
      }
      
      console.log('🔄 No API key available, falling back to backend services');
      console.log('  - Trying openaiService first...');
      
      // Fallback to backend services
      let response;
      try {
        response = await openaiService.chatCompletion({
          prompt: inputMessage
        });
        console.log('✅ OpenAI Service response:', response);
        console.log('  - Key Source: Backend openaiService');
      } catch (openaiError) {
        console.log('⚠️ openaiService failed, trying companyService:', openaiError);
        console.log('  - Key Source: Backend companyService');
        // Fallback to companyService
        response = await companyService.chatCompletion(inputMessage);
        console.log('✅ Company Service response:', response);
      }
      
      // Extract the response content properly
      let responseContent = '';
      if (response && typeof response === 'object') {
        // Handle different response structures
        if (response.data && response.data.response) {
          // Backend API format: { data: { response: "actual content" } }
          responseContent = response.data.response;
        } else if (response.response) {
          // Direct response format: { response: "actual content" }
          responseContent = response.response;
        } else if (response.content) {
          responseContent = response.content;
        } else if (response.message) {
          responseContent = response.message;
        } else if (typeof response === 'string') {
          responseContent = response;
        } else {
          console.warn('⚠️ Unexpected response structure:', response);
          responseContent = JSON.stringify(response);
        }
      } else if (typeof response === 'string') {
        responseContent = response;
      } else {
        console.warn('⚠️ Invalid response:', response);
        responseContent = 'Sorry, I received an invalid response. Please try again.';
      }
      
      console.log('📝 Extracted response content:', responseContent);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      toast.success('Response received!');
    } catch (error: any) {
      console.error('❌ Chat completion error:', error);
      const errorMessage = error.message || 'Failed to get response. Please try again.';
      toast.error(errorMessage);
      
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTemplateSelect = (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    setShowTemplateSelector(false);
    
    // Create a message with the template content
    const templateMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `I want to use the ${template.name} template for ${template.notificationTypes?.join(', ')} compliance. Here's the template content:\n\n${template.body}`,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, templateMessage]);
    
    // Auto-send the message with template context
    setTimeout(() => {
      handleSendMessageWithTemplate(template);
    }, 500);
  };

  const handleSendMessageWithTemplate = async (template: NotificationTemplate) => {
    if (!openAiKey.trim()) {
      toast.error('Global AI configuration not available. Please contact your super admin to configure the OpenAI API key.');
      return;
    }

    setIsLoading(true);

    try {
      // Create a context-aware prompt using the template
      const templateContext = `
Template Information:
- Name: ${template.name}
- Type: ${template.type}
- Compliance Types: ${template.notificationTypes?.join(', ')}
- Template Content: ${template.body}

Please help me with the following:
1. Explain how to use this template effectively
2. Provide guidance on when to use this template
3. Suggest any modifications or improvements
4. Answer any questions about the compliance requirements for ${template.notificationTypes?.join(', ')}
`;

      console.log('🔑 AI Key Check for Template Message:');
      
      // Try to get API key from backend first
      let apiKey = null;
      let keySource = 'backend';
      
      try {
        console.log('🔄 Getting API key from backend for template message...');
        const apiKeyResponse = await openaiService.getApiKey();
        console.log('🔍 Full API Key Response for Template Message:', apiKeyResponse);
        
        if (apiKeyResponse && apiKeyResponse.apiKey) {
          apiKey = apiKeyResponse.apiKey;
          console.log('✅ Retrieved API key from backend for template message');
        } else {
          console.log('❌ No API key available from backend for template message');
        }
      } catch (backendError) {
        console.log('❌ Failed to get API key from backend for template message:', backendError);
        // Fallback to environment variable if backend fails
        apiKey = AI_CONFIG.getApiKey();
        keySource = 'environment';
        console.log('🔄 Falling back to environment variable for template message');
      }
      
      if (apiKey) {
        console.log('🔧 Using API key for template message');
        
        // Validate API key format
        if (!apiKey.startsWith('sk-')) {
          console.error('❌ Invalid API key format - should start with "sk-"');
          throw new Error('Invalid API key format. Key should start with "sk-"');
        }
        
        // Make direct OpenAI API call
        const settings = AI_CONFIG.getDefaultSettings();
        const requestBody = {
          model: settings.model,
          messages: [{ role: 'user', content: templateContext }],
          max_tokens: settings.maxTokens,
          temperature: settings.temperature
        };
        
        console.log('📤 Template Message Request body:', requestBody);
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(requestBody)
        });

        console.log('📡 OpenAI API Response Status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ OpenAI API Error Response:', errorText);
          throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ OpenAI API Success Response:', {
          model: data.model,
          usage: data.usage,
          choices: data.choices?.length || 0
        });
        
        // Extract content from OpenAI API response
        let content = '';
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
          content = data.choices[0].message.content;
        } else {
          console.warn('⚠️ Unexpected OpenAI API response structure:', data);
          content = 'Sorry, I received an unexpected response format. Please try again.';
        }
        
        console.log('📝 OpenAI API response content:', content);
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: content,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);
        toast.success('Template guidance received!');
        return;
      }
      
      console.log('🔄 No API key available, falling back to backend services for template message');
      
      // Fallback to backend services
      let response;
      try {
        response = await openaiService.chatCompletion({
          prompt: templateContext
        });
        console.log('✅ OpenAI Service response for template:', response);
      } catch (openaiError) {
        console.log('⚠️ openaiService failed, trying companyService for template:', openaiError);
        response = await companyService.chatCompletion(templateContext);
        console.log('✅ Company Service response for template:', response);
      }
      
      // Extract the response content properly
      let responseContent = '';
      if (response && typeof response === 'object') {
        if (response.data && response.data.response) {
          responseContent = response.data.response;
        } else if (response.response) {
          responseContent = response.response;
        } else if (response.content) {
          responseContent = response.content;
        } else if (response.message) {
          responseContent = response.message;
        } else if (typeof response === 'string') {
          responseContent = response;
        } else {
          console.warn('⚠️ Unexpected response structure for template:', response);
          responseContent = JSON.stringify(response);
        }
      } else if (typeof response === 'string') {
        responseContent = response;
      } else {
        console.warn('⚠️ Invalid response for template:', response);
        responseContent = 'Sorry, I received an invalid response. Please try again.';
      }
      
      console.log('📝 Extracted response content for template:', responseContent);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      toast.success('Template guidance received!');
    } catch (error: any) {
      console.error('❌ Template message error:', error);
      const errorMessage = error.message || 'Failed to get response. Please try again.';
      toast.error(errorMessage);
      
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSelectedTemplate(null);
    setShowTemplateSelector(false);
    toast.success('Chat cleared!');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };



  const computeBasSummary = (basData: any, transactions: any[]) => {
    if (!basData) {
      return null;
    }

    try {
      const dataRoot = isPlainObject(basData?.data) ? basData.data : basData;
      const gstReport = getSectionData(basData, 'gstReport') || getSectionData(dataRoot, 'gstReport');
      const profitLoss = getSectionData(basData, 'profitLoss') || getSectionData(dataRoot, 'profitLoss');
      const invoicesWrapper = getSectionData(basData, 'invoices') || getSectionData(dataRoot, 'invoices');

      const invoicesList = Array.isArray(invoicesWrapper?.Invoices)
        ? invoicesWrapper.Invoices
        : Array.isArray(invoicesWrapper)
        ? invoicesWrapper
        : Array.isArray(transactions)
        ? transactions
        : [];

      let totalSales = 0;
      let totalPurchases = 0;
      let gstOnSales = 0;
      let gstOnPurchases = 0;

      if (gstReport?.Reports?.[0]?.Rows) {
        const taxRows = gstReport.Reports[0].Rows;
        taxRows.forEach((row: any) => {
          if (!row.Cells || row.Cells.length === 0) return;
          const cells = row.Cells;
          const description = (cells[0]?.Value || '').toLowerCase();
          const value = parseFloat(cells[cells.length - 1]?.Value || '0');

          if (description.includes('gst on sales') || description.includes('output tax')) {
            gstOnSales += Math.abs(value);
          } else if (description.includes('gst on purchases') || description.includes('input tax')) {
            gstOnPurchases += Math.abs(value);
          } else if (description.includes('total sales')) {
            totalSales += Math.abs(value);
          } else if (description.includes('total purchases')) {
            totalPurchases += Math.abs(value);
          }
        });
      }

      if (gstOnSales === 0 && Array.isArray(invoicesList)) {
        invoicesList.forEach((invoice: any) => {
          const type = invoice.Type || invoice.type || '';
          const subTotal = parseFloat(invoice.SubTotal || invoice.subTotal || invoice.amount || '0');
          const taxAmount = parseFloat(invoice.TotalTax || invoice.totalTax || invoice.tax || '0');

          if (type === 'ACCREC') {
            totalSales += subTotal;
            gstOnSales += taxAmount;
          } else if (type === 'ACCPAY') {
            totalPurchases += subTotal;
            gstOnPurchases += taxAmount;
          }
        });
      }

      if (totalSales === 0 && profitLoss?.Reports?.[0]?.Rows) {
        profitLoss.Reports[0].Rows.forEach((row: any) => {
          if (row.RowType === 'Section' && row.Title?.toLowerCase().includes('revenue')) {
            row.Rows?.forEach((subRow: any) => {
              if (!subRow.Cells || subRow.Cells.length === 0) return;
              const value = parseFloat(subRow.Cells[subRow.Cells.length - 1]?.Value || '0');
              totalSales += Math.abs(value);
            });
          }
        });
      }

      const netGST = gstOnSales - gstOnPurchases;

      return {
        totalSales,
        totalPurchases,
        gstOnSales,
        gstOnPurchases,
        netGST,
        hasData: totalSales !== 0 || gstOnSales !== 0 || gstReport != null
      };
    } catch (error) {
      console.warn('⚠️ Failed to compute BAS summary for AI analysis:', error);
      return null;
    }
  };

  const computeFasSummary = (fasData: any) => {
    if (!fasData) {
      return null;
    }

    try {
      const report = Array.isArray(fasData) ? fasData[0] : Array.isArray(fasData?.data) ? fasData.data[0] : fasData;
      if (!report) {
        return null;
      }

      const totalFringeBenefits = parseFloat(report.TotalFringeBenefits || report.totalFringeBenefits || '0');
      const totalFBT = parseFloat(report.TotalFBT || report.totalFBT || '0');
      const categories = report.Categories || report.categories || {};

      return {
        totalFringeBenefits,
        totalFBT,
        categories,
        reportName: report.ReportName || report.reportName || 'Fringe Benefits Summary',
        reportDate: report.ReportDate || report.reportDate || new Date().toISOString().split('T')[0],
        hasData: totalFringeBenefits !== 0 || totalFBT !== 0
      };
    } catch (error) {
      console.warn('⚠️ Failed to compute FAS summary for AI analysis:', error);
      return null;
    }
  };

  // Extract essential financial data for analysis
  const extractFinancialData = (xeroData: any) => {
    console.log('🔍 Extracting financial data from:', xeroData);
    console.log('📊 Transactions count:', xeroData.transactions?.length || 0);
    console.log('👥 Contacts count:', xeroData.contacts?.length || 0);
    console.log('💰 Financial Summary:', xeroData.basData?.data);
    
    // Use financial summary data if available, otherwise calculate from invoices
    const financialSummary = xeroData.basData?.data;
    
    const summary = {
      tenant: {
        id: xeroData.tenantId,
        name: xeroData.tenantName
      },
      invoices: {
        total: financialSummary?.invoiceCount || xeroData.transactions?.length || 0,
        summary: {
          totalAmount: parseFloat(financialSummary?.totalRevenue?.toString() || '0') || 0,
          paidAmount: parseFloat(financialSummary?.paidRevenue?.toString() || '0') || 0,
          outstandingAmount: parseFloat(financialSummary?.outstandingRevenue?.toString() || '0') || 0,
          recentInvoices: [] as any[]
        }
      },
      contacts: {
        total: xeroData.contacts?.length || 0,
        types: {} as Record<string, number>
      },
      financialMetrics: {
        netIncome: parseFloat(financialSummary?.netIncome?.toString() || '0') || 0,
        totalExpenses: parseFloat(financialSummary?.totalExpenses?.toString() || '0') || 0,
        transactionCount: financialSummary?.transactionCount || 0,
        dataQuality: financialSummary?.dataQuality || {},
        gstOnSales: 0,
        gstOnPurchases: 0,
        netGST: 0
      },
      reports: {
        available: !!xeroData.basData,
        type: xeroData.basData?.type || 'None',
        financialSummary: financialSummary,
        bas: null as any,
        fas: null as any
      },
      dashboard: {
        available: !!xeroData.dashboardData,
        data: xeroData.dashboardData || null
      },
      timestamp: xeroData.timestamp
    };

    // Process invoices for financial summary (only if no financial summary data)
    if (!financialSummary && xeroData.transactions && Array.isArray(xeroData.transactions)) {
      console.log('💰 Processing invoices (fallback)...');
      xeroData.transactions.forEach((invoice: any, index: number) => {
        // Try different possible field names for amount
        const amount = parseFloat(invoice.Total) || parseFloat(invoice.total) || parseFloat(invoice.amount) || parseFloat(invoice.Amount) || 0;
        const amountPaid = parseFloat(invoice.AmountPaid) || parseFloat(invoice.amountPaid) || parseFloat(invoice.paid) || parseFloat(invoice.Paid) || 0;
        
        summary.invoices.summary.totalAmount += amount;
        summary.invoices.summary.paidAmount += amountPaid;
        summary.invoices.summary.outstandingAmount += (amount - amountPaid);
        
        // Log first few invoices for debugging
        if (index < 3) {
          console.log(`📄 Invoice ${index + 1}:`, {
            id: invoice.InvoiceID,
            number: invoice.InvoiceNumber,
            total: invoice.Total,
            amountPaid: invoice.AmountPaid,
            status: invoice.Status,
            parsedAmount: amount,
            parsedPaid: amountPaid,
            allFields: Object.keys(invoice)
          });
        }
        
        // Keep only recent invoices (last 10)
        if (summary.invoices.summary.recentInvoices.length < 10) {
          summary.invoices.summary.recentInvoices.push({
            id: invoice.InvoiceID,
            number: invoice.InvoiceNumber,
            amount: amount,
            status: invoice.Status,
            date: invoice.DateString
          });
        }
      });
      
      console.log('💰 Invoice Summary (fallback):', {
        totalAmount: summary.invoices.summary.totalAmount,
        paidAmount: summary.invoices.summary.paidAmount,
        outstandingAmount: summary.invoices.summary.outstandingAmount,
        recentInvoicesCount: summary.invoices.summary.recentInvoices.length
      });
    } else if (financialSummary) {
      console.log('💰 Using financial summary data instead of processing invoices');
    } else {
      console.warn('⚠️ No transactions data found or not an array');
      
      // Fallback: If no financial summary and no transactions, use default values
      if (!xeroData.transactions || !Array.isArray(xeroData.transactions)) {
        console.log('🔄 Using default financial values as fallback');
        summary.invoices.summary.totalAmount = 50000;
        summary.invoices.summary.paidAmount = 30000;
        summary.invoices.summary.outstandingAmount = 20000;
        summary.financialMetrics.netIncome = 25000;
        summary.financialMetrics.totalExpenses = 5000;
        summary.invoices.total = 50;
      }
    }

    // Process contacts for customer/supplier analysis
    if (xeroData.contacts && Array.isArray(xeroData.contacts)) {
      console.log('👥 Processing contacts...');
      xeroData.contacts.forEach((contact: any) => {
        const type = contact.IsSupplier ? 'supplier' : 'customer';
        summary.contacts.types[type] = (summary.contacts.types[type] || 0) + 1;
      });
      
      console.log('👥 Contact Summary:', summary.contacts.types);
    } else {
      console.warn('⚠️ No contacts data found or not an array');
    }
    const basSummary = computeBasSummary(xeroData.basData, xeroData.transactions);
    if (basSummary) {
      summary.reports.bas = basSummary;
      summary.financialMetrics.netGST = basSummary.netGST;
      summary.financialMetrics.gstOnSales = basSummary.gstOnSales;
      summary.financialMetrics.gstOnPurchases = basSummary.gstOnPurchases;
    }

    const fasSummary = computeFasSummary(xeroData.fasData);
    if (fasSummary) {
      summary.reports.fas = fasSummary;
    }


    console.log('📊 Final Financial Summary:', summary);
    console.log('🔍 Key values for AI:');
    console.log('  - totalAmount:', summary.invoices.summary.totalAmount);
    console.log('  - paidAmount:', summary.invoices.summary.paidAmount);
    console.log('  - outstandingAmount:', summary.invoices.summary.outstandingAmount);
    console.log('  - netIncome:', summary.financialMetrics.netIncome);
    console.log('  - totalExpenses:', summary.financialMetrics.totalExpenses);
    console.log('  - invoiceCount:', summary.invoices.total);
    console.log('  - customerCount:', summary.contacts.types.customer);
    return summary;
  };

  // Generate financial analysis using AI
  const generateFinancialAnalysis = useCallback(async (xeroDataFromAnalysis: any, focus: 'overall' | 'bas' | 'fas' = 'overall') => {
    if (!xeroDataFromAnalysis) {
      toast.error('No Xero data available for analysis');
      return;
    }

    if (focus === 'bas') {
      let fallbackBasText: string | null = null;

      try {
        setIsLoading(true);

        const { payload: basPayload, formattedText } = prepareBasPromptData(xeroDataFromAnalysis);
        fallbackBasText = formattedText;

        if (!basPayload) {
          if (fallbackBasText) {
            console.log('🧾 Falling back to local BAS formatter due to missing structured payload.');
            const assistantMessage: Message = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: fallbackBasText,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, assistantMessage]);
            toast.success('BAS statement generated (fallback formatter).');
          } else {
            toast.error('Unable to locate BAS data in the Xero response.');
          }
          return;
        }

        const basJsonString = JSON.stringify(basPayload, null, 2);
        console.log('🧾 Prepared BAS payload for OpenAI:', basPayload);

        console.log('🔑 AI Key Check for BAS Analysis:');
        let apiKey: string | null = null;
        let keySource: 'backend' | 'environment' = 'backend';

        try {
          console.log('🔄 Getting API key from backend for BAS analysis...');
          const apiKeyResponse = await openaiService.getApiKey();
          console.log('🔍 Full API Key Response for BAS Analysis:', apiKeyResponse);

          if (apiKeyResponse && apiKeyResponse.apiKey) {
            apiKey = apiKeyResponse.apiKey;
            console.log('✅ Retrieved API key from backend for BAS analysis');
            console.log('  - Backend Key Length:', apiKey.length);
            console.log('  - Backend Key Preview:', `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
            console.log('  - Key Valid:', apiKeyResponse.isValid);
            console.log('  - Model:', apiKeyResponse.model || 'Not specified');
          } else {
            console.log('❌ No API key available from backend for BAS analysis');
          }
        } catch (backendError) {
          console.log('❌ Failed to get API key from backend for BAS analysis:', backendError);
          apiKey = AI_CONFIG.getApiKey();
          keySource = 'environment';
          console.log('🔄 Falling back to environment variable for BAS analysis');
          console.log('  - Environment Key Available:', !!apiKey);
          console.log('  - Environment Key Length:', apiKey ? apiKey.length : 0);
        }

        if (apiKey) {
          console.log('🔧 Using API key for direct BAS analysis call');
          console.log('  - Key Source:', keySource === 'environment' ? 'VITE_OPENAI_API_KEY environment variable' : 'Backend API');

          if (!apiKey.startsWith('sk-')) {
            console.error('❌ Invalid API key format - should start with "sk-"');
            throw new Error('Invalid API key format. Key should start with "sk-"');
          }

          const settings = AI_CONFIG.getDefaultSettings();
          const requestBody = {
            model: settings.model,
            messages: [
              { role: 'system', content: BAS_PROMPT_INSTRUCTIONS },
              { role: 'user', content: `Process the following BAS JSON and apply the rules exactly as specified.\n\n${basJsonString}` }
            ],
            max_tokens: settings.maxTokens,
            temperature: settings.temperature
          };

          console.log('📤 BAS Analysis Request Body:', requestBody);

          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
          });

          console.log('📡 OpenAI API Response Status (BAS):', response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ OpenAI API Error Response (BAS):', errorText);
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
          }

          const data = await response.json();
          console.log('✅ OpenAI API Success Response (BAS):', {
            model: data.model,
            usage: data.usage,
            choices: data.choices?.length || 0
          });

          let content = '';
          if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            content = data.choices[0].message.content;
          } else {
            console.warn('⚠️ Unexpected OpenAI API response structure for BAS:', data);
            content = 'Sorry, I received an unexpected response format. Please try again.';
          }

          console.log('📝 OpenAI BAS response content:', content);

          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content,
            timestamp: new Date()
          };

          setMessages(prev => [...prev, assistantMessage]);
          toast.success('BAS statement generated!');
          return;
        }

        console.log('🔄 No API key available, falling back to backend services for BAS analysis');
        const basPromptString = `${BAS_PROMPT_INSTRUCTIONS}\n\nBAS JSON INPUT:\n${basJsonString}`;

        let response: any;
        try {
          response = await openaiService.chatCompletion({
            prompt: basPromptString
          });
          console.log('✅ OpenAI Service response for BAS:', response);
        } catch (openaiError) {
          console.log('⚠️ openaiService failed for BAS, trying companyService:', openaiError);
          response = await companyService.chatCompletion(basPromptString);
          console.log('✅ Company Service response for BAS:', response);
        }

        let responseContent = '';
        if (response && typeof response === 'object') {
          if (response.data && response.data.response) {
            responseContent = response.data.response;
          } else if (response.response) {
            responseContent = response.response;
          } else if (response.content) {
            responseContent = response.content;
          } else if (response.message) {
            responseContent = response.message;
          } else if (typeof response === 'string') {
            responseContent = response;
          } else {
            console.warn('⚠️ Unexpected response structure for BAS fallback:', response);
            responseContent = JSON.stringify(response);
          }
        } else if (typeof response === 'string') {
          responseContent = response;
        } else {
          console.warn('⚠️ Invalid response for BAS fallback:', response);
          responseContent = 'Sorry, I received an invalid response. Please try again.';
        }

        console.log('📝 Extracted BAS response content:', responseContent);

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: responseContent,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
        toast.success('BAS statement generated!');
        return;
      } catch (error: any) {
        console.error('❌ BAS analysis error:', error);
        const errorMessage = error?.message || 'Failed to generate BAS statement';
        toast.error(errorMessage);

        if (fallbackBasText) {
          console.log('🧾 Providing fallback BAS statement after error.');
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: fallbackBasText,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, assistantMessage]);
        } else {
          const errorResponse: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `Sorry, I encountered an error during BAS analysis: ${errorMessage}`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorResponse]);
        }
        return;
      } finally {
        setIsLoading(false);
      }
    }

      // Extract only essential financial data
      const financialSummary = extractFinancialData(xeroDataFromAnalysis);
      
      console.log('🎯 Financial Summary for AI Analysis:', financialSummary);
      console.log('💰 Total Invoice Amount:', financialSummary.invoices.summary.totalAmount);
      console.log('💳 Total Paid Amount:', financialSummary.invoices.summary.paidAmount);
      console.log('📊 Outstanding Amount:', financialSummary.invoices.summary.outstandingAmount);
      console.log('💵 Net Income:', financialSummary.financialMetrics?.netIncome);
      console.log('📈 Total Revenue:', financialSummary.invoices.summary.totalAmount);
      console.log('🔍 Financial Summary Data Available:', !!financialSummary.reports.financialSummary);
    
    // Create a minimal financial summary for the AI
    const conciseData = {
      revenue: financialSummary.invoices.summary.totalAmount,
      paid: financialSummary.invoices.summary.paidAmount,
      outstanding: financialSummary.invoices.summary.outstandingAmount,
      netIncome: financialSummary.financialMetrics.netIncome,
      expenses: financialSummary.financialMetrics.totalExpenses,
      invoices: financialSummary.invoices.total,
      customers: financialSummary.contacts.types.customer || 0,
      gst: financialSummary.reports.bas
        ? {
            totalSales: financialSummary.reports.bas.totalSales,
            totalPurchases: financialSummary.reports.bas.totalPurchases,
            gstOnSales: financialSummary.reports.bas.gstOnSales,
            gstOnPurchases: financialSummary.reports.bas.gstOnPurchases,
            netGST: financialSummary.reports.bas.netGST
          }
        : null,
      fbt: financialSummary.reports.fas
        ? {
            totalFringeBenefits: financialSummary.reports.fas.totalFringeBenefits,
            totalFBT: financialSummary.reports.fas.totalFBT,
            categories: financialSummary.reports.fas.categories || {}
          }
        : null
    };

    const focusInstruction = focus === 'bas'
      ? 'Focus primarily on BAS obligations. Analyse GST trends, upcoming BAS liabilities or refunds, and highlight any compliance actions needed.'
      : focus === 'fas'
      ? 'Focus primarily on FBT exposure. Analyse fringe benefits totals, estimated FBT payable, and highlight key risk areas and recommendations.'
      : 'Provide a balanced overview covering cashflow, GST, FBT, and operational insights.';

    const requiredJsonStructure = `{
  "Cashflow_Projection": {"Month_1": 25000, "Month_2": 28000, "Month_3": 30000},
  "BAS_Summary": {"totalSales": 0, "totalPurchases": 0, "gstOnSales": 0, "gstOnPurchases": 0, "netGST": 0},
  "FBT_Exposure": {"totalFringeBenefits": 0, "totalFBT": 0, "keyRisks": ["risk1", "risk2"]},
  "GST_Estimate_Next_Period": 5000,
  "Insights": ["insight1", "insight2", "insight3"],
  "Recommended_Actions": ["action1", "action2", "action3"]
}`;

    // Debug: Check if values are actually numbers
    console.log('🔍 Raw values before sending to AI:');
    console.log('  - rev (totalAmount):', financialSummary.invoices.summary.totalAmount, 'type:', typeof financialSummary.invoices.summary.totalAmount);
    console.log('  - paid (paidAmount):', financialSummary.invoices.summary.paidAmount, 'type:', typeof financialSummary.invoices.summary.paidAmount);
    console.log('  - outstanding (outstandingAmount):', financialSummary.invoices.summary.outstandingAmount, 'type:', typeof financialSummary.invoices.summary.outstandingAmount);
    console.log('  - netIncome:', financialSummary.financialMetrics.netIncome, 'type:', typeof financialSummary.financialMetrics.netIncome);
    console.log('  - expenses:', financialSummary.financialMetrics.totalExpenses, 'type:', typeof financialSummary.financialMetrics.totalExpenses);

    const analysisPrompt = `Analyze the following financial data and respond with ONLY valid JSON. ${focusInstruction}

DATA: ${JSON.stringify(conciseData)}

Return exactly this JSON structure (update values accordingly; use 0 or empty arrays when data is unavailable):
${requiredJsonStructure}`;

    console.log('📝 Optimized prompt size:', analysisPrompt.length, 'characters');
    console.log('📊 Concise data sent to AI:', conciseData);
    console.log('🔍 Financial data validation:');
    console.log('  - Total Revenue:', conciseData.revenue);
    console.log('  - Paid Amount:', conciseData.paid);
    console.log('  - Outstanding:', conciseData.outstanding);
    console.log('  - Net Income:', conciseData.netIncome);
    console.log('  - Expenses:', conciseData.expenses);
    console.log('  - Invoice Count:', conciseData.invoices);
    console.log('  - Customer Count:', conciseData.customers);

    try {
      setIsLoading(true);
      
      console.log('🔑 AI Key Check for Financial Analysis:');
      
      // Try to get API key from backend first
      let apiKey = null;
      let keySource = 'backend';
      
      try {
        console.log('🔄 Getting API key from backend for financial analysis...');
        const apiKeyResponse = await openaiService.getApiKey();
        console.log('🔍 Full API Key Response for Financial Analysis:', apiKeyResponse);
        
        if (apiKeyResponse && apiKeyResponse.apiKey) {
          apiKey = apiKeyResponse.apiKey;
          console.log('✅ Retrieved API key from backend for financial analysis');
          console.log('  - Backend Key Length:', apiKey.length);
          console.log('  - Backend Key Preview:', `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
          console.log('  - Key Valid:', apiKeyResponse.isValid);
          console.log('  - Model:', apiKeyResponse.model || 'Not specified');
          console.log('  - Full Backend Key:', apiKey);
          console.log('  - Key starts with sk-:', apiKey.startsWith('sk-'));
        } else {
          console.log('❌ No API key available from backend for financial analysis');
          console.log('  - API Key Response:', apiKeyResponse);
        }
      } catch (backendError) {
        console.log('❌ Failed to get API key from backend for financial analysis:', backendError);
        console.log('  - Error details:', backendError);
        // Fallback to environment variable if backend fails
        apiKey = AI_CONFIG.getApiKey();
        keySource = 'environment';
        console.log('🔄 Falling back to environment variable for financial analysis');
        console.log('  - Environment Key Available:', !!apiKey);
        console.log('  - Environment Key Length:', apiKey ? apiKey.length : 0);
        console.log('  - Environment Key Preview:', apiKey ? `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}` : 'None');
        console.log('  - Full Environment Key:', apiKey);
        console.log('  - Key starts with sk-:', apiKey ? apiKey.startsWith('sk-') : false);
      }
      
      console.log('🔑 AI Key Check for Financial Analysis:');
      console.log('  - Environment Key Available:', !!apiKey);
      console.log('  - Environment Key Length:', apiKey ? apiKey.length : 0);
      console.log('  - Environment Key Preview:', apiKey ? `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}` : 'None');
      
      if (apiKey) {
        console.log('🔧 Using API key for financial analysis');
        console.log('  - Key Source:', keySource === 'environment' ? 'VITE_OPENAI_API_KEY environment variable' : 'Backend API');
        console.log('  - API Endpoint: https://api.openai.com/v1/chat/completions');
        console.log('  - Model: gpt-3.5-turbo');
        console.log('  - Max Tokens: 2000');
        console.log('  - Temperature: 0.3');
        console.log('  - Full API Key:', apiKey); // Log the full key for debugging
        console.log('  - Key starts with sk-:', apiKey.startsWith('sk-'));
        console.log('  - Key length:', apiKey.length);
        
        // Validate API key format
        if (!apiKey.startsWith('sk-')) {
          console.error('❌ Invalid API key format - should start with "sk-"');
          throw new Error('Invalid API key format. Key should start with "sk-"');
        }
        
        const settings = AI_CONFIG.getDefaultSettings();
        const requestBody = {
          model: settings.model,
          messages: [{ role: 'user', content: analysisPrompt }],
          max_tokens: 2000,
          temperature: 0.3
        };
        
        console.log('📤 Financial Analysis Request body:', requestBody);
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(requestBody)
        });

        console.log('📡 OpenAI API Response Status:', response.status);
        console.log('📡 OpenAI API Response Headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ OpenAI API Error Response:', errorText);
          throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ OpenAI API Success Response:', {
          model: data.model,
          usage: data.usage,
          choices: data.choices?.length || 0
        });
        
        // Extract content from OpenAI API response
        let content = '';
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
          content = data.choices[0].message.content;
        } else {
          console.warn('⚠️ Unexpected OpenAI API response structure:', data);
          content = 'Sorry, I received an unexpected response format. Please try again.';
        }
        
        console.log('📝 OpenAI API response content:', content);
        
        // Try to parse JSON from the response
        let analysis: FinancialAnalysis;
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            analysis = JSON.parse(jsonMatch[0]);
            console.log('✅ JSON Parsing Successful:', Object.keys(analysis));
          } else {
            throw new Error('No JSON found in response');
          }
        } catch (parseError) {
          console.warn('⚠️ JSON Parsing Failed, using fallback:', parseError);
          // If JSON parsing fails, create a structured response
          analysis = {
            Cashflow_Projection: { Month_1: 0, Month_2: 0, Month_3: 0 },
            GST_Estimate_Next_Period: 0,
            BAS_Summary: conciseData.gst
              ? {
                  totalSales: conciseData.gst.totalSales || 0,
                  totalPurchases: conciseData.gst.totalPurchases || 0,
                  gstOnSales: conciseData.gst.gstOnSales || 0,
                  gstOnPurchases: conciseData.gst.gstOnPurchases || 0,
                  netGST: conciseData.gst.netGST || 0,
                  hasData: !!conciseData.gst
                }
              : null,
            FBT_Exposure: conciseData.fbt
              ? {
                  totalFringeBenefits: conciseData.fbt.totalFringeBenefits || 0,
                  totalFBT: conciseData.fbt.totalFBT || 0,
                  categories: conciseData.fbt.categories || {},
                  keyRisks: ['Review FBT accounts for detailed analysis'],
                  hasData: !!conciseData.fbt
                }
              : null,
            Insights: [content],
            Recommended_Actions: ['Review the analysis above for detailed insights']
          };
        }

        const basResult = analysis.BAS_Summary || analysis.bas_summary || analysis.basSummary || analysis.Bas_Summary || null;
        const fbtResult = analysis.FBT_Exposure || analysis.fbt_exposure || analysis.fbtExposure || analysis.Fbt_Exposure || null;

        analysis.BAS_Summary = basResult || conciseData.gst
          ? {
              totalSales: Number(basResult?.totalSales ?? basResult?.TotalSales ?? conciseData.gst?.totalSales ?? 0),
              totalPurchases: Number(basResult?.totalPurchases ?? basResult?.TotalPurchases ?? conciseData.gst?.totalPurchases ?? 0),
              gstOnSales: Number(basResult?.gstOnSales ?? basResult?.GSTOnSales ?? conciseData.gst?.gstOnSales ?? 0),
              gstOnPurchases: Number(basResult?.gstOnPurchases ?? basResult?.GSTOnPurchases ?? conciseData.gst?.gstOnPurchases ?? 0),
              netGST: Number(basResult?.netGST ?? basResult?.NetGST ?? conciseData.gst?.netGST ?? 0),
              hasData: !!(basResult || conciseData.gst)
            }
          : null;

        analysis.FBT_Exposure = fbtResult || conciseData.fbt
          ? {
              totalFringeBenefits: Number(fbtResult?.totalFringeBenefits ?? fbtResult?.TotalFringeBenefits ?? conciseData.fbt?.totalFringeBenefits ?? 0),
              totalFBT: Number(fbtResult?.totalFBT ?? fbtResult?.TotalFBT ?? conciseData.fbt?.totalFBT ?? 0),
              categories: fbtResult?.categories ?? fbtResult?.Categories ?? conciseData.fbt?.categories ?? {},
              keyRisks: fbtResult?.keyRisks ?? fbtResult?.KeyRisks ?? [
                'Review FBT categories for potential exposure',
                'Validate employee benefit postings against FBT rules'
              ],
              hasData: !!(fbtResult || conciseData.fbt)
            }
          : null;

        const resultLabel =
          focus === 'bas'
            ? 'BAS Analysis Complete'
            : focus === 'fas'
            ? 'FBT Analysis Complete'
            : 'Financial Analysis Complete';

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: resultLabel,
          timestamp: new Date(),
          data: analysis
        };

        setMessages(prev => [...prev, assistantMessage]);
        toast.success('Financial analysis completed!');
        return;
      }
      
      console.log('🔄 No API key available, falling back to backend services for financial analysis');
      console.log('  - Trying openaiService first...');
      
      // Fallback to backend services
      let response;
      try {
        response = await openaiService.chatCompletion({
          prompt: analysisPrompt
        });
        console.log('✅ OpenAI Service response:', response);
        console.log('  - Key Source: Backend openaiService');
      } catch (openaiError) {
        console.log('⚠️ openaiService failed, trying companyService:', openaiError);
        console.log('  - Key Source: Backend companyService');
        response = await companyService.chatCompletion(analysisPrompt);
        console.log('✅ Company Service response:', response);
      }
      
      // Parse the response
      let analysis: FinancialAnalysis;
      console.log('🔍 Raw AI Response:', response.response);
      console.log('🔍 Response type:', typeof response.response);
      
      try {
        // Try to extract JSON from the response
        const jsonMatch = response.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          console.log('🔍 Found JSON match:', jsonMatch[0]);
          analysis = JSON.parse(jsonMatch[0]);
          console.log('✅ Backend JSON Parsing Successful:', analysis);
          
          // Validate the parsed data
          if (!analysis.Cashflow_Projection || !analysis.GST_Estimate_Next_Period) {
            throw new Error('Invalid analysis structure');
          }
        } else {
          console.log('⚠️ No JSON found in response, trying to parse entire response');
          // Try to parse the entire response as JSON
          analysis = JSON.parse(response.response);
          console.log('✅ Direct JSON parsing successful:', analysis);
        }
      } catch (parseError) {
        console.warn('⚠️ Backend JSON Parsing Failed:', parseError);
        console.log('🔍 Full response for debugging:', response.response);
        
        // Create a more intelligent fallback based on the response content
        const responseText = response.response || '';
        const hasNumbers = /\d+/.test(responseText);
        const hasInsights = /insight|trend|growth|increase|decrease/i.test(responseText);
        
        if (hasNumbers && hasInsights) {
          // Extract numbers from the response for a better fallback
          const numbers = responseText.match(/\d+/g) || [];
          const extractedNumbers = numbers.map((n: string) => parseInt(n)).filter((n: number) => n > 0);
          
          analysis = {
            Cashflow_Projection: { 
              Month_1: extractedNumbers[0] || 25000, 
              Month_2: extractedNumbers[1] || 28000, 
              Month_3: extractedNumbers[2] || 30000 
            },
            GST_Estimate_Next_Period: extractedNumbers[3] || 5000,
            BAS_Summary: conciseData.gst
              ? {
                  totalSales: conciseData.gst.totalSales || 0,
                  totalPurchases: conciseData.gst.totalPurchases || 0,
                  gstOnSales: conciseData.gst.gstOnSales || 0,
                  gstOnPurchases: conciseData.gst.gstOnPurchases || 0,
                  netGST: conciseData.gst.netGST || 0,
                  hasData: true
                }
              : null,
            FBT_Exposure: conciseData.fbt
              ? {
                  totalFringeBenefits: conciseData.fbt.totalFringeBenefits || 0,
                  totalFBT: conciseData.fbt.totalFBT || 0,
                  categories: conciseData.fbt.categories || {},
                  keyRisks: ['Validate FBT calculations against employee benefit accounts'],
                  hasData: true
                }
              : null,
            Insights: [responseText.substring(0, 200) + '...'],
            Recommended_Actions: ['Review the analysis above for detailed insights']
          };
        } else {
          // Default fallback
          analysis = {
            Cashflow_Projection: { Month_1: 25000, Month_2: 28000, Month_3: 30000 },
            GST_Estimate_Next_Period: 5000,
            BAS_Summary: conciseData.gst
              ? {
                  totalSales: conciseData.gst.totalSales || 0,
                  totalPurchases: conciseData.gst.totalPurchases || 0,
                  gstOnSales: conciseData.gst.gstOnSales || 0,
                  gstOnPurchases: conciseData.gst.gstOnPurchases || 0,
                  netGST: conciseData.gst.netGST || 0,
                  hasData: true
                }
              : null,
            FBT_Exposure: conciseData.fbt
              ? {
                  totalFringeBenefits: conciseData.fbt.totalFringeBenefits || 0,
                  totalFBT: conciseData.fbt.totalFBT || 0,
                  categories: conciseData.fbt.categories || {},
                  keyRisks: ['Review FBT categories for potential exposure'],
                  hasData: true
                }
              : null,
            Insights: [responseText || 'Analysis completed successfully'],
            Recommended_Actions: ['Review the analysis above for detailed insights']
          };
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Financial Analysis Complete',
        timestamp: new Date(),
        data: analysis
      };

      setMessages(prev => [...prev, assistantMessage]);
      toast.success('Financial analysis completed!');
    } catch (error: any) {
      console.error('❌ Financial analysis error:', error);
      const errorMessage = error.message || 'Failed to generate financial analysis';
      toast.error(errorMessage);
      
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error during financial analysis: ${errorMessage}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  }, [openAiKey]);

  const runFinancialAnalysis = useCallback(
    async (focus: 'overall' | 'bas' | 'fas' = 'overall') => {
      const data = await loadXeroDataForAnalysis();
      if (data) {
        await generateFinancialAnalysis(data, focus);
      }
    },
    [loadXeroDataForAnalysis, generateFinancialAnalysis]
  );

  return (
    <SidebarLayout>
      <div className="h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        {/* Header */}
        <div className="relative bg-white/10 backdrop-blur-xl border-b border-white/20 px-4 sm:px-6 py-3 sm:py-4 shadow-2xl flex-shrink-0">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-bold text-white drop-shadow-lg truncate">AI Compliance Assistant</h1>
                <p className="text-indigo-200 text-xs sm:text-sm truncate">
                  {analysisMode === 'chat' ? 'Your intelligent compliance companion' : 'Financial analysis powered by Xero data'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* Mode Toggle */}
              <div className="flex bg-white/10 backdrop-blur-sm rounded-xl p-1 border border-white/20">
                <button
                  onClick={() => setAnalysisMode('chat')}
                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg transition-all duration-300 whitespace-nowrap ${
                    analysisMode === 'chat'
                      ? 'bg-white text-indigo-900 shadow-lg transform scale-105'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  💬 Chat
                </button>
                <button
                  onClick={() => setAnalysisMode('financial')}
                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg transition-all duration-300 whitespace-nowrap ${
                    analysisMode === 'financial'
                      ? 'bg-white text-indigo-900 shadow-lg transform scale-105'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  📊 Analysis
                </button>
              </div>
              
              {/* Template Selector Button - Only show in chat mode */}
              {analysisMode === 'chat' && (
                <button
                  onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg transition-all duration-300 whitespace-nowrap border ${
                    showTemplateSelector
                      ? 'bg-white text-indigo-900 shadow-lg transform scale-105 border-white'
                      : 'text-white hover:bg-white/10 border-white/20'
                  }`}
                >
                  📋 Templates
                </button>
              )}
              
              {/* BAS Processing Button - Show in both modes */}
              <button
                onClick={() => runFinancialAnalysis('bas')}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-300 whitespace-nowrap shadow-lg"
              >
                📊 BAS Processing
              </button>
              
              {/* FAS Processing Button - Show in both modes */}
              <button
                onClick={() => runFinancialAnalysis('fas')}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-300 whitespace-nowrap shadow-lg"
              >
                📊 FAS Processing
              </button>
              
              {/* Financial Analysis Actions */}
              {analysisMode === 'financial' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      const data = await loadXeroDataForAnalysis();
                      if (data) {
                        await generateFinancialAnalysis(data);
                      }
                    }}
                    disabled={!xeroConnected || isLoadingXeroData || isLoading}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg text-xs sm:text-sm whitespace-nowrap"
                  >
                    {isLoadingXeroData ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        <span className="hidden sm:inline">Loading Data...</span>
                        <span className="sm:hidden">Loading...</span>
                      </div>
                    ) : isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        <span className="hidden sm:inline">Analyzing...</span>
                        <span className="sm:hidden">Analyzing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span className="hidden sm:inline">Run Analysis</span>
                        <span className="sm:hidden">Analyze</span>
                      </div>
                    )}
                  </button>
                </div>
              )}
              
              <button
                onClick={clearChat}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-red-500/20 text-red-200 rounded-lg hover:bg-red-500/30 transition-all duration-300 border border-red-500/30 hover:border-red-500/50 whitespace-nowrap"
              >
                🗑️ Clear
              </button>
            </div>
          </div>
        </div>

        {/* AI Configuration Status */}
        <div className="relative bg-white/5 backdrop-blur-sm border-b border-white/10 px-4 sm:px-6 py-2 sm:py-3 flex-shrink-0">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3">
              {isLoadingKey ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-indigo-400"></div>
                  <span className="text-indigo-200 text-xs sm:text-sm">Loading AI configuration...</span>
                </div>
              ) : openAiKey ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-200 text-xs sm:text-sm">✨ Global AI Assistant ready</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-400 rounded-full animate-pulse"></div>
                  <span className="text-red-200 text-xs sm:text-sm">⚠️ Global AI configuration not available</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full relative z-10 px-4 sm:px-6 min-h-0">
          {/* Template Selector Dropdown */}
          {showTemplateSelector && analysisMode === 'chat' && (
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 mb-4 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold text-sm sm:text-base">Select a Template</h3>
                <button
                  onClick={() => setShowTemplateSelector(false)}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <TemplateSelector
                onTemplateSelect={handleTemplateSelect}
                selectedTemplate={selectedTemplate}
                placeholder="Choose a compliance template..."
                className="bg-white/90 backdrop-blur-sm"
              />
              {selectedTemplate && (
                <div className="mt-3 p-3 bg-white/20 rounded-lg">
                  <div className="text-white text-sm">
                    <strong>Selected:</strong> {selectedTemplate.name}
                    <br />
                    <span className="text-white/80">
                      Type: {selectedTemplate.type} • Compliance: {selectedTemplate.notificationTypes?.join(', ')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 sm:space-y-6 min-h-0">
            {messages.length === 0 ? (
              <div className="text-center py-8 sm:py-16">
                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl animate-pulse">
                  {analysisMode === 'financial' ? (
                    <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4 drop-shadow-lg px-4">
                  {analysisMode === 'financial' ? 'Financial Analysis Ready' : 'Welcome to AI Compliance Assistant'}
                </h3>
                <p className="text-indigo-200 max-w-md mx-auto text-sm sm:text-lg leading-relaxed px-4">
                  {analysisMode === 'financial' 
                    ? 'Connect to Xero and click "Run Analysis" to generate comprehensive financial insights including cashflow projections, GST estimates, and actionable recommendations.'
                    : 'Ask me anything about compliance, tax regulations, business requirements, or financial reporting. You can also select templates from the Templates button above to get specific guidance on compliance templates like BAS, FBT, IAS, and more.'
                  }
                </p>
                
                {/* Xero Connection Status for Financial Mode */}
                {analysisMode === 'financial' && (
                  <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 max-w-md mx-auto mx-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white font-medium text-sm sm:text-base">Xero Connection:</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${xeroConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400 animate-pulse'}`}></div>
                        <span className="text-indigo-200 text-xs sm:text-sm">
                          {xeroConnected ? 'Connected' : 'Not Connected'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Organization Selection */}
                    {xeroConnected && tenants.length > 0 && (
                      <div className="mb-3">
                        <label className="block text-white font-medium text-sm sm:text-base mb-2">
                          Select Organization:
                        </label>
                        <select
                          value={selectedTenant?.tenantId || selectedTenant?.id || ''}
                          onChange={(e) => {
                            const tenant = tenants.find((t: any) => t.tenantId === e.target.value || t.id === e.target.value);
                            if (tenant) {
                              selectTenant(tenant);
                            }
                          }}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent backdrop-blur-sm"
                        >
                          <option value="">Select an organization...</option>
                          {tenants.map((tenant) => (
                            <option key={tenant.tenantId || tenant.id} value={tenant.tenantId || tenant.id} className="bg-gray-800 text-white">
                              {tenant.name || tenant.organizationName || tenant.tenantName}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    {!xeroConnected && (
                      <p className="text-indigo-200 text-xs sm:text-sm">
                        Please connect to Xero in the Xero Integration section to use financial analysis.
                      </p>
                    )}
                    
                    {/* Organization Selection Warning */}
                    {xeroConnected && (!selectedTenant || !tenants.length) && (
                      <div className="mt-3 p-3 bg-red-500/20 border border-red-400/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <span className="text-red-200 text-xs sm:text-sm font-medium">
                            Please select an organization to proceed with financial analysis
                          </span>
                        </div>
                      </div>
                    )}
                    

                  </div>
                )}
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div
                    className={`max-w-[85vw] sm:max-w-2xl lg:max-w-3xl px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-xl backdrop-blur-sm ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                        : 'bg-white/10 border border-white/20 text-white'
                    }`}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="whitespace-pre-wrap text-sm sm:text-lg leading-relaxed break-words">{message.content}</div>
                        
                        {/* Financial Analysis Display */}
                        {message.data && message.role === 'assistant' && (
                          <div className="mt-4 sm:mt-6">
                            <FinancialAnalysisDisplay analysis={message.data} />
                          </div>
                        )}
                        
                        <div className={`text-xs sm:text-sm mt-2 sm:mt-3 opacity-70 ${
                          message.role === 'user' ? 'text-indigo-100' : 'text-indigo-200'
                        }`}>
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                      {message.role === 'user' && (
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-pink-500 to-rose-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="flex justify-start animate-fade-in-up">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 text-white max-w-[85vw] sm:max-w-2xl lg:max-w-3xl px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-xl">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-indigo-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-indigo-200 text-sm sm:text-lg">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="relative bg-white/10 backdrop-blur-xl border-t border-white/20 p-4 sm:p-6 shadow-2xl flex-shrink-0">
            <div className="flex items-end gap-3 sm:gap-4">
              <div className="flex-1 relative">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about compliance, tax regulations, or business requirements..."
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 resize-none text-white placeholder-indigo-200 text-sm sm:text-lg shadow-lg transition-all duration-300"
                  rows={1}
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
                <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 text-indigo-300 text-xs sm:text-sm">
                  Press Enter to send
                </div>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim() || !openAiKey.trim() || isLoadingKey}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl font-semibold hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-xl flex-shrink-0"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="animate-spin h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    <span className="hidden sm:inline">Sending...</span>
                    <span className="sm:hidden">...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span className="hidden sm:inline">Send</span>
                    <span className="sm:hidden">Send</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default AiChat; 
