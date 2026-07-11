export type EditableNumber = number | "";

export const normalizeEditableNumber = (value: EditableNumber) =>
  value === "" ? 0 : value;
