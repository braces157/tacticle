import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderRoute } from "./render";

test("renders the home page and navigates to a category", async () => {
  renderRoute(["/"]);

  expect(await screen.findByRole("heading", { name: /silent precision/i })).toBeInTheDocument();

  const keyboardsLink = await screen.findByRole("link", { name: /explore keyboards/i });
  await userEvent.click(keyboardsLink);

  await waitFor(() => {
    expect(screen.getByRole("heading", { name: /silent precision in machined aluminum/i })).toBeInTheDocument();
  });
});
