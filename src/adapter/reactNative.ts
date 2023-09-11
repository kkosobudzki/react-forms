import type { TextInputProps } from "react-native/types";

import type { Adapter } from "./types";

const adapter: Adapter<Partial<TextInputProps>> = (input) => input;

export default adapter;
