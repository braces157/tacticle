import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import type { ReactElement } from "react";
import { routes } from "../app/router";

export function renderRoute(initialEntries: string[]) {
  const router = createMemoryRouter(routes, { initialEntries });
  return {
    router,
    ...render(<RouterProvider router={router} />),
  };
}

export { render };
