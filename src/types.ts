export type RegisteredField = {
  valid?: boolean;
  value?: string;
  error?: string;
  onChangeText: (value: string) => void;
  onCleared: () => void;
};
