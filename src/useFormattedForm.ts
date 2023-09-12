import type { Adapter } from './adapter/types';
import useForm, { Field, Form } from './useForm';

const compose =
  (...fns: ((arg: any) => any)[]) =>
  (x: any) =>
    fns.reduceRight((v, f) => f(v), x);

export type FormatableField<T> = Field<T> & {
  formatter: (input?: string) => string;
};

export type FormatableForm<T> = Form<T, Field<T> | FormatableField<T>>;

const useFormattedForm = <T>(form: FormatableForm<T>) => {
  const [register, state, valid] = useForm<T>(form);

  const formatableRegister = (key: keyof FormatableForm<T>) => {
    const registered = register(key);

    const field = form[key];

    if ('formatter' in field) {
      const { onChangeText, ...rest } = registered;

      return {
        ...rest,
        onChangeText: compose(onChangeText, field.formatter),
      };
    }

    return registered;
  };

  return [formatableRegister, state, valid] as const;
};

export default useFormattedForm;

