import { screen } from "@testing-library/react";
import { renderRoute } from "./render";

test("shows search results for matching products", async () => {
  renderRoute(["/search?q=tactile"]);

  expect(await screen.findByRole("heading", { name: /results for/i })).toBeInTheDocument();
  expect(await screen.findByText(/Tactile Core-65/i)).toBeInTheDocument();
});

test("shows the no results state when search is empty", async () => {
  renderRoute(["/search?q=nonexistent"]);

  expect(await screen.findByRole("heading", { name: /no results found/i })).toBeInTheDocument();
});
