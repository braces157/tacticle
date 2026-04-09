import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { defaultAdminUser } from "./fixtures";
import { renderRoute } from "./render";

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem("tactile.session", JSON.stringify(defaultAdminUser));
  window.localStorage.setItem("tactile.users", JSON.stringify([defaultAdminUser]));
});

test("renders the admin dashboard and navigates to inventory edit", async () => {
  renderRoute(["/admin"]);

  expect(await screen.findByRole("heading", { name: /Tactile Gallery/i })).toBeInTheDocument();

  await userEvent.click(screen.getByRole("link", { name: /Orders/i }));
  expect(await screen.findByRole("heading", { name: /^Orders$/i })).toBeInTheDocument();
  expect((await screen.findAllByText(/Atelier Member/i)).length).toBeGreaterThan(0);
  await userEvent.click(screen.getByRole("link", { name: /TG-2049/i }));
  expect(await screen.findByRole("heading", { name: /TG-2049/i })).toBeInTheDocument();
  expect(await screen.findByText(/Build contents/i)).toBeInTheDocument();
  await userEvent.selectOptions(screen.getByRole("combobox", { name: /update status/i }), "Canceled");
  await userEvent.click(screen.getByRole("button", { name: /save status/i }));
  expect(await screen.findByText(/Order canceled/i)).toBeInTheDocument();
  expect(await screen.findByRole("combobox", { name: /update status/i })).toBeDisabled();

  await userEvent.click(screen.getByRole("link", { name: /Customers/i }));
  expect(await screen.findByRole("heading", { name: /^Customers$/i })).toBeInTheDocument();
  await userEvent.clear(await screen.findByRole("textbox", { name: /^Name$/i }));
  await userEvent.type(screen.getByRole("textbox", { name: /^Name$/i }), "Atelier Member Updated");
  await userEvent.clear(await screen.findByRole("textbox", { name: /^Phone$/i }));
  await userEvent.type(screen.getByRole("textbox", { name: /^Phone$/i }), "+66 88 000 1234");
  await userEvent.selectOptions(screen.getByRole("combobox", { name: /account status/i }), "Inactive");
  await userEvent.click(screen.getByRole("button", { name: /Save customer/i }));
  expect(await screen.findByText(/Customer profile updated./i)).toBeInTheDocument();
  expect(await screen.findAllByText(/Atelier Member Updated/i)).not.toHaveLength(0);
  expect(await screen.findAllByText(/Inactive/i)).not.toHaveLength(0);

  await userEvent.click((await screen.findAllByRole("link", { name: /Inventory/i }))[0]);
  expect(await screen.findByRole("heading", { name: /Inventory/i })).toBeInTheDocument();
  await userEvent.type(screen.getByRole("textbox", { name: /search admin inventory/i }), "Monolith");
  await userEvent.keyboard("{Enter}");
  expect(await screen.findByText(/Monolith Pro TKL/i)).toBeInTheDocument();
  expect(screen.queryByText(/Quiet Grid Keycap Set/i)).not.toBeInTheDocument();

  await userEvent.click(screen.getByRole("link", { name: /Orders/i }));
  await userEvent.selectOptions(await screen.findByRole("combobox", { name: /status/i }), "Delivered");
  expect(await screen.findByText(/Atelier Member/i)).toBeInTheDocument();

  await userEvent.click((await screen.findAllByRole("link", { name: /Inventory/i }))[0]);

  await userEvent.click(screen.getByRole("link", { name: /Edit Tactile Core-65/i }));
  expect(await screen.findByRole("heading", { name: /Edit Product: Tactile Core-65/i })).toBeInTheDocument();
});
