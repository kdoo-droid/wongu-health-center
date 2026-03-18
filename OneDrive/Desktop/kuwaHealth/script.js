// ==============================
// Kuwa Health — Site Configuration
// ==============================
const CONFIG = {
  brand: {
    name: "Kuwa Health",
    descriptor: "Pure mulberry leaf powder capsules",
  },

  sourcing: {
    status: "Pre-launch · Supplier selection in review",
    regions: ["Kagoshima, Japan", "Kuwanosato"],
    note: "Each production batch is sourced from reviewed mulberry leaf suppliers. We evaluate quality, consistency, and pricing before confirming a supplier for each run. Current candidate regions include Kagoshima and Kuwanosato. No single supplier is confirmed as exclusive until production is finalised for that batch.",
    disclaimer: "Supplier selection may vary by batch. Final sourcing is confirmed prior to each production run.",
  },

  products: [
    {
      id: "60",
      size: "60 Capsules",
      tag: "Try First",
      subtitle: "Entry size",
      description:
        "The right starting point. A lower-commitment introduction to the Kuwa formula — ideal for first-time customers building a new daily routine.",
      idealFor: ["First-time buyers", "Introductory orders", "Giftable size"],
      price: "Pricing to be confirmed before launch",
      cta: "Reserve — 60 Capsule Bottle",
    },
    {
      id: "120",
      size: "120 Capsules",
      tag: "Best Value",
      subtitle: "Committed routine",
      description:
        "Twice the supply for customers ready to make a clean daily routine a real habit. Best value per capsule across both sizes and the clear upgrade path from the 60 count.",
      idealFor: ["Daily routine", "Returning customers", "Best value"],
      price: "Pricing to be confirmed before launch",
      cta: "Reserve — 120 Capsule Bottle",
    },
  ],

  faq: [
    {
      question: "What is the difference between the 60 and 120 capsule bottles?",
      answer:
        "Both bottles contain the same pure mulberry leaf powder formula. The 60 capsule bottle is the entry size — lower commitment, ideal for first-time customers. The 120 capsule bottle offers a longer supply and the best value per capsule for customers building a consistent daily routine.",
    },
    {
      question: "Can the supplier change from batch to batch?",
      answer:
        "Yes. We source mulberry leaf powder from reviewed regions including Kagoshima and Kuwanosato. Final supplier selection is made per batch based on quality consistency and pricing. We do not confirm a specific supplier until production is finalised for that batch.",
    },
    {
      question: "Will certifications or third-party testing be added later?",
      answer:
        "We are reviewing third-party testing options where appropriate. We will only publish verified proof elements — not placeholder badges or unconfirmed claims. Any certifications shown on this site will be real and verifiable before launch.",
    },
    {
      question: "Why is some product information listed as pending?",
      answer:
        "We are still finalising a number of pre-launch details including exact serving size, capsule shell specification, and final label copy. We chose to show these honestly as pending rather than invent details. All confirmed information will appear before any orders are fulfilled.",
    },
    {
      question: "Is this product intended to treat or prevent any health condition?",
      answer:
        "No. Kuwa Health supplements are not intended to diagnose, treat, cure, or prevent any disease. Statements on this site have not been evaluated by the Food and Drug Administration. Please consult a qualified healthcare professional before starting any supplement routine.",
    },
  ],
};

// ==============================
// Render — Product Cards & Detail Panel
// ==============================
function renderProducts() {
  const cardsEl = document.querySelector(".product-cards");
  const panelEl = document.querySelector(".product-detail-panel");
  if (!cardsEl || !panelEl) return;

  cardsEl.innerHTML = CONFIG.products
    .map(
      (p, i) => `
      <button class="product-card${i === 0 ? " selected" : ""}" data-product-id="${p.id}" aria-pressed="${i === 0 ? "true" : "false"}">
        <span class="product-card-tag">${p.tag}</span>
        <span class="product-card-size">${p.size}</span>
        <span class="product-card-subtitle">${p.subtitle}</span>
      </button>`
    )
    .join("");

  renderProductDetail(CONFIG.products[0]);

  cardsEl.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("click", () => {
      cardsEl.querySelectorAll(".product-card").forEach((c) => {
        c.classList.remove("selected");
        c.setAttribute("aria-pressed", "false");
      });
      card.classList.add("selected");
      card.setAttribute("aria-pressed", "true");
      const product = CONFIG.products.find((p) => p.id === card.dataset.productId);
      renderProductDetail(product);
    });
  });
}

function renderProductDetail(product) {
  const panelEl = document.querySelector(".product-detail-panel");
  if (!panelEl) return;

  panelEl.classList.add("transitioning");
  setTimeout(() => {
    panelEl.innerHTML = `
      <div class="detail-tag">${product.tag}</div>
      <h3 class="detail-size">${product.size}</h3>
      <p class="detail-description">${product.description}</p>
      <div class="detail-ideal">
        <span class="detail-ideal-label">Ideal for</span>
        <ul>${product.idealFor.map((item) => `<li>${item}</li>`).join("")}</ul>
      </div>
      <p class="detail-price">${product.price}</p>
      <button class="btn btn-primary btn-full detail-cta">${product.cta}</button>`;
    panelEl.classList.remove("transitioning");
  }, 180);
}

// ==============================
// Render — Sourcing Card
// ==============================
function renderSourcing() {
  const card = document.getElementById("sourcing-card");
  if (!card) return;

  card.innerHTML = `
    <div class="sourcing-status">${CONFIG.sourcing.status}</div>
    <p class="sourcing-note">${CONFIG.sourcing.note}</p>
    <div class="sourcing-regions">
      <span class="sourcing-regions-label">Candidate regions</span>
      <div class="sourcing-region-tags">
        ${CONFIG.sourcing.regions.map((r) => `<span class="region-tag">${r}</span>`).join("")}
      </div>
    </div>
    <p class="sourcing-disclaimer">${CONFIG.sourcing.disclaimer}</p>`;
}

// ==============================
// Render — FAQ Accordion
// ==============================
function renderFAQ() {
  const list = document.getElementById("faq-list");
  if (!list) return;

  list.innerHTML = CONFIG.faq
    .map(
      (item, i) => `
      <div class="faq-item reveal" data-delay="${i * 80}">
        <button class="faq-question" aria-expanded="false">
          <span>${item.question}</span>
          <span class="faq-icon" aria-hidden="true">+</span>
        </button>
        <div class="faq-answer">
          <p>${item.answer}</p>
        </div>
      </div>`
    )
    .join("");

  list.querySelectorAll(".faq-question").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".faq-item");
      const icon = btn.querySelector(".faq-icon");
      const isOpen = btn.getAttribute("aria-expanded") === "true";

      list.querySelectorAll(".faq-item").forEach((other) => {
        other.querySelector(".faq-question").setAttribute("aria-expanded", "false");
        other.querySelector(".faq-icon").textContent = "+";
        other.classList.remove("open");
      });

      if (!isOpen) {
        btn.setAttribute("aria-expanded", "true");
        icon.textContent = "−";
        item.classList.add("open");
      }
    });
  });
}

// ==============================
// Scroll Reveal (IntersectionObserver)
// ==============================
function initScrollReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const delay = parseInt(entry.target.dataset.delay || 0);
          setTimeout(() => {
            entry.target.classList.add("visible");
          }, delay);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
}

// ==============================
// Stagger delays for card grids
// ==============================
function initStaggerDelays() {
  document.querySelectorAll(".trust-grid, .formula-grid").forEach((group) => {
    group.querySelectorAll(".reveal").forEach((el, i) => {
      el.dataset.delay = i * 120;
    });
  });
}

// ==============================
// Mobile Navigation
// ==============================
function initMobileNav() {
  const toggle = document.querySelector(".nav-toggle");
  const mobileNav = document.querySelector(".mobile-nav");
  if (!toggle || !mobileNav) return;

  toggle.addEventListener("click", () => {
    const isOpen = mobileNav.classList.contains("open");
    mobileNav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(!isOpen));
    toggle.classList.toggle("active");
  });

  mobileNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileNav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.classList.remove("active");
    });
  });
}

// ==============================
// Header Scroll Behaviour
// ==============================
function initHeaderScroll() {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

// ==============================
// Waitlist Form (frontend placeholder)
// ==============================
function initForm() {
  const form = document.getElementById("waitlist-form");
  const success = document.getElementById("form-success");
  if (!form || !success) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    form.classList.add("hidden");
    success.classList.remove("hidden");
  });
}

// ==============================
// Init
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  renderProducts();
  renderSourcing();
  renderFAQ();
  initStaggerDelays();
  initScrollReveal();
  initMobileNav();
  initHeaderScroll();
  initForm();
});
