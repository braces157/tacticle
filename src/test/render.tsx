import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { routes } from "../app/router";

export function renderRoute(initialEntries: string[]) {
  const router = createMemoryRouter(routes, { initialEntries });
  return {
    router,
    ...render(<RouterProvider router={router} />),
  };
}
