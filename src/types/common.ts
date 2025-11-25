export type WithId<T> = T & { _id: { toString(): string } };
