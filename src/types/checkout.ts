export type CheckoutSummary = {
  cash: number;
  card: number;
  tip: number;
  paid: number;
  change: number;
  totalDue: number;
  customerName?: string;
  splitCount?: number;
  tipType: "percentage" | "custom";
  tipPercentage?: number;
};
