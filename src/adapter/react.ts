import type { ChangeEvent, InputHTMLAttributes } from "react";

import type { Adapter } from "./types";

type InputField = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
};

const adapter: Adapter<InputField> = ({
	valid,
  onChangeText,
  onCleared,
  ...passThroughProps
}) => ({
  ...passThroughProps,
  onChange: ({ target }: ChangeEvent<HTMLInputElement>) =>
    onChangeText(target.value),
});

export default adapter;
