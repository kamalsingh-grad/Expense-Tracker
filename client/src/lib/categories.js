/**
 * Visual identity for every category: lucide icon + signature colour.
 * Keep names in sync with server/src/config/categories.js
 */
import {
  Home, UtensilsCrossed, ShoppingBasket, Car, Zap, Repeat, ShoppingBag, HeartPulse,
  Clapperboard, TrendingUp, GraduationCap, Plane, Gift, Sparkles, Shapes,
  Briefcase, Laptop, Award, RotateCcw,
} from 'lucide-react';

export const CATEGORY_META = {
  // expenses
  'Rent & Housing': { icon: Home, color: '#6366f1' },
  'Food & Dining': { icon: UtensilsCrossed, color: '#f97316' },
  'Groceries': { icon: ShoppingBasket, color: '#84cc16' },
  'Transportation': { icon: Car, color: '#06b6d4' },
  'Utilities': { icon: Zap, color: '#eab308' },
  'Bills & Subscriptions': { icon: Repeat, color: '#a78bfa' },
  'Shopping': { icon: ShoppingBag, color: '#ec4899' },
  'Health & Medical': { icon: HeartPulse, color: '#f43f5e' },
  'Entertainment': { icon: Clapperboard, color: '#8b5cf6' },
  'Investments': { icon: TrendingUp, color: '#10b981' },
  'Education': { icon: GraduationCap, color: '#3b82f6' },
  'Travel': { icon: Plane, color: '#14b8a6' },
  'Gifts & Donations': { icon: Gift, color: '#fb7185' },
  'Personal Care': { icon: Sparkles, color: '#f472b6' },
  // income
  'Salary': { icon: Briefcase, color: '#10b981' },
  'Freelance': { icon: Laptop, color: '#22d3ee' },
  'Bonus': { icon: Award, color: '#fbbf24' },
  'Refund & Cashback': { icon: RotateCcw, color: '#94a3b8' },
  // shared
  'Others': { icon: Shapes, color: '#64748b' },
};

export const categoryMeta = (name) => CATEGORY_META[name] ?? { icon: Shapes, color: '#64748b' };

export const EXPENSE_CATEGORIES = [
  'Rent & Housing', 'Food & Dining', 'Groceries', 'Transportation', 'Utilities',
  'Bills & Subscriptions', 'Shopping', 'Health & Medical', 'Entertainment',
  'Investments', 'Education', 'Travel', 'Gifts & Donations', 'Personal Care', 'Others',
];

export const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investments', 'Bonus', 'Refund & Cashback', 'Others'];

export const PAYMENT_METHODS = ['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Auto Debit', 'Wallet', 'Cash'];

/** Donut palette — stable assignment by sorted share for a polished chart */
export const CHART_PALETTE = ['#10b981', '#6366f1', '#f97316', '#06b6d4', '#f43f5e', '#a78bfa', '#eab308', '#84cc16', '#ec4899', '#14b8a6', '#3b82f6', '#fb7185', '#94a3b8'];
