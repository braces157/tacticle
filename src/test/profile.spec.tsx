import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { defaultUser } from "./fixtures";
import { renderRoute } from "./render";

test("updates the signed-in profile and persists the synced session user", async () => {
  window.localStorage.setItem("tactile.session", JSON.stringify(defaultUser));
  window.localStorage.setItem(
    "tactile.users",
    JSON.stringify([{ ...defaultUser, password: "quiet", enabled: true }]),
  );

  renderRoute(["/profile"]);

  expect(await screen.findByRole("button", { name: /edit profile/i })).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: /edit profile/i }));
  await userEvent.clear(screen.getByRole("textbox", { name: /^name$/i }));
  await userEvent.type(screen.getByRole("textbox", { name: /^name$/i }), "Quiet Collector");
  await userEvent.clear(screen.getByRole("textbox", { name: /^location$/i }));
  await userEvent.type(screen.getByRole("textbox", { name: /^location$/i }), "Chiang Mai, Thailand");
  await userEvent.clear(screen.getByRole("textbox", { name: /preferences/i }));
  await userEvent.type(screen.getByRole("textbox", { name: /preferences/i }), "Quiet tactility, Compact layouts");
  await userEvent.click(screen.getByRole("button", { name: /save profile/i }));

  expect(await screen.findByText(/profile changes saved/i)).toBeInTheDocument();
  expect(await screen.findAllByText(/quiet collector/i)).not.toHaveLength(0);
  expect(screen.getByRole("textbox", { name: /^location$/i })).toHaveValue("Chiang Mai, Thailand");

  expect(JSON.parse(window.localStorage.getItem("tactile.session") ?? "{}")).toMatchObject({
    id: defaultUser.id,
    name: "Quiet Collector",
    email: defaultUser.email,
    role: defaultUser.role,
  });
});
