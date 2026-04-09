import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

const storageStore = new Map<string, string>();
const apiOrigin = "http://localhost:8081";

function installStoragePolyfill() {
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => storageStore.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storageStore.set(key, value);
      },
      removeItem: (key: string) => {
        storageStore.delete(key);
      },
      clear: () => {
        storageStore.clear();
      },
    },
  });
}

function image(src: string, alt: string) {
  return { src, alt };
}

function shippingAddress(line1: string, city: string, postalCode: string, country: string) {
  return { line1, city, postalCode, country };
}

type MockUser = {
  id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
  password?: string;
  enabled: boolean;
};

const orderTransitions = {
  "Payment Review": ["Processing", "Canceled"],
  Processing: ["Ready to Ship", "Shipped", "Canceled"],
  "Ready to Ship": ["Shipped", "Canceled"],
  Shipped: ["Delivered"],
  Delivered: [],
  Canceled: [],
} as const;

type MockOrderStatus = keyof typeof orderTransitions;

function allowedNextStatuses(status: MockOrderStatus) {
  return [...orderTransitions[status]];
}

function fulfillmentForStatus(status: MockOrderStatus) {
  switch (status) {
    case "Payment Review":
      return "Awaiting payment review";
    case "Processing":
      return "Assembly queued";
    case "Ready to Ship":
      return "Packed and labeled";
    case "Shipped":
      return "In transit";
    case "Delivered":
      return "Complete";
    case "Canceled":
      return "Canceled";
  }
}

function paymentStatusForStatus(status: MockOrderStatus) {
  return status === "Canceled" ? "Voided" : "Paid";
}

function timelineTextForStatus(status: MockOrderStatus) {
  switch (status) {
    case "Payment Review":
      return "Payment under review";
    case "Processing":
      return "Assembly queued";
    case "Ready to Ship":
      return "Ready to ship";
    case "Shipped":
      return "Shipment in transit";
    case "Delivered":
      return "Delivered";
    case "Canceled":
      return "Order canceled";
  }
}

function defaultProfile(user: { id: string; name: string; email: string }) {
  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    location: "Bangkok, Thailand",
    phone: "",
    membership: "Gallery Member since 2024",
    preferences: ["Quiet tactility", "Stone-toned finishes", "65% layouts"],
    shippingAddress: shippingAddress("49 Charoen Nakhon Rd", "Bangkok", "10600", "Thailand"),
    billingAddress: shippingAddress("49 Charoen Nakhon Rd", "Bangkok", "10600", "Thailand"),
  };
}

function createMockState() {
  const categories = [
    {
      id: "cat-keyboards",
      slug: "keyboards",
      name: "Keyboards",
      kicker: "Exhibition / 01",
      headline: "Silent precision in machined aluminum.",
      description: "Gallery-grade keyboard builds tuned for structure, acoustics, and tactile calm.",
      story: "Each chassis is curated for acoustic maturity, compositional balance, and desk calm.",
      heroImage: image("https://example.com/keyboard-hero.jpg", "Top-down white keyboard."),
    },
    {
      id: "cat-accessories",
      slug: "accessories",
      name: "Accessories",
      kicker: "Exhibition / 02",
      headline: "Support pieces with typographic discipline.",
      description: "Desk mats, artisan caps, and finishing touches that extend the same editorial language.",
      story: "Accessories soften, ground, or sharpen the primary keyboard silhouette.",
      heroImage: image("https://example.com/accessories-hero.jpg", "Minimal keycaps."),
    },
    {
      id: "cat-custom-parts",
      slug: "custom-parts",
      name: "Custom Parts",
      kicker: "Exhibition / 03",
      headline: "Internal architecture, visible in feel.",
      description: "Switches, knobs, plates, and tuned internals for builders who care about every layer.",
      story: "These parts shape the final voice before the first keypress.",
      heroImage: image("https://example.com/parts-hero.jpg", "Exploded keyboard parts."),
    },
  ];

  const products = [
    {
      id: "prod-core-65",
      slug: "tactile-core-65",
      categorySlug: "keyboards",
      name: "Tactile Core-65",
      subtitle: "A quiet 65% frame balanced for marbly, low-register acoustics.",
      price: 420,
      image: image("https://example.com/core-65.jpg", "Tactile Core-65."),
      tags: ["Wireless", "Gallery Favorite", "65%"],
      material: "CNC aluminum",
      gallery: [
        image("https://example.com/core-65.jpg", "Tactile Core-65."),
        image("https://example.com/core-65-side.jpg", "Core-65 detail."),
        image("https://example.com/core-65-exploded.jpg", "Core-65 exploded."),
      ],
      description: "A softly weighted 65% layout with gasket isolation and a surface finish that reads like stoneware.",
      story: "The Core-65 exists for people who want restraint rather than spectacle.",
      specs: [
        { label: "Mounting", value: "Gasket mount" },
        { label: "Plate", value: "FR4 or brass" },
      ],
      highlights: ["Seven-layer acoustic stack", "Low-gloss stone finish"],
      options: [
        {
          id: "switches",
          group: "Switch Variant",
          values: [
            { id: "obsidian-tactile", label: "Obsidian Tactile", priceDelta: 0 },
            { id: "cream-linear", label: "Cream Linear", priceDelta: 0 },
          ],
        },
        {
          id: "plate",
          group: "Plate Material",
          values: [
            { id: "fr4", label: "FR4", priceDelta: 0 },
            { id: "brass", label: "Brass", priceDelta: 30 },
          ],
        },
      ],
      sku: "KB-TC-065",
      stock: 12,
      visibility: "Active",
      archived: false,
    },
    {
      id: "prod-monolith-pro",
      slug: "monolith-pro-tkl",
      categorySlug: "keyboards",
      name: "Monolith Pro TKL",
      subtitle: "A tenkeyless chassis with denser mass and a flatter studio posture.",
      price: 520,
      image: image("https://example.com/monolith.jpg", "Monolith Pro TKL."),
      tags: ["TKL", "Studio", "Premium"],
      material: "Silver aluminum",
      gallery: [
        image("https://example.com/monolith.jpg", "Monolith Pro TKL."),
        image("https://example.com/monolith-side.jpg", "Monolith side."),
        image("https://example.com/monolith-switches.jpg", "Switch detail."),
      ],
      description: "A commanding TKL platform with muted profile and sharper acoustic separation.",
      story: "The Monolith line is built around optical centering and denser visual mass.",
      specs: [
        { label: "Mounting", value: "Leaf spring mount" },
        { label: "Weight", value: "2.9kg fully built" },
      ],
      highlights: ["Balanced top frame overhang", "Dense rounded bottom-out"],
      options: [
        {
          id: "switches",
          group: "Switch Variant",
          values: [
            { id: "marble-tactile", label: "Marble Tactile", priceDelta: 20 },
            { id: "mistral-linear", label: "Mistral Linear", priceDelta: 0 },
          ],
        },
      ],
      sku: "KB-MP-TKL",
      stock: 4,
      visibility: "Active",
      archived: false,
    },
    {
      id: "prod-quiet-grid",
      slug: "quiet-grid-keycap-set",
      categorySlug: "accessories",
      name: "Quiet Grid Keycap Set",
      subtitle: "Low-contrast legends and crisp typography across every row.",
      price: 95,
      image: image("https://example.com/keycaps.jpg", "Quiet Grid Keycap Set."),
      tags: ["PBT", "Cherry profile", "Typographic"],
      material: "Dye-sub PBT",
      gallery: [
        image("https://example.com/keycaps.jpg", "Keycaps."),
        image("https://example.com/keycaps-2.jpg", "Keycaps detail."),
        image("https://example.com/keycaps-3.jpg", "Installed keycaps."),
      ],
      description: "A dense PBT set with softened legends and a creamy off-white tone.",
      story: "The legend design intentionally pulls back to let the keyboard silhouette lead.",
      specs: [
        { label: "Material", value: "1.5mm PBT" },
        { label: "Profile", value: "Cherry" },
      ],
      highlights: ["Muted legend contrast", "Wide layout support"],
      options: [
        {
          id: "legend",
          group: "Legend Style",
          values: [
            { id: "standard", label: "Standard", priceDelta: 0 },
            { id: "blank", label: "Blank alphas", priceDelta: 10 },
          ],
        },
      ],
      sku: "AC-QG-CAP",
      stock: 18,
      visibility: "Active",
      archived: false,
    },
    {
      id: "prod-desk-mat",
      slug: "atelier-desk-mat",
      categorySlug: "accessories",
      name: "Atelier Desk Mat",
      subtitle: "A tonal desk surface that quiets resonance and frames the board.",
      price: 68,
      image: image("https://example.com/mat.jpg", "Atelier Desk Mat."),
      tags: ["Felt", "Desk setup", "Acoustic"],
      material: "Wool blend felt",
      gallery: [
        image("https://example.com/mat.jpg", "Desk mat."),
        image("https://example.com/mat-2.jpg", "Desk mat detail."),
        image("https://example.com/mat-3.jpg", "Desk mat workspace."),
      ],
      description: "A weighty felt mat that absorbs harsh frequencies and provides a calm visual plane.",
      story: "The desk mat is treated as an environmental layer, not an accessory add-on.",
      specs: [
        { label: "Size", value: "900 x 400mm" },
        { label: "Thickness", value: "4mm" },
      ],
      highlights: ["Low-noise desk surface", "Anti-slip rubber base"],
      options: [
        {
          id: "color",
          group: "Colorway",
          values: [
            { id: "ash", label: "Ash", priceDelta: 0 },
            { id: "stone", label: "Stone", priceDelta: 0 },
          ],
        },
      ],
      sku: "AC-AT-MAT",
      stock: 25,
      visibility: "Active",
      archived: false,
    },
  ];

  const profiles = new Map<string, ReturnType<typeof defaultProfile>>([
    ["user-atelier", defaultProfile({ id: "user-atelier", name: "Atelier Member", email: "member@tactile.gallery" })],
  ]);

  const orders = [
    {
      id: "TG-2048",
      userId: "user-atelier",
      customerName: "Atelier Member",
      customerEmail: "member@tactile.gallery",
      createdAt: "2026-03-21",
      status: "Delivered" as MockOrderStatus,
      total: 588,
      itemCount: 2,
      fulfillment: "Complete",
      shippingAddress: shippingAddress("49 Charoen Nakhon Rd", "Bangkok", "10600", "Thailand"),
      paymentStatus: "Paid",
      timeline: ["Order placed", "Assembly completed", "Delivered"],
      items: [
        {
          id: "TG-2048-1",
          productSlug: "monolith-pro-tkl",
          productName: "Monolith Pro TKL",
          image: image("https://example.com/monolith.jpg", "Monolith Pro TKL."),
          price: 520,
          quantity: 1,
          selectedOptions: {
            "Switch Variant": "Mistral Linear",
            "Bottom Weight": "Powder-coated stone",
          },
        },
        {
          id: "TG-2048-2",
          productSlug: "atelier-desk-mat",
          productName: "Atelier Desk Mat",
          image: image("https://example.com/mat.jpg", "Atelier Desk Mat."),
          price: 68,
          quantity: 1,
          selectedOptions: {
            Colorway: "Ash",
          },
        },
      ],
    },
    {
      id: "TG-2049",
      userId: "user-atelier",
      customerName: "Atelier Member",
      customerEmail: "member@tactile.gallery",
      createdAt: "2026-04-06",
      status: "Processing" as MockOrderStatus,
      total: 420,
      itemCount: 1,
      fulfillment: "Assembly queued",
      shippingAddress: shippingAddress("49 Charoen Nakhon Rd", "Bangkok", "10600", "Thailand"),
      paymentStatus: "Paid",
      timeline: ["Order placed", "Payment captured", "Assembly queued"],
      items: [
        {
          id: "TG-2049-1",
          productSlug: "tactile-core-65",
          productName: "Tactile Core-65",
          image: image("https://example.com/core-65.jpg", "Tactile Core-65."),
          price: 420,
          quantity: 1,
          selectedOptions: {
            "Switch Variant": "Obsidian Tactile",
            "Plate Material": "FR4",
          },
        },
      ],
    },
  ];

  return {
    categories,
    products,
    profiles,
    orders,
    nextOrderNumber: 2100,
  };
}

let mockState = createMockState();

function readJson<T>(key: string, fallback: T): T {
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function getStoredUsers() {
  const seededUsers: MockUser[] = [
    {
      id: "user-atelier",
      name: "Atelier Member",
      email: "member@tactile.gallery",
      role: "customer" as const,
      password: "quiet",
      enabled: true,
    },
    {
      id: "admin-tactile",
      name: "Admin User",
      email: "admin@tactile.gallery",
      role: "admin" as const,
      password: "quiet",
      enabled: true,
    },
  ];
  const localUsers = readJson<Array<Omit<MockUser, "enabled"> & { enabled?: boolean }>>("tactile.users", []);
  if (localUsers.length) {
    const mergedUsers = new Map(
      seededUsers.map((user) => [
        user.id,
        user,
      ]),
    );

    for (const user of localUsers) {
      mergedUsers.set(user.id, {
        ...user,
        enabled: user.enabled ?? true,
      });
    }

    return [...mergedUsers.values()];
  }

  return seededUsers;
}

function getSessionUser() {
  const session = readJson<{ token?: string; user?: { id: string; name: string; email: string; role: "customer" | "admin" } } | { id: string; name: string; email: string; role: "customer" | "admin" } | null>("tactile.session", null);
  if (!session) {
    return null;
  }

  if ("user" in session && session.user) {
    return session.user;
  }

  if ("id" in session) {
    return session;
  }

  return null;
}

function createProfileForUser(user: { id: string; name: string; email: string }) {
  const existing = mockState.profiles.get(user.id);
  if (existing) {
    return existing;
  }

  const profile = defaultProfile(user);
  mockState.profiles.set(user.id, profile);
  return profile;
}

function updateOrdersForUser(userId: string, name: string, email: string) {
  mockState.orders.forEach((order) => {
    if (order.userId === userId) {
      order.customerName = name;
      order.customerEmail = email;
    }
  });
}

function findProduct(slug: string) {
  return mockState.products.find((product) => product.slug === slug) ?? null;
}

function productSummary(product: ReturnType<typeof findProduct> extends infer T ? Exclude<T, null> : never) {
  return {
    id: product.id,
    slug: product.slug,
    categorySlug: product.categorySlug,
    name: product.name,
    subtitle: product.subtitle,
    price: product.price,
    image: product.image,
    tags: product.tags,
    material: product.material,
  };
}

function adminInventoryItem(product: ReturnType<typeof findProduct> extends infer T ? Exclude<T, null> : never) {
  const status = product.stock <= 0 ? "Out of Stock" : product.stock <= 5 ? "Low Stock" : "In Stock";
  return {
    productId: product.id,
    productSlug: product.slug,
    name: product.name,
    subtitle: product.subtitle,
    category: product.categorySlug === "custom-parts" ? "Custom Parts" : product.categorySlug === "accessories" ? "Accessories" : "Keyboards",
    sku: product.sku,
    price: product.price,
    stock: product.stock,
    status,
    image: product.image,
  };
}

function adminProductDraft(product: ReturnType<typeof findProduct> extends infer T ? Exclude<T, null> : never) {
  return {
    name: product.name,
    category: product.categorySlug === "custom-parts" ? "Custom Parts" : product.categorySlug === "accessories" ? "Accessories" : "Keyboards",
    sku: product.sku,
    price: product.price.toFixed(2),
    stock: String(product.stock),
    description: product.description,
    metadata: product.specs.map((spec) => `${spec.label}: ${spec.value}`).join("\n"),
    status: product.visibility,
    images: product.gallery.map((image, index) => ({
      id: `image-${index + 1}`,
      src: image.src,
      alt: image.alt,
    })),
    options: product.options.map((option) => ({
      id: option.id,
      group: option.group,
      values: option.values.map((value) => ({
        id: value.id,
        label: value.label,
        priceDelta: value.priceDelta ? String(value.priceDelta) : "",
      })),
    })),
  };
}

function currentUserOrders(userId: string) {
  return mockState.orders.filter((order) => order.userId === userId);
}

function adminOrderDetail(order: ReturnType<typeof createMockState>["orders"][number]) {
  return {
    ...order,
    allowedNextStatuses: allowedNextStatuses(order.status),
  };
}

function adminCustomers() {
  return getStoredUsers()
    .filter((user) => user.role === "customer")
    .map((user) => {
      const customerOrders = currentUserOrders(user.id);
      const lastOrderAt = customerOrders
        .map((order) => order.createdAt)
        .sort((left, right) => right.localeCompare(left))[0] ?? "";

      return {
        id: user.id,
        accountId: user.id,
        name: user.name,
        email: user.email,
        orderCount: customerOrders.length,
        totalSpend: customerOrders.reduce((sum, order) => sum + order.total, 0),
        lastOrderAt,
        status: user.enabled ? "Active" : "Inactive",
      };
    })
    .sort((left, right) => right.lastOrderAt.localeCompare(left.lastOrderAt));
}

function jsonResponse(body?: unknown, status = 200) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

async function parseBody(init?: RequestInit) {
  if (!init?.body || typeof init.body !== "string") {
    return null;
  }
  return JSON.parse(init.body);
}

async function handleApiRequest(input: RequestInfo | URL, init?: RequestInit) {
  const url = new URL(typeof input === "string" ? input : input.toString(), apiOrigin);
  if (!url.pathname.startsWith("/api")) {
    return new Response(null, { status: 404 });
  }

  const path = url.pathname.replace(/^\/api/, "");
  const method = (init?.method ?? "GET").toUpperCase();
  const sessionUser = getSessionUser();

  if (path === "/auth/me" && method === "GET") {
    return sessionUser ? jsonResponse(sessionUser) : jsonResponse({ message: "Unauthorized" }, 401);
  }

  if (path === "/auth/login" && method === "POST") {
    const body = await parseBody(init);
    const user = getStoredUsers().find(
      (entry) => entry.email.toLowerCase() === String(body?.email ?? "").toLowerCase()
        && (entry.password ?? "quiet") === body?.password,
    );

    if (!user) {
      return jsonResponse({ message: "Invalid email or password." }, 401);
    }

    return jsonResponse({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  }

  if (path === "/auth/logout" && method === "POST") {
    return jsonResponse(undefined, 204);
  }

  if (path === "/auth/password-reset" && method === "POST") {
    return jsonResponse(undefined, 204);
  }

  if (path === "/auth/change-password" && method === "POST") {
    return jsonResponse(undefined, 204);
  }

  if (path === "/categories" && method === "GET") {
    return jsonResponse(mockState.categories);
  }

  if (path.startsWith("/categories/") && method === "GET") {
    const slug = path.split("/")[2];
    const category = mockState.categories.find((entry) => entry.slug === slug);
    return category ? jsonResponse(category) : jsonResponse({ message: "Category not found." }, 404);
  }

  if (path === "/products/featured" && method === "GET") {
    return jsonResponse(mockState.products.slice(0, 3).map(productSummary));
  }

  if (path === "/products" && method === "GET") {
    const category = url.searchParams.get("category");
    return jsonResponse(
      mockState.products
        .filter((product) => !category || product.categorySlug === category)
        .map(productSummary),
    );
  }

  if (path.startsWith("/products/") && path.endsWith("/related") && method === "GET") {
    const slug = path.split("/")[2];
    const current = findProduct(slug);
    if (!current) {
      return jsonResponse([]);
    }

    return jsonResponse(
      mockState.products
        .filter((product) => product.slug !== slug && product.categorySlug === current.categorySlug)
        .slice(0, 3)
        .map(productSummary),
    );
  }

  if (path.startsWith("/products/") && path.endsWith("/reviews") && method === "GET") {
    return jsonResponse([]);
  }

  if (path.startsWith("/products/") && path.endsWith("/review-eligibility") && method === "GET") {
    return jsonResponse({
      canSubmit: Boolean(sessionUser),
      hasPurchased: Boolean(sessionUser),
      alreadyReviewed: false,
      reason: sessionUser ? "You can submit one review for this product." : "Sign in to review this product.",
    });
  }

  if (path.startsWith("/products/") && path.endsWith("/reviews") && method === "POST") {
    return jsonResponse({
      id: "review-test",
      productSlug: path.split("/")[2],
      productName: findProduct(path.split("/")[2])?.name ?? "Unknown",
      authorName: sessionUser?.name ?? "Guest",
      rating: 5,
      comment: "Review queued.",
      status: "Pending",
      createdAt: "2026-04-07T10:00:00",
      adminNote: null,
    }, 201);
  }

  if (path.startsWith("/products/") && method === "GET") {
    const slug = path.split("/")[2];
    const product = findProduct(slug);
    return product ? jsonResponse(product) : jsonResponse({ message: "Product not found." }, 404);
  }

  if (path === "/search/products" && method === "GET") {
    const query = (url.searchParams.get("q") ?? "").trim().toLowerCase();
    const results = query
      ? mockState.products.filter((product) =>
          [product.name, product.subtitle, product.description, product.material, ...product.tags]
            .join(" ")
            .toLowerCase()
            .includes(query),
        )
      : [];
    return jsonResponse(results.map(productSummary));
  }

  if (path.match(/^\/users\/[^/]+\/profile$/) && method === "GET") {
    const userId = path.split("/")[2];
    const existingProfile = mockState.profiles.get(userId);
    if (existingProfile) {
      return jsonResponse(existingProfile);
    }

    const user = sessionUser && sessionUser.id === userId ? sessionUser : getStoredUsers().find((entry) => entry.id === userId);
    return user ? jsonResponse(createProfileForUser(user)) : jsonResponse({ message: "Profile not found." }, 404);
  }

  if (path.match(/^\/users\/[^/]+\/profile$/) && method === "PUT") {
    const userId = path.split("/")[2];
    const body = await parseBody(init);
    const nextProfile = {
      userId,
      ...body,
    };
    mockState.profiles.set(userId, nextProfile);
    updateOrdersForUser(userId, nextProfile.name, nextProfile.email);
    const users = getStoredUsers();
    const userIndex = users.findIndex((user) => user.id === userId);
    if (userIndex >= 0) {
      users[userIndex] = {
        ...users[userIndex],
        name: nextProfile.name,
        email: nextProfile.email,
      };
      window.localStorage.setItem("tactile.users", JSON.stringify(users));
    }
    return jsonResponse(nextProfile);
  }

  if (path.match(/^\/users\/[^/]+\/orders$/) && method === "GET") {
    const userId = path.split("/")[2];
    return jsonResponse(
      currentUserOrders(userId).map((order) => ({
        id: order.id,
        userId: order.userId,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        createdAt: order.createdAt,
        status: order.status,
        total: order.total,
        itemCount: order.itemCount,
      })),
    );
  }

  if (path.match(/^\/users\/[^/]+\/orders\/[^/]+$/) && method === "GET") {
    const [, , userId, , orderId] = path.split("/");
    const order = currentUserOrders(userId).find((entry) => entry.id === orderId);
    return order ? jsonResponse(order) : jsonResponse({ message: "Order not found." }, 404);
  }

  if (path === "/orders/checkout" && method === "POST") {
    const body = await parseBody(init);
    const orderId = `TG-${mockState.nextOrderNumber++}`;
    const nextOrder = {
      id: orderId,
      userId: sessionUser?.id ?? "guest-checkout",
      customerName: body?.draft?.fullName ?? "",
      customerEmail: body?.draft?.email ?? "",
      createdAt: "2026-04-07",
      status: "Processing" as MockOrderStatus,
      total: (body?.items ?? []).reduce((sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity, 0),
      itemCount: (body?.items ?? []).reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0),
      fulfillment: "Picking parts",
      shippingAddress: shippingAddress(
        body?.draft?.address ?? "",
        body?.draft?.city ?? "",
        body?.draft?.postalCode ?? "",
        body?.draft?.country ?? "",
      ),
      paymentStatus: "Paid",
      timeline: ["Order placed", "Payment captured", "Picking parts"],
      items: body?.items ?? [],
    };
    mockState.orders.unshift(nextOrder);
    return jsonResponse(nextOrder, 201);
  }

  if (path === "/admin/dashboard/metrics" && method === "GET") {
    return jsonResponse([
      { label: "Total Revenue", value: "$588", delta: "+12.4%", tone: "positive" },
      { label: "Orders", value: "1", delta: "+5.2%", tone: "positive" },
      { label: "Avg. Order Value", value: "$588", delta: "Stable", tone: "neutral" },
      { label: "Active Inventory", value: "59", delta: "-2.1%", tone: "warning" },
    ]);
  }

  if (path === "/admin/dashboard/sales" && method === "GET") {
    return jsonResponse([
      { month: "NOV", value: 120 },
      { month: "DEC", value: 155 },
      { month: "JAN", value: 204 },
      { month: "FEB", value: 168 },
      { month: "MAR", value: 230 },
      { month: "APR", value: 260 },
    ]);
  }

  if (path === "/admin/dashboard/low-stock" && method === "GET") {
    return jsonResponse(
      mockState.products
        .map(adminInventoryItem)
        .filter((item) => item.status !== "In Stock")
        .map((item) => ({
          name: item.name,
          stock: item.stock,
          percent: Math.max(8, Math.min(100, item.stock * 8)),
          status: item.status,
        })),
    );
  }

  if (path === "/admin/orders" && method === "GET") {
    return jsonResponse(
      mockState.orders.map((order) => ({
        id: order.id,
        userId: order.userId,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        createdAt: order.createdAt,
        status: order.status,
        total: order.total,
        itemCount: order.itemCount,
        fulfillment: order.fulfillment,
      })),
    );
  }

  if (path.match(/^\/admin\/orders\/[^/]+$/) && method === "GET") {
    const orderId = path.split("/")[3];
    const order = mockState.orders.find((entry) => entry.id === orderId);
    return order ? jsonResponse(adminOrderDetail(order)) : jsonResponse({ message: "Order not found." }, 404);
  }

  if (path.match(/^\/admin\/orders\/[^/]+\/status$/) && method === "PUT") {
    const orderId = path.split("/")[3];
    const order = mockState.orders.find((entry) => entry.id === orderId);
    const body = await parseBody(init);
    if (!order) {
      return jsonResponse({ message: "Order not found." }, 404);
    }

    const requestedStatus = String(body?.status ?? "") as MockOrderStatus;
    if (!(requestedStatus in orderTransitions)) {
      return jsonResponse({ message: `Unknown order status: ${requestedStatus}` }, 400);
    }

    if (requestedStatus !== order.status && !allowedNextStatuses(order.status).some((status) => status === requestedStatus)) {
      return jsonResponse(
        { message: `Orders in ${order.status} cannot move to ${requestedStatus}.` },
        409,
      );
    }

    if (requestedStatus !== order.status) {
      order.status = requestedStatus;
      order.fulfillment = fulfillmentForStatus(requestedStatus);
      order.paymentStatus = paymentStatusForStatus(requestedStatus);
      order.timeline = [...order.timeline, timelineTextForStatus(requestedStatus)];
    }

    return jsonResponse(adminOrderDetail(order));
  }

  if (path === "/admin/customers" && method === "GET") {
    return jsonResponse(adminCustomers());
  }

  if (path === "/admin/uploads/images" && method === "POST") {
    const body = init?.body;
    const file = body instanceof FormData ? body.get("file") : null;
    const fileName =
      file && typeof file === "object" && "name" in file && typeof file.name === "string"
        ? file.name
        : "uploaded-image.png";

    return jsonResponse({
      url: `http://localhost:8081/uploads/${fileName}`,
      filename: fileName,
    });
  }

  if (path.match(/^\/admin\/customers\/[^/]+\/status$/) && method === "PUT") {
    const customerId = path.split("/")[3];
    const body = await parseBody(init);
    const users = getStoredUsers();
    const userIndex = users.findIndex((user) => user.id === customerId && user.role === "customer");

    if (userIndex < 0) {
      return jsonResponse({ message: "Customer not found." }, 404);
    }

    const status = String(body?.status ?? "");
    if (status !== "Active" && status !== "Inactive") {
      return jsonResponse({ message: `Unknown customer status: ${status}` }, 400);
    }

    users[userIndex] = {
      ...users[userIndex],
      enabled: status === "Active",
    };
    window.localStorage.setItem("tactile.users", JSON.stringify(users));

    return jsonResponse(adminCustomers().find((customer) => customer.id === customerId));
  }

  if (path === "/admin/inventory" && method === "GET") {
    const query = (url.searchParams.get("query") ?? "").toLowerCase();
    const category = url.searchParams.get("category") ?? "All Categories";
    const stockStatus = url.searchParams.get("stockStatus") ?? "All Status";
    const inventory = mockState.products
      .map(adminInventoryItem)
      .filter((item) => !query || [item.name, item.subtitle, item.category, item.sku].join(" ").toLowerCase().includes(query))
      .filter((item) => category === "All Categories" || item.category === category)
      .filter((item) => stockStatus === "All Status" || item.status === stockStatus);
    return jsonResponse(inventory);
  }

  if (path.match(/^\/admin\/products\/[^/]+$/) && method === "GET") {
    const slug = path.split("/")[3];
    const product = findProduct(slug);
    return product ? jsonResponse(product) : jsonResponse({ message: "Product not found." }, 404);
  }

  if (path.match(/^\/admin\/products\/[^/]+\/draft$/) && method === "GET") {
    const slug = path.split("/")[3];
    const product = findProduct(slug);
    return product ? jsonResponse(adminProductDraft(product)) : jsonResponse({ message: "Product not found." }, 404);
  }

  if (path.match(/^\/admin\/products\/[^/]+\/reviews$/) && method === "GET") {
    return jsonResponse([]);
  }

  if (path === "/admin/reviews" && method === "GET") {
    return jsonResponse([]);
  }

  if (path.match(/^\/admin\/reviews\/[^/]+\/approve$/) && method === "POST") {
    return jsonResponse({ status: "Approved" });
  }

  if (path.match(/^\/admin\/reviews\/[^/]+\/reject$/) && method === "POST") {
    return jsonResponse({ status: "Rejected" });
  }

  if (path.match(/^\/admin\/products\/[^/]+$/) && method === "PUT") {
    const slug = path.split("/")[3];
    const product = findProduct(slug);
    const body = await parseBody(init);
    if (!product) {
      return jsonResponse({ message: "Product not found." }, 404);
    }

    product.name = body?.name ?? product.name;
    product.description = body?.description ?? product.description;
    if (Array.isArray(body?.images) && body.images.length) {
      product.gallery = body.images.map((image: { src: string; alt: string }) => ({
        src: image.src,
        alt: image.alt,
      }));
      product.image = product.gallery[0] ?? product.image;
    }
    return jsonResponse(product);
  }

  if (path.match(/^\/admin\/products\/[^/]+$/) && method === "DELETE") {
    return jsonResponse(undefined, 204);
  }

  return new Response(null, { status: 404 });
}

beforeEach(() => {
  if (typeof window.localStorage?.clear !== "function") {
    installStoragePolyfill();
  }

  window.localStorage.clear();
  window.scrollTo = vi.fn();
  mockState = createMockState();
  vi.stubGlobal("fetch", vi.fn(handleApiRequest));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
