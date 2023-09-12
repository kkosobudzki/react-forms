import { useCallback, useMemo, useState } from "react";

import useSafeDebounce from "./useSafeDebounce";
import type { Adapter } from "./adapter/types";
import reactNativeAdapter from "./adapter/reactNative";

type IndependentField<T> = {
  error: string;
  initial?: string;
  required?: boolean;
  validator: (value: T) => boolean;
  parser?: (input: string) => T;
};

type DependentField<Form, T, DependsOn extends keyof Form> = Omit<
  IndependentField<T>,
  "validator"
> & {
  dependsOn: DependsOn; // ideally we should exclude self
  validator: (value: T, dependent: Form[DependsOn]) => boolean;
};

export type Field<Form, T = Form[keyof Form]> =
  | IndependentField<T>
  | DependentField<Form, T, keyof Form>;

type Box<T> = {
  raw: string;
  parsed: T;
};

export type Form<T, F = Field<T>> = Record<keyof T, F>;
type FormState<T> = Record<keyof T, Box<T[keyof T]>>;
type UnboxedFormState<T> = Record<keyof T, T[keyof T]>;

const passThroughParser = <T>(input: string): T => input as unknown as T;

const box = <T>(raw: string, parser?: (input: string) => T): Box<T> => ({
  raw,
  parsed: (parser || passThroughParser)(raw),
});

const unbox = <T>(state: FormState<T>): UnboxedFormState<T> =>
  Object.entries<Box<T[keyof T]>>(state).reduce(
    (s, [key, { parsed }]) => ({ ...s, [key]: parsed }),
    {} as UnboxedFormState<T>
  );

const createInitialState = <T>(form: Form<T>): FormState<T> =>
  Object.entries<Field<T>>(form).reduce(
    (s, [key, { initial, parser }]) => ({
      ...s,
      [key]: box(initial || "", parser),
    }),
    {} as FormState<T>
  );

const validateField = <T>(
  form: Form<T>,
  state: FormState<T>,
  key: keyof T
): boolean | undefined => {
  const field = form[key];

  const { parsed } = state[key];

  const { required = true } = field;

  return required || parsed
    ? "dependsOn" in field
      ? field.validator(parsed, state[field.dependsOn].parsed)
      : field.validator(parsed)
    : undefined;
};

const validate = <T>(form: Form<T>, state: FormState<T>): boolean =>
  Object.keys(form).every((key) => {
    const valid = validateField(form, state, key as keyof FormState<T>);

    if (valid === undefined) {
      return true;
    }

    return valid;
  });

type Adapted<T> = T extends Adapter<infer R> ? R : never;  

const useForm = <T>(form: Form<T>, adapt: Adapter<any> = reactNativeAdapter) => {
  const [state, setState] = useState<FormState<T>>(() =>
    createInitialState(form)
  );
  const [typing, setTyping] = useState(false);

  const setTypingDebounced = useSafeDebounce(setTyping, 1_500);

  const isFormValid = useCallback(
    (s: FormState<T>) => validate(form, s),
    [form]
  );

  const unboxed = useMemo(() => unbox(state), [state]);

  const register = (key: keyof Form<T>): Adapted<typeof adapt> => {
    const { error, parser } = form[key];
    const { raw, parsed } = state[key];

    const valid = validateField(form, state, key);

    const handleValueChanged = (value: string) => {
      setState((s) => ({ ...s, [key]: box(value, parser) }));

      // LOL, this should work per field, not per form
      setTyping(true);
      setTypingDebounced(false);
    };

    return adapt({
      value: raw,
      valid,
      error: !parsed || typing || valid ? undefined : error,
      onChangeText: handleValueChanged,
      onCleared: () => handleValueChanged(""),
    });
  };

  return [register, unboxed, isFormValid(state)] as const;
};

export default useForm;
