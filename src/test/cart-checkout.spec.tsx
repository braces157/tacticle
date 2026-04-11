import { screen, within } from "@testing-library/react";
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

test("checkout summary uses the same order total for the final payment amount", async () => {
  window.localStorage.setItem(
    "tactile.session",
    JSON.stringify(defaultUser),
  );
  window.localStorage.setItem(
    "tactile.cart",
    JSON.stringify([
      {
        id: "tactile-core-65:[[\"Plate Material\",\"FR4\"],[\"Switch Variant\",\"Obsidian Tactile\"]]",
        productSlug: "tactile-core-65",
        productName: "Tactile Core-65",
        image: {
          src: "https://example.com/core-65.jpg",
          alt: "Tactile Core-65.",
        },
        price: 420,
        quantity: 1,
        selectedOptions: {
          "Switch Variant": "Obsidian Tactile",
          "Plate Material": "FR4",
        },
      },
    ]),
  );

  renderRoute(["/checkout"]);

  const chargedTodayRow = (await screen.findByText(/amount charged today/i)).closest("div");
  const orderTotalRow = screen.getByText(/order total/i).closest("div");

  expect(chargedTodayRow).not.toBeNull();
  expect(orderTotalRow).not.toBeNull();
  expect(within(chargedTodayRow as HTMLDivElement).getByText("$467.40")).toBeInTheDocument();
  expect(within(orderTotalRow as HTMLDivElement).getByText("$467.40")).toBeInTheDocument();
});

test("checkout supports VietQR and pay on delivery flows", async () => {
  window.localStorage.setItem(
    "tactile.session",
    JSON.stringify(defaultUser),
  );
  window.localStorage.setItem(
    "tactile.cart",
    JSON.stringify([
      {
        id: "tactile-core-65:[[\"Plate Material\",\"FR4\"],[\"Switch Variant\",\"Obsidian Tactile\"]]",
        productSlug: "tactile-core-65",
        productName: "Tactile Core-65",
        image: {
          src: "https://example.com/core-65.jpg",
          alt: "Tactile Core-65.",
        },
        price: 420,
        quantity: 1,
        selectedOptions: {
          "Switch Variant": "Obsidian Tactile",
          "Plate Material": "FR4",
        },
      },
    ]),
  );

  renderRoute(["/checkout"]);

  await userEvent.click(await screen.findByRole("button", { name: /vietqr bank transfer/i }));

  const qrImage = screen.getByRole("img", { name: /vietqr payment for tactile shop/i });
  expect(qrImage).toHaveAttribute("src", expect.stringContaining("VCB-1042361535-compact"));
  expect(qrImage).toHaveAttribute("src", expect.stringContaining("accountName=Tactile+shop"));

  await userEvent.click(screen.getByRole("button", { name: /pay on delivery/i }));

  expect(screen.getByText(/collect the full order total when the parcel arrives/i)).toBeInTheDocument();
  expect(screen.queryByLabelText(/card number/i)).not.toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: /place order/i }));

  expect((await screen.findAllByText(/this field is required/i)).length).toBeGreaterThan(0);
  expect(screen.queryByText(/enter a valid card number/i)).not.toBeInTheDocument();
});
