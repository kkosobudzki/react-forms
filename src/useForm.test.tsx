/// <reference lib="dom" />

import { afterEach, expect, test } from "bun:test";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import React from "react";

import useForm from "./useForm";
import reactAdapter from "./adapter/react";

type TestFormObject = {
  name: string;
  mobile: string;
};

const TestForm = () => {
  const [register, _, valid] = useForm<TestFormObject>(
    {
      name: {
        validator: (name: string) => name.length >= 3,
        error: "Invalid name",
      },
      mobile: {
        validator: (mobile: string) => /^[0-9]{9}$/.test(mobile),
        error: "Invalid mobile",
      },
    },
    reactAdapter
  );

  const { error: nameError, ...nameProps } = register("name");
  const { error: mobileError, ...mobileProps } = register("mobile");

  return (
    <>
      <input {...nameProps} aria-label="user name" />
      <span aria-label="user name error">{nameError}</span>

      <input {...mobileProps} aria-label="mobile" />
      <span aria-label="mobile error">{mobileError}</span>

      <span>Form is {valid ? "valid" : "invalid"}</span>
    </>
  );
};

afterEach(cleanup);

test("displays invalid when all fields are empty", () => {
  const { getByText } = render(<TestForm />);

  expect(getByText("Form is invalid")).toBeTruthy();
});

test("displays error when name contains invalid value", async () => {
  const { getByLabelText } = render(<TestForm />);

  fireEvent.change(getByLabelText("user name"), "ab");

  await waitFor(() =>
    expect(getByLabelText("user name error")).toHaveProperty("textContent", "Invalid name")
  );
}, 5_000);

test("does not display error when name is empty", () => {
  const { queryByText } = render(<TestForm />);

  expect(queryByText("Invalid name")).toBeFalsy();
});

test("displays error when mobile contains invalid value", async () => {
  const { getByText, getByLabelText } = render(<TestForm />);

  fireEvent.change(getByLabelText("mobile"), "123 123 123");

  await waitFor(() => expect(getByText("Invalid mobile")).toBeTruthy());
});

test("does not display error when mobile is empty", () => {
  const { queryByText } = render(<TestForm />);

  expect(queryByText("Invalid mobile")).toBeFalsy();
});

test("displays valid when all fields are valid", () => {
  const { getByText, getByLabelText } = render(<TestForm />);

  fireEvent.change(getByLabelText("user name"), "Krzychu");
  fireEvent.change(getByLabelText("mobile"), "123456789");

  expect(getByText("Form is valid")).toBeTruthy();
});
