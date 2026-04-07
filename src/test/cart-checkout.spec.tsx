import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { defaultUser } from "./fixtures";
import { renderRoute } from "./render";

test("adds a product to cart and completes checkout validation", async () => {
  window.localStorage.setItem(
    "tactile.session",
    JSON.stringify(defaultUser),
  );
  window.localStorage.setItem(
    "tactile.users",
    JSON.stringify([{ ...defaultUser, password: "quiet" }]),
  );

  renderRoute(["/product/tactile-core-65"]);

  const addButton = await screen.findByRole("button", { name: /add to archive/i });
  await userEvent.click(addButton);

  const viewCart = (await screen.findAllByRole("link", { name: /view cart/i }))[0];
  await userEvent.click(viewCart);

  expect(await screen.findByRole("heading", { name: /your selected archive/i })).toBeInTheDocument();
  expect(screen.getAllByText(/Tactile Core-65/i).length).toBeGreaterThan(0);

  await userEvent.click(screen.getByRole("link", { name: /continue to checkout/i }));

  const placeOrder = await screen.findByRole("button", { name: /place order/i });
  await userEvent.click(placeOrder);

  expect((await screen.findAllByText(/this field is required/i)).length).toBeGreaterThan(0);
  expect(await screen.findByText(/enter a valid card number/i)).toBeInTheDocument();
});
