"use strict";

/* ==================================================
   CONFIGURATION
================================================== */

const STORAGE_KEYS = {
  CART: "cart",
  WISHLIST: "wishlist",
  PRODUCTS: "eliteProducts",

  SELECTED_PRODUCT: "selectedProduct",
  SELECTED_PRODUCT_DATA: "selectedProductData",

  USER: "user",
  ELITE_USER: "eliteUser",
  ELITE_USER_ACCOUNT: "eliteUserAccount",

  LOGIN_STATUS: "isLoggedIn",
  ACTIVE_USER_ID: "activeUserId",
  LOGIN_REDIRECT: "eliteLoginRedirect",

  ACTIVE_SHOPPING_OWNER: "eliteActiveShoppingOwner",

  SCOPED_CART_PREFIX: "eliteCart",
  SCOPED_WISHLIST_PREFIX: "eliteWishlist"
};

const FALLBACK_IMAGE =
  "./Website-images/no-image.png";

const SLIDER_DELAY = 4000;


/* ==================================================
   DEFAULT PRODUCTS
================================================== */

const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: "Wireless Earbuds",
    category: "mobile",
    price: 1499,
    oldPrice: 1999,
    discount: 25,
    reviews: 124,
    stock: 12,
    description:
      "Premium wireless earbuds with clear sound and comfortable fit.",
    image:
      "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=600&h=600&fit=crop"
  },

  {
    id: 2,
    name: "Gaming Keyboard",
    category: "gaming",
    price: 2499,
    oldPrice: 3499,
    discount: 29,
    reviews: 98,
    stock: 8,
    description:
      "Mechanical gaming keyboard designed for fast and accurate gameplay.",
    image:
      "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=600&h=600&fit=crop"
  },

  {
    id: 3,
    name: "Fast Charger",
    category: "mobile",
    price: 799,
    oldPrice: 1299,
    discount: 38,
    reviews: 210,
    stock: 18,
    description:
      "Compact fast charger for reliable everyday mobile charging.",
    image:
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&h=600&fit=crop"
  },

  {
    id: 4,
    name: "Smart Watch",
    category: "tech",
    price: 2999,
    oldPrice: 4499,
    discount: 33,
    reviews: 156,
    stock: 10,
    description:
      "Modern smart watch with activity tracking and daily notifications.",
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop"
  },

  {
    id: 5,
    name: "Gaming Mouse",
    category: "gaming",
    price: 1199,
    oldPrice: 1799,
    discount: 34,
    reviews: 87,
    stock: 15,
    description:
      "Responsive gaming mouse with comfortable grip and accurate control.",
    image:
      "https://images.unsplash.com/photo-1527814050087-3793815479db?w=600&h=600&fit=crop"
  },

  {
    id: 6,
    name: "JBL Bluetooth Speaker",
    category: "tech",
    price: 3499,
    oldPrice: 4999,
    discount: 30,
    reviews: 142,
    stock: 7,
    description:
      "Portable Bluetooth speaker with powerful audio and modern design.",
    image:
      "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&h=600&fit=crop"
  }
];


/* ==================================================
   PAGE DATA
================================================== */

let products = [];
let cart = [];
let wishlist = [];

let activeCategory = "all";

let currentSlide = 0;
let sliderTimer = null;


/* ==================================================
   STORAGE HELPERS
================================================== */

function readStorageObject(key) {
  try {
    const value = JSON.parse(
      localStorage.getItem(key)
    );

    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      return value;
    }

    return null;
  } catch (error) {
    console.error(
      `Unable to read ${key}:`,
      error
    );

    return null;
  }
}

function getStorageArray(key) {
  try {
    const value = JSON.parse(
      localStorage.getItem(key)
    );

    return Array.isArray(value)
      ? value
      : [];
  } catch (error) {
    console.error(
      `Unable to read ${key}:`,
      error
    );

    return [];
  }
}

function setBaseStorageArray(
  key,
  data
) {
  localStorage.setItem(
    key,
    JSON.stringify(
      Array.isArray(data)
        ? data
        : []
    )
  );
}

function saveStorageArray(
  key,
  data
) {
  try {
    const safeData =
      Array.isArray(data)
        ? data
        : [];

    localStorage.setItem(
      key,
      JSON.stringify(safeData)
    );

    if (
      key === STORAGE_KEYS.CART ||
      key === STORAGE_KEYS.WISHLIST
    ) {
      const owner =
        getCurrentShoppingOwner();

      const scopedKey =
        key === STORAGE_KEYS.CART
          ? getScopedCartKey(owner)
          : getScopedWishlistKey(owner);

      localStorage.setItem(
        scopedKey,
        JSON.stringify(safeData)
      );

      localStorage.setItem(
        STORAGE_KEYS.ACTIVE_SHOPPING_OWNER,
        owner
      );
    }

    return true;
  } catch (error) {
    console.error(
      `Unable to save ${key}:`,
      error
    );

    showStoreToast(
      "Browser storage is unavailable.",
      "error"
    );

    return false;
  }
}


/* ==================================================
   USER ACCOUNT
================================================== */

function normalizeUserEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getLoggedInUser() {
  const possibleUsers = [
    readStorageObject(
      STORAGE_KEYS.USER
    ),

    readStorageObject(
      STORAGE_KEYS.ELITE_USER
    ),

    readStorageObject(
      STORAGE_KEYS.ELITE_USER_ACCOUNT
    )
  ];

  return (
    possibleUsers.find(user => {
      return (
        user &&
        (
          user.id ||
          user.userId ||
          user.user_id ||
          user.email
        )
      );
    }) || null
  );
}

function getUserId(user) {
  if (!user) {
    return "";
  }

  return String(
    user.id ??
    user.userId ??
    user.user_id ??
    ""
  ).trim();
}

function getUserEmail(user) {
  if (!user) {
    return "";
  }

  return normalizeUserEmail(
    user.email ??
    user.userEmail ??
    user.accountEmail ??
    ""
  );
}

function getUserKey(user) {
  if (!user) {
    return "";
  }

  const savedUserKey =
    String(
      user.userKey || ""
    ).trim();

  if (savedUserKey) {
    return savedUserKey;
  }

  const userId =
    getUserId(user);

  if (userId) {
    return `id:${userId}`;
  }

  const email =
    getUserEmail(user);

  if (email) {
    return `email:${email}`;
  }

  return "";
}

function isUserLoggedIn() {
  const user =
    getLoggedInUser();

  const loginStatus =
    localStorage.getItem(
      STORAGE_KEYS.LOGIN_STATUS
    );

  return Boolean(
    user &&
    getUserKey(user) &&
    loginStatus !== "false"
  );
}

function getCurrentShoppingOwner() {
  if (!isUserLoggedIn()) {
    return "guest";
  }

  const user =
    getLoggedInUser();

  return (
    getUserKey(user) ||
    "guest"
  );
}


/* ==================================================
   USER-WISE CART AND WISHLIST KEYS
================================================== */

function encodeStorageOwner(owner) {
  return encodeURIComponent(
    String(owner || "guest")
  );
}

function getScopedShoppingKey(
  prefix,
  owner
) {
  return (
    `${prefix}_${encodeStorageOwner(
      owner
    )}`
  );
}

function getScopedCartKey(owner) {
  return getScopedShoppingKey(
    STORAGE_KEYS.SCOPED_CART_PREFIX,
    owner
  );
}

function getScopedWishlistKey(owner) {
  return getScopedShoppingKey(
    STORAGE_KEYS.SCOPED_WISHLIST_PREFIX,
    owner
  );
}


/* ==================================================
   CART NORMALIZATION
================================================== */

function normalizeCartItem(item) {
  const quantity =
    item?.qty ??
    item?.quantity ??
    1;

  const normalizedQuantity =
    Math.max(
      1,
      Number.parseInt(
        quantity,
        10
      ) || 1
    );

  return {
    ...item,

    id:
      item?.id,

    price:
      Math.max(
        0,
        Number(item?.price) || 0
      ),

    qty:
      normalizedQuantity,

    quantity:
      normalizedQuantity
  };
}

function mergeCartArrays(
  firstCart,
  secondCart
) {
  const mergedItems =
    new Map();

  const allItems = [
    ...(Array.isArray(firstCart)
      ? firstCart
      : []),

    ...(Array.isArray(secondCart)
      ? secondCart
      : [])
  ];

  allItems.forEach(item => {
    if (
      !item ||
      item.id === undefined ||
      item.id === null
    ) {
      return;
    }

    const normalizedItem =
      normalizeCartItem(item);

    const itemKey =
      String(normalizedItem.id);

    const existingItem =
      mergedItems.get(itemKey);

    if (!existingItem) {
      mergedItems.set(
        itemKey,
        normalizedItem
      );

      return;
    }

    const product =
      getProductById(
        normalizedItem.id
      );

    const availableStock =
      Math.max(
        1,
        Number(
          product?.stock ??
          normalizedItem.stock
        ) || 1
      );

    const combinedQuantity =
      Math.min(
        availableStock,
        existingItem.qty +
        normalizedItem.qty
      );

    existingItem.qty =
      combinedQuantity;

    existingItem.quantity =
      combinedQuantity;
  });

  return Array.from(
    mergedItems.values()
  );
}

function mergeWishlistArrays(
  firstWishlist,
  secondWishlist
) {
  const uniqueItems =
    new Map();

  const allItems = [
    ...(Array.isArray(firstWishlist)
      ? firstWishlist
      : []),

    ...(Array.isArray(secondWishlist)
      ? secondWishlist
      : [])
  ];

  allItems.forEach(item => {
    if (
      item &&
      item.id !== undefined &&
      item.id !== null
    ) {
      uniqueItems.set(
        String(item.id),
        item
      );
    }
  });

  return Array.from(
    uniqueItems.values()
  );
}

function persistOwnerShoppingData(
  owner,
  cartData,
  wishlistData
) {
  const normalizedOwner =
    String(owner || "guest");

  localStorage.setItem(
    getScopedCartKey(
      normalizedOwner
    ),
    JSON.stringify(
      Array.isArray(cartData)
        ? cartData
        : []
    )
  );

  localStorage.setItem(
    getScopedWishlistKey(
      normalizedOwner
    ),
    JSON.stringify(
      Array.isArray(wishlistData)
        ? wishlistData
        : []
    )
  );
}


/* ==================================================
   SWITCH USER SHOPPING DATA
================================================== */

function synchronizeShoppingContext() {
  const currentOwner =
    getCurrentShoppingOwner();

  const previousOwner =
    String(
      localStorage.getItem(
        STORAGE_KEYS.ACTIVE_SHOPPING_OWNER
      ) || ""
    );

  const baseCart =
    getStorageArray(
      STORAGE_KEYS.CART
    );

  const baseWishlist =
    getStorageArray(
      STORAGE_KEYS.WISHLIST
    );

  /*
    First website load.
  */

  if (!previousOwner) {
    const scopedCart =
      getStorageArray(
        getScopedCartKey(
          currentOwner
        )
      );

    const scopedWishlist =
      getStorageArray(
        getScopedWishlistKey(
          currentOwner
        )
      );

    const firstCart =
      scopedCart.length > 0
        ? scopedCart
        : baseCart;

    const firstWishlist =
      scopedWishlist.length > 0
        ? scopedWishlist
        : baseWishlist;

    setBaseStorageArray(
      STORAGE_KEYS.CART,
      firstCart
    );

    setBaseStorageArray(
      STORAGE_KEYS.WISHLIST,
      firstWishlist
    );

    persistOwnerShoppingData(
      currentOwner,
      firstCart,
      firstWishlist
    );

    localStorage.setItem(
      STORAGE_KEYS.ACTIVE_SHOPPING_OWNER,
      currentOwner
    );

    return;
  }

  /*
    Same logged-in user.
  */

  if (
    previousOwner ===
    currentOwner
  ) {
    persistOwnerShoppingData(
      currentOwner,
      baseCart,
      baseWishlist
    );

    return;
  }

  /*
    Save previous user's cart and wishlist.
  */

  persistOwnerShoppingData(
    previousOwner,
    baseCart,
    baseWishlist
  );

  const currentScopedCart =
    getStorageArray(
      getScopedCartKey(
        currentOwner
      )
    );

  const currentScopedWishlist =
    getStorageArray(
      getScopedWishlistKey(
        currentOwner
      )
    );

  let nextCart =
    currentScopedCart;

  let nextWishlist =
    currentScopedWishlist;

  /*
    Guest products account login ke baad
    user account me merge honge.
  */

  if (
    previousOwner === "guest" &&
    currentOwner !== "guest"
  ) {
    nextCart =
      mergeCartArrays(
        currentScopedCart,
        baseCart
      );

    nextWishlist =
      mergeWishlistArrays(
        currentScopedWishlist,
        baseWishlist
      );
  }

  setBaseStorageArray(
    STORAGE_KEYS.CART,
    nextCart
  );

  setBaseStorageArray(
    STORAGE_KEYS.WISHLIST,
    nextWishlist
  );

  persistOwnerShoppingData(
    currentOwner,
    nextCart,
    nextWishlist
  );

  localStorage.setItem(
    STORAGE_KEYS.ACTIVE_SHOPPING_OWNER,
    currentOwner
  );
}

function saveActiveShoppingData() {
  const owner =
    getCurrentShoppingOwner();

  persistOwnerShoppingData(
    owner,

    getStorageArray(
      STORAGE_KEYS.CART
    ),

    getStorageArray(
      STORAGE_KEYS.WISHLIST
    )
  );

  localStorage.setItem(
    STORAGE_KEYS.ACTIVE_SHOPPING_OWNER,
    owner
  );
}


/* ==================================================
   LOGIN, CHECKOUT AND ORDERS
================================================== */

function redirectToLogin(
  redirectPage = "index.html"
) {
  localStorage.setItem(
    STORAGE_KEYS.LOGIN_REDIRECT,
    redirectPage
  );

  window.location.href =
    "login.html";
}

function openMyOrders() {
  if (!isUserLoggedIn()) {
    redirectToLogin(
      "my_orders.html"
    );

    return;
  }

  window.location.href =
    "my_orders.html";
}

function openCheckout() {
  const currentCart =
    getStorageArray(
      STORAGE_KEYS.CART
    );

  if (currentCart.length === 0) {
    showStoreToast(
      "Your cart is empty.",
      "warning"
    );

    return;
  }

  if (!isUserLoggedIn()) {
    redirectToLogin(
      "checkout.html"
    );

    return;
  }

  window.location.href =
    "checkout.html";
}

function logoutUser() {
  saveActiveShoppingData();

  localStorage.removeItem(
    STORAGE_KEYS.USER
  );

  localStorage.removeItem(
    STORAGE_KEYS.ELITE_USER
  );

  localStorage.removeItem(
    STORAGE_KEYS.ELITE_USER_ACCOUNT
  );

  localStorage.removeItem(
    STORAGE_KEYS.ACTIVE_USER_ID
  );

  localStorage.removeItem(
    STORAGE_KEYS.LOGIN_REDIRECT
  );

  localStorage.setItem(
    STORAGE_KEYS.LOGIN_STATUS,
    "false"
  );

  const guestCart =
    getStorageArray(
      getScopedCartKey(
        "guest"
      )
    );

  const guestWishlist =
    getStorageArray(
      getScopedWishlistKey(
        "guest"
      )
    );

  setBaseStorageArray(
    STORAGE_KEYS.CART,
    guestCart
  );

  setBaseStorageArray(
    STORAGE_KEYS.WISHLIST,
    guestWishlist
  );

  localStorage.setItem(
    STORAGE_KEYS.ACTIVE_SHOPPING_OWNER,
    "guest"
  );

  cart =
    guestCart.map(
      normalizeCartItem
    );

  wishlist =
    mergeWishlistArrays(
      [],
      guestWishlist
    );

  updateHeaderCounters();
  updateAuthUI();
  applyProductFilters();

  showStoreToast(
    "You have been logged out.",
    "info"
  );

  window.setTimeout(() => {
    window.location.href =
      "index.html";
  }, 450);
}


/* ==================================================
   NAVBAR LOGIN / LOGOUT UI
================================================== */

function updateAuthUI() {
  const loggedIn =
    isUserLoggedIn();

  const user =
    loggedIn
      ? getLoggedInUser()
      : null;

  const userEmail =
    getUserEmail(user);

  const displayName =
    String(
      user?.name ||
      user?.fullName ||
      userEmail.split("@")[0] ||
      "Account"
    );

  const authButtons =
    document.querySelectorAll(
      [
        "[data-auth-button]",
        "#loginBtn",
        "#navLoginButton",
        "#accountButton"
      ].join(",")
    );

  authButtons.forEach(button => {
    if (
      !(button instanceof HTMLElement)
    ) {
      return;
    }

    if (loggedIn) {
      button.textContent =
        "🚪 Logout";

      button.setAttribute(
        "title",
        `Logged in as ${displayName}`
      );

      button.onclick = event => {
        event.preventDefault();
        logoutUser();
      };
    } else {
      button.textContent =
        "🔐 Login";

      button.setAttribute(
        "title",
        "Login to EliteStore"
      );

      button.onclick = event => {
        event.preventDefault();

        redirectToLogin(
          "index.html"
        );
      };
    }
  });

  const userNameElements =
    document.querySelectorAll(
      [
        "[data-user-name]",
        "#userName",
        "#navUserName"
      ].join(",")
    );

  userNameElements.forEach(element => {
    element.textContent =
      loggedIn
        ? displayName
        : "Guest";

    if (
      element.hasAttribute(
        "data-hide-when-guest"
      )
    ) {
      element.hidden =
        !loggedIn;
    }
  });

  if (document.body) {
    document.body.classList.toggle(
      "user-logged-in",
      loggedIn
    );

    document.body.classList.toggle(
      "user-logged-out",
      !loggedIn
    );
  }
}


/* ==================================================
   LOAD PRODUCTS
================================================== */

function loadStoreProducts() {
  const savedProducts =
    getStorageArray(
      STORAGE_KEYS.PRODUCTS
    );

  if (savedProducts.length > 0) {
    return savedProducts;
  }

  const defaultProducts =
    DEFAULT_PRODUCTS.map(product => ({
      ...product
    }));

  localStorage.setItem(
    STORAGE_KEYS.PRODUCTS,
    JSON.stringify(
      defaultProducts
    )
  );

  return defaultProducts;
}


/* ==================================================
   LOAD CART AND WISHLIST
================================================== */

function loadCart() {
  cart =
    getStorageArray(
      STORAGE_KEYS.CART
    )
      .filter(item => {
        return (
          item &&
          item.id !== undefined &&
          item.id !== null
        );
      })
      .map(
        normalizeCartItem
      );

  return cart;
}

function loadWishlist() {
  const savedWishlist =
    getStorageArray(
      STORAGE_KEYS.WISHLIST
    ).filter(item => {
      return (
        item &&
        item.id !== undefined &&
        item.id !== null
      );
    });

  wishlist =
    mergeWishlistArrays(
      [],
      savedWishlist
    );

  return wishlist;
}


/* ==================================================
   TOAST NOTIFICATIONS
================================================== */

function getToastContainer() {
  let toastContainer =
    document.getElementById(
      "storeToastContainer"
    );

  if (toastContainer) {
    return toastContainer;
  }

  toastContainer =
    document.createElement("div");

  toastContainer.id =
    "storeToastContainer";

  toastContainer.className =
    "store-toast-container";

  toastContainer.setAttribute(
    "aria-live",
    "polite"
  );

  toastContainer.setAttribute(
    "aria-atomic",
    "true"
  );

  const parent =
    document.body ||
    document.documentElement;

  parent.appendChild(
    toastContainer
  );

  return toastContainer;
}

function getToastIcon(type) {
  const icons = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ"
  };

  return (
    icons[type] ||
    icons.info
  );
}

function showStoreToast(
  message,
  type = "info",
  duration = 2600
) {
  const toastContainer =
    getToastContainer();

  const toast =
    document.createElement("div");

  toast.className =
    `store-toast ${type}`;

  toast.innerHTML = `
    <span class="store-toast-icon">
      ${getToastIcon(type)}
    </span>

    <span>
      ${escapeHtml(message)}
    </span>
  `;

  toastContainer.appendChild(
    toast
  );

  window.setTimeout(() => {
    toast.classList.add(
      "hide"
    );

    window.setTimeout(() => {
      toast.remove();
    }, 260);
  }, duration);
}


/* ==================================================
   COMMON FUNCTIONS
================================================== */

function getProductById(productId) {
  return products.find(product => {
    return (
      String(product.id) ===
      String(productId)
    );
  });
}

function formatPrice(value) {
  return Number(value || 0)
    .toLocaleString(
      "en-IN",
      {
        maximumFractionDigits: 2
      }
    );
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isProductWishlisted(
  productId
) {
  return wishlist.some(item => {
    return (
      String(item.id) ===
      String(productId)
    );
  });
}

function createProductImage(product) {
  const image =
    escapeHtml(
      product.image ||
      FALLBACK_IMAGE
    );

  const name =
    escapeHtml(
      product.name ||
      "Product"
    );

  return `
    <img
      src="${image}"
      alt="${name}"
      loading="lazy"
      onerror="
        this.onerror = null;
        this.src = '${FALLBACK_IMAGE}';
      "
    >
  `;
}


/* ==================================================
   PRODUCT BUTTON SUCCESS
================================================== */

function showCartButtonSuccess(
  productId
) {
  const button =
    document.getElementById(
      `add-cart-button-${productId}`
    );

  if (!button) {
    return;
  }

  const originalText =
    button.dataset.originalText ||
    button.textContent.trim();

  button.dataset.originalText =
    originalText;

  button.textContent =
    "✓ Added to Cart";

  button.classList.add(
    "button-success"
  );

  button.disabled = true;

  window.setTimeout(() => {
    button.textContent =
      originalText;

    button.classList.remove(
      "button-success"
    );

    const product =
      getProductById(
        productId
      );

    button.disabled =
      !product ||
      Number(product.stock) <= 0;
  }, 1300);
}


/* ==================================================
   DISPLAY PRODUCTS
================================================== */

function displayProducts(
  productListData = products
) {
  const productList =
    document.getElementById(
      "productList"
    );

  if (!productList) {
    return;
  }

  if (
    !Array.isArray(productListData) ||
    productListData.length === 0
  ) {
    productList.innerHTML = `
      <div class="no-products-found product-filter-animation">

        <h2>
          No products found
        </h2>

        <p>
          Try another search or select
          a different category.
        </p>

      </div>
    `;

    return;
  }

  productList.innerHTML =
    productListData
      .map((product, index) => {
        const wishlisted =
          isProductWishlisted(
            product.id
          );

        const safeName =
          escapeHtml(
            product.name
          );

        const safeCategory =
          escapeHtml(
            product.category
          );

        const productStock =
          Math.max(
            0,
            Number(product.stock) || 0
          );

        const stockText =
          productStock > 0
            ? `⚡ ${productStock} In Stock`
            : "Out of Stock";

        const animationDelay =
          index * 90;

        return `
          <article
            class="card product-filter-animation"
            data-category="${safeCategory}"
            style="--product-delay: ${animationDelay}ms;"
          >

            <span class="discount-badge">
              -${Number(product.discount) || 0}%
            </span>

            <div class="product-image">

              ${createProductImage(product)}

              <button
                type="button"
                class="wishlist-btn ${
                  wishlisted
                    ? "saved"
                    : ""
                }"
                id="wishlist-button-${product.id}"
                onclick="toggleWishlist('${product.id}')"
                title="${
                  wishlisted
                    ? "Remove from wishlist"
                    : "Add to wishlist"
                }"
                aria-label="Wishlist ${safeName}"
              >
                ${
                  wishlisted
                    ? "♥"
                    : "♡"
                }
              </button>

            </div>

            <div class="rating">
              ★★★★★

              <span>
                (${Number(product.reviews) || 0} Reviews)
              </span>
            </div>

            <h3>
              ${safeName}
            </h3>

            <div class="price-box">

              <span class="price">
                ₹${formatPrice(product.price)}
              </span>

              <span class="old-price">
                ₹${formatPrice(product.oldPrice)}
              </span>

            </div>

            <p class="delivery">
              🚚 Free Delivery
            </p>

            <p
              class="stock"
              style="${
                productStock <= 0
                  ? "color: #dc2626;"
                  : ""
              }"
            >
              ${stockText}
            </p>

            <button
              type="button"
              class="view-btn"
              onclick="viewProduct('${product.id}')"
            >
              View Details
            </button>

            <button
              type="button"
              class="add-cart-btn"
              id="add-cart-button-${product.id}"
              onclick="addToCart('${product.id}')"
              ${
                productStock <= 0
                  ? "disabled"
                  : ""
              }
            >
              🛒 Add to Cart
            </button>

          </article>
        `;
      })
      .join("");
}


/* ==================================================
   SEARCH AND CATEGORY FILTER
================================================== */

function applyProductFilters() {
  const searchInput =
    document.getElementById(
      "searchInput"
    );

  const searchText =
    searchInput
      ? searchInput.value
          .trim()
          .toLowerCase()
      : "";

  const filteredProducts =
    products.filter(product => {
      const category =
        String(
          product.category || ""
        ).toLowerCase();

      const searchableText =
        [
          product.name,
          product.category,
          product.description
        ]
          .join(" ")
          .toLowerCase();

      const categoryMatches =
        activeCategory === "all" ||
        category === activeCategory;

      const searchMatches =
        searchableText.includes(
          searchText
        );

      return (
        categoryMatches &&
        searchMatches
      );
    });

  displayProducts(
    filteredProducts
  );
}

function searchProducts() {
  applyProductFilters();
}

function filterProducts(category) {
  const selectedCategory =
    String(
      category || "all"
    ).toLowerCase();

  const allowedCategories = [
    "all",
    "mobile",
    "gaming",
    "tech"
  ];

  activeCategory =
    allowedCategories.includes(
      selectedCategory
    )
      ? selectedCategory
      : "all";

  applyProductFilters();
}


/* ==================================================
   PRODUCT DETAILS
================================================== */

function viewProduct(productId) {
  const product =
    getProductById(
      productId
    );

  if (!product) {
    showStoreToast(
      "Product was not found.",
      "error"
    );

    return;
  }

  localStorage.setItem(
    STORAGE_KEYS.SELECTED_PRODUCT,
    String(product.id)
  );

  localStorage.setItem(
    STORAGE_KEYS.SELECTED_PRODUCT_DATA,
    JSON.stringify(product)
  );

  window.location.href =
    `product.html?id=${encodeURIComponent(
      product.id
    )}`;
}


/* ==================================================
   CART FUNCTIONS
================================================== */

function addToCart(productId) {
  const product =
    getProductById(
      productId
    );

  if (!product) {
    showStoreToast(
      "Product was not found.",
      "error"
    );

    return;
  }

  const availableStock =
    Math.max(
      0,
      Number(product.stock) || 0
    );

  if (availableStock <= 0) {
    showStoreToast(
      "This product is currently out of stock.",
      "warning"
    );

    return;
  }

  loadCart();

  const existingItem =
    cart.find(item => {
      return (
        String(item.id) ===
        String(productId)
      );
    });

  if (existingItem) {
    if (
      existingItem.qty >=
      availableStock
    ) {
      showStoreToast(
        `Only ${availableStock} item(s) are available in stock.`,
        "warning"
      );

      return;
    }

    existingItem.qty += 1;

    existingItem.quantity =
      existingItem.qty;
  } else {
    cart.push({
      ...product,

      qty: 1,
      quantity: 1
    });
  }

  const saved =
    saveStorageArray(
      STORAGE_KEYS.CART,
      cart
    );

  if (!saved) {
    return;
  }

  updateHeaderCounters();

  if (
    typeof window.updateHomeCounters ===
    "function"
  ) {
    window.updateHomeCounters();
  }

  showCartButtonSuccess(
    productId
  );

  showStoreToast(
    `${product.name} added to cart.`,
    "success"
  );
}


/* ==================================================
   WISHLIST FUNCTIONS
================================================== */

function toggleWishlist(productId) {
  const product =
    getProductById(
      productId
    );

  if (!product) {
    showStoreToast(
      "Product was not found.",
      "error"
    );

    return;
  }

  loadWishlist();

  const existingIndex =
    wishlist.findIndex(item => {
      return (
        String(item.id) ===
        String(productId)
      );
    });

  let productSaved = false;

  if (existingIndex === -1) {
    wishlist.push({
      ...product
    });

    productSaved = true;
  } else {
    wishlist.splice(
      existingIndex,
      1
    );
  }

  const saved =
    saveStorageArray(
      STORAGE_KEYS.WISHLIST,
      wishlist
    );

  if (!saved) {
    return;
  }

  updateWishlistButton(
    productId,
    productSaved
  );

  updateHeaderCounters();

  if (
    typeof window.updateHomeCounters ===
    "function"
  ) {
    window.updateHomeCounters();
  }

  showStoreToast(
    productSaved
      ? `${product.name} added to wishlist.`
      : `${product.name} removed from wishlist.`,

    productSaved
      ? "success"
      : "info"
  );
}

function addToWishlist(productId) {
  loadWishlist();

  if (
    isProductWishlisted(
      productId
    )
  ) {
    showStoreToast(
      "Product is already in your wishlist.",
      "info"
    );

    return;
  }

  toggleWishlist(
    productId
  );
}

function updateWishlistButton(
  productId,
  productSaved
) {
  const wishlistButton =
    document.getElementById(
      `wishlist-button-${productId}`
    );

  if (!wishlistButton) {
    return;
  }

  wishlistButton.textContent =
    productSaved
      ? "♥"
      : "♡";

  wishlistButton.classList.toggle(
    "saved",
    productSaved
  );

  wishlistButton.title =
    productSaved
      ? "Remove from wishlist"
      : "Add to wishlist";

  wishlistButton.setAttribute(
    "aria-label",
    productSaved
      ? "Remove product from wishlist"
      : "Add product to wishlist"
  );
}


/* ==================================================
   HEADER COUNTERS
================================================== */

function updateHeaderCounters() {
  loadCart();
  loadWishlist();

  const totalCartQuantity =
    cart.reduce(
      (total, item) => {
        return (
          total +
          Math.max(
            1,
            Number(item.qty) || 1
          )
        );
      },
      0
    );

  const cartCount =
    document.getElementById(
      "cart-count"
    );

  const footerCartCount =
    document.getElementById(
      "cartNavCount"
    );

  const wishlistCount =
    document.getElementById(
      "wishlist-count"
    );

  if (cartCount) {
    cartCount.textContent =
      totalCartQuantity;
  }

  if (footerCartCount) {
    footerCartCount.textContent =
      totalCartQuantity;
  }

  if (wishlistCount) {
    wishlistCount.textContent =
      wishlist.length;
  }
}


/* ==================================================
   HERO SLIDER
================================================== */

function activateSlide(index) {
  const slides =
    document.querySelectorAll(
      ".slide"
    );

  const dots =
    document.querySelectorAll(
      ".dot"
    );

  if (slides.length === 0) {
    return;
  }

  currentSlide =
    (
      Number(index) +
      slides.length
    ) % slides.length;

  slides.forEach(
    (slide, slideIndex) => {
      const active =
        slideIndex ===
        currentSlide;

      slide.classList.toggle(
        "active",
        active
      );

      slide.setAttribute(
        "aria-hidden",
        String(!active)
      );
    }
  );

  dots.forEach(
    (dot, dotIndex) => {
      const active =
        dotIndex ===
        currentSlide;

      dot.classList.toggle(
        "active",
        active
      );

      dot.setAttribute(
        "aria-current",
        active
          ? "true"
          : "false"
      );
    }
  );
}

function showSlide(index) {
  activateSlide(index);
  restartSlider();
}

function nextSlide() {
  activateSlide(
    currentSlide + 1
  );

  restartSlider();
}

function prevSlide() {
  activateSlide(
    currentSlide - 1
  );

  restartSlider();
}

function startSlider() {
  const slides =
    document.querySelectorAll(
      ".slide"
    );

  stopSlider();

  if (
    slides.length <= 1 ||
    document.hidden
  ) {
    return;
  }

  sliderTimer =
    window.setInterval(() => {
      activateSlide(
        currentSlide + 1
      );
    }, SLIDER_DELAY);
}

function stopSlider() {
  if (sliderTimer) {
    window.clearInterval(
      sliderTimer
    );
  }

  sliderTimer = null;
}

function restartSlider() {
  stopSlider();
  startSlider();
}

function setupSliderInteractions() {
  const slider =
    document.querySelector(
      ".hero-slider"
    );

  if (!slider) {
    return;
  }

  slider.addEventListener(
    "mouseenter",
    stopSlider
  );

  slider.addEventListener(
    "mouseleave",
    startSlider
  );

  slider.addEventListener(
    "focusin",
    stopSlider
  );

  slider.addEventListener(
    "focusout",
    startSlider
  );

  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) {
        stopSlider();
      } else {
        startSlider();
      }
    }
  );
}


/* ==================================================
   INITIALIZE WEBSITE
================================================== */

function initializeStorePage() {
  products =
    loadStoreProducts();

  synchronizeShoppingContext();

  loadCart();
  loadWishlist();

  applyProductFilters();

  updateHeaderCounters();
  updateAuthUI();

  activateSlide(0);
  setupSliderInteractions();
  startSlider();

  getToastContainer();
}

if (
  document.readyState ===
  "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    initializeStorePage
  );
} else {
  initializeStorePage();
}


/* ==================================================
   UPDATE BETWEEN BROWSER TABS
================================================== */

window.addEventListener(
  "storage",
  event => {
    const watchedKeys = [
      STORAGE_KEYS.CART,
      STORAGE_KEYS.WISHLIST,
      STORAGE_KEYS.PRODUCTS,

      STORAGE_KEYS.USER,
      STORAGE_KEYS.ELITE_USER,
      STORAGE_KEYS.ELITE_USER_ACCOUNT,

      STORAGE_KEYS.LOGIN_STATUS,
      STORAGE_KEYS.ACTIVE_USER_ID
    ];

    if (
      event.key !== null &&
      !watchedKeys.includes(
        event.key
      )
    ) {
      return;
    }

    if (
      event.key ===
      STORAGE_KEYS.PRODUCTS
    ) {
      products =
        loadStoreProducts();

      applyProductFilters();

      showStoreToast(
        "Products updated from Admin Panel.",
        "info"
      );

      return;
    }

    synchronizeShoppingContext();

    loadCart();
    loadWishlist();

    updateHeaderCounters();
    updateAuthUI();
    applyProductFilters();
  }
);


/* ==================================================
   GLOBAL FUNCTIONS
================================================== */

window.addToCart =
  addToCart;

window.addToWishlist =
  addToWishlist;

window.toggleWishlist =
  toggleWishlist;

window.viewProduct =
  viewProduct;

window.searchProducts =
  searchProducts;

window.filterProducts =
  filterProducts;

window.showSlide =
  showSlide;

window.nextSlide =
  nextSlide;

window.prevSlide =
  prevSlide;

window.logoutUser =
  logoutUser;

window.openMyOrders =
  openMyOrders;

window.openCheckout =
  openCheckout;

window.redirectToLogin =
  redirectToLogin;

window.updateAuthUI =
  updateAuthUI;

window.updateHeaderCounters =
  updateHeaderCounters;