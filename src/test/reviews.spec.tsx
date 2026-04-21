import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { defaultAdminUser, defaultUser } from "./fixtures";
import { renderRoute } from "./render";

test("submits a product review for approval and surfaces it in the admin queue", async () => {
  window.localStorage.setItem("tactile.session", JSON.stringify(defaultUser));
  window.localStorage.setItem(
    "tactile.users",
    JSON.stringify([{ ...defaultUser, password: "quiet", enabled: true }]),
  );

  const storefront = renderRoute(["/product/monolith-pro-tkl"]);

  await userEvent.click(await screen.findByRole("button", { name: /rate 4 stars/i }));
  await userEvent.type(
    screen.getByRole("textbox", { name: /comment/i }),
    "Dense frame, stable acoustics, and a cleaner top edge than expected.",
  );
  await userEvent.click(screen.getByRole("button", { name: /submit for approval/i }));

  expect(await screen.findByText(/waiting for admin approval/i)).toBeInTheDocument();

  storefront.unmount();
  window.localStorage.setItem("tactile.session", JSON.stringify(defaultAdminUser));
  renderRoute(["/admin/reviews"]);

  expect(await screen.findByText(/dense frame, stable acoustics/i)).toBeInTheDocument();
  expect((await screen.findAllByText(/monolith pro tkl/i)).length).toBeGreaterThan(0);
});

test("approves a pending review with an admin note", async () => {
  window.localStorage.setItem("tactile.session", JSON.stringify(defaultAdminUser));
  renderRoute(["/admin/reviews"]);

  const noteField = await screen.findByRole("textbox", { name: /admin note for monolith pro tkl/i });
  await userEvent.type(noteField, "Approved after a quick clarity pass.");
  await userEvent.click(screen.getByRole("button", { name: /^approve$/i }));
  await userEvent.click(screen.getByRole("button", { name: /^approved$/i }));

  const approvedReview = await screen.findByText(/mass felt right and the front edge stayed disciplined/i);
  const card = approvedReview.closest("article");
  expect(card).not.toBeNull();
  expect(within(card as HTMLElement).getByText(/approved after a quick clarity pass/i)).toBeInTheDocument();
});
