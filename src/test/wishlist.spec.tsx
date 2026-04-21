import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { defaultUser } from "./fixtures";
import { renderRoute } from "./render";

test("saves products to the wishlist and renders them on the wishlist page", async () => {
  window.localStorage.setItem("tactile.session", JSON.stringify(defaultUser));

  renderRoute(["/product/tactile-core-65"]);

  await userEvent.click(await screen.findByRole("button", { name: /save to wishlist/i }));
  await userEvent.click(screen.getByRole("button", { name: /open wishlist/i }));

  expect(await screen.findByRole("heading", { name: /saved pieces/i })).toBeInTheDocument();
  expect(await screen.findByText(/tactile core-65/i)).toBeInTheDocument();
});
