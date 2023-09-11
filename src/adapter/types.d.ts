import type { RegisteredField } from "../types";

export type Adapter<T> = (field: RegisteredField) => T;

