import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { handleApiRequest, resetMockApiState } from "./fixtures/mockApi";
import { installStorageFixtures, resetStorageFixtures } from "./fixtures/storage";

installStorageFixtures();

beforeEach(() => {
  resetStorageFixtures();
  window.scrollTo = vi.fn();
  resetMockApiState();
  vi.stubGlobal("fetch", vi.fn(handleApiRequest));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
