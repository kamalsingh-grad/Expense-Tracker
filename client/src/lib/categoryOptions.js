import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from './categories';

/** Union of income + expense categories, de-duplicated, for filter dropdowns */
export const ALL_EXPORT_CATEGORIES = [...new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])];
