import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { defaultUser } from "./fixtures";
import { renderRoute } from "./render";

test("logs in and reaches account order history", async () => {
  renderRoute(["/login"]);

  const submit = await screen.findByRole("button", { name: /enter the gallery/i });
  await userEvent.click(submit);

  expect(await screen.findByRole("button", { name: /edit profile/i })).toBeInTheDocument();
  expect(await screen.findByText(/member@tactile\.gallery/i)).toBeInTheDocument();

  await userEvent.click(screen.getByRole("link", { name: /view orders/i }));

  expect(await screen.findByRole("heading", { name: /order history/i })).toBeInTheDocument();
  expect(await screen.findByText(/TG-2048/i)).toBeInTheDocument();
});

test("shows an auth error for unknown credentials", async () => {
  renderRoute(["/login"]);

  await userEvent.clear(await screen.findByLabelText(/email/i));
  await userEvent.type(screen.getByLabelText(/email/i), "missing@tactile.gallery");
  await userEvent.clear(screen.getByLabelText(/password/i));
  await userEvent.type(screen.getByLabelText(/password/i), "quiet");

  await userEvent.click(screen.getByRole("button", { name: /enter the gallery/i }));

  expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
});

test("shows only the signed-in user's orders", async () => {
  window.localStorage.setItem(
    "tactile.users",
    JSON.stringify([
      { ...defaultUser, password: "quiet" },
      {
        id: "user-second",
        name: "Second User",
        email: "second@tactile.gallery",
        role: "customer",
        password: "quiet",
      },
    ]),
  );

  renderRoute(["/login"]);

  await userEvent.clear(await screen.findByLabelText(/email/i));
  await userEvent.type(screen.getByLabelText(/email/i), "second@tactile.gallery");
  await userEvent.click(screen.getByRole("button", { name: /enter the gallery/i }));

  await userEvent.click(await screen.findByRole("link", { name: /view orders/i }));

  expect(await screen.findByRole("heading", { name: /order history/i })).toBeInTheDocument();
  expect(screen.queryByText(/TG-2048/i)).not.toBeInTheDocument();
});
