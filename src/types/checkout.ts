export type PaymentMethod = "cash" | "card";

export interface Payment {
  id: string;
  method: PaymentMethod;
  amount: number;
}

export interface PaymentDraft {
  id: string;
  method: PaymentMethod;
  amountInput: string; // valor crudo del input, se convierte a number al calcular
}

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
  payments?: Payment[]; // nuevo: lista detallada de pagos para futuros flujos
};
