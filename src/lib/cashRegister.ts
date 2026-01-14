type CashRegisterSessionLike = {
  _id?: unknown;
  status?: "open" | "closed";
  openedAt?: Date | string | null;
  closedAt?: Date | string | null;
  openingAmount?: number | null;
  closingAmount?: number | null;
  expectedCash?: number | null;
  discrepancy?: number | null;
  openedBy?: string | null;
  closedBy?: string | null;
  notes?: string | null;
};

export type CashRegisterSessionPayload = {
  id: string;
  status: "open" | "closed";
  openedAt: string;
  closedAt: string | null;
  openingAmount: number;
  closingAmount: number | null;
  expectedCash: number | null;
  discrepancy: number | null;
  openedBy: string | null;
  closedBy: string | null;
  notes: string | null;
};

export function serializeCashRegisterSession(
  session: CashRegisterSessionLike,
): CashRegisterSessionPayload {
  const openedAt = session.openedAt ? new Date(session.openedAt) : null;
  const closedAt = session.closedAt ? new Date(session.closedAt) : null;
  return {
    id: session._id?.toString?.() ?? String(session._id ?? ""),
    status: session.status ?? "open",
    openedAt: openedAt ? openedAt.toISOString() : new Date().toISOString(),
    closedAt: closedAt ? closedAt.toISOString() : null,
    openingAmount: Number.isFinite(session.openingAmount)
      ? Number(session.openingAmount)
      : 0,
    closingAmount: Number.isFinite(session.closingAmount)
      ? Number(session.closingAmount)
      : null,
    expectedCash: Number.isFinite(session.expectedCash)
      ? Number(session.expectedCash)
      : null,
    discrepancy: Number.isFinite(session.discrepancy)
      ? Number(session.discrepancy)
      : null,
    openedBy: session.openedBy ?? null,
    closedBy: session.closedBy ?? null,
    notes: session.notes ?? null,
  };
}
