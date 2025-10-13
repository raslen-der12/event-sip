// src/pages/Marketplace.jsx
import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Lottie from "lottie-react";
import marketplaceAnim from "../../assets/lottie/marketplace.json"; // keep this path
import Footer from "../../components/footer/Footer";
import { cta, footerData, nav, topbar } from "../main.mock";
import HeaderShell from "../../components/layout/HeaderShell";

// ✅ Demo product data
const products = [
  {
    id: 1,
    name: "Organic Coffee Beans",
    category: "Agricultural Products",
    subCategory: "Coffee & Tea",
    price: "$25/kg",
    img: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&q=80&w=800",
  },
  {
    id: 2,
    name: "Men's Cotton T-Shirt",
    category: "Apparel",
    subCategory: "Men's Clothing",
    price: "$15",
    img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&q=80&w=800",
  },
  {
    id: 3,
    name: "Dell XPS 13 Laptop",
    category: "Consumer Electronics",
    subCategory: "Laptops, Computers & Accessories",
    price: "$1200",
    img: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&q=80&w=800",
  },
  {
    id: 4,
    name: "Cold-Pressed Olive Oil",
    category: "Agricultural Products",
    subCategory: "Oils",
    price: "$18 / bottle",
    img: "https://images.unsplash.com/photo-1590080875839-5feef4b71a6a?auto=format&q=80&w=800",
  },
  {
    id: 5,
    name: "Noise Cancelling Headphones",
    category: "Consumer Electronics",
    subCategory: "Audio",
    price: "$199",
    img: "https://images.unsplash.com/photo-1580894894513-541e68bb8a5e?auto=format&q=80&w=800",
  },
  {
    id: 6,
    name: "Handmade Leather Wallet",
    category: "Apparel",
    subCategory: "Accessories",
    price: "$45",
    img: "https://images.unsplash.com/photo-1600180758890-6ffdd16e97b9?auto=format&q=80&w=800",
  },
];

const categories = {
  "Agricultural Products": ["Coffee & Tea", "Oils", "Fruits"],
  Apparel: ["Men's Clothing", "Women's Clothing", "Accessories"],
  "Consumer Electronics": ["Laptops, Computers & Accessories", "Audio", "Cameras"],
};

// ✅ Product Card
function ProductCard({ product }) {
  return (
    <article className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-transform transform hover:-translate-y-1 overflow-hidden">
      <div className="relative h-56">
        <img
          src={product.img}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <span className="absolute left-3 top-3 text-xs font-semibold px-3 py-1 bg-[#1C3664] text-white rounded-full">
          {product.category}
        </span>
        <span className="absolute right-3 top-3 text-sm font-semibold bg-white/90 text-[#1C3664] px-3 py-1 rounded-md">
          {product.price}
        </span>
      </div>

      <div className="p-3">
        <h3 className="text-lg font-semibold text-[#1C3664] mb-2">{product.name}</h3>
        <p className="text-sm text-gray-500 mb-3">{product.subCategory}</p>

        <div className="flex gap-2">
          <Link
            to={`/product/${product.id}`}
            className="flex-1 text-center bg-[#EB5434] hover:bg-[#ff7a4b] text-white px-3 py-2 rounded-lg font-medium transition"
          >
            View
          </Link>
          <a
            href={`mailto:info@gits.com?subject=Inquiry about ${encodeURIComponent(product.name)}`}
            className="flex-1 text-center border border-gray-200 px-3 py-2 rounded-lg font-medium text-[#1C3664] hover:bg-gray-50"
          >
            Contact
          </a>
        </div>
      </div>
    </article>
  );
}

// ✅ Filters Sidebar
function FiltersSidebar({
  search,
  setSearch,
  selectedCategory,
  setSelectedCategory,
  selectedSubCategory,
  setSelectedSubCategory,
  onClear,
}) {
  return (
    <aside className="w-full lg:w-72 bg-white p-6 rounded-2xl shadow-sm sticky top-20 h-max">
      <h4 className="text-lg font-semibold mb-4 text-[#1C3664]">Filters</h4>

      <input
        type="text"
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-3 border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-[#EB5434]/40"
      />

      <label className="block text-sm font-medium mb-2 text-gray-700">Category</label>
      <select
        value={selectedCategory}
        onChange={(e) => {
          setSelectedCategory(e.target.value);
          setSelectedSubCategory("");
        }}
        className="w-full p-3 border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-[#EB5434]/40"
      >
        <option value="">All categories</option>
        {Object.keys(categories).map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>

      {selectedCategory && (
        <>
          <label className="block text-sm font-medium mb-2 text-gray-700">Sub-sector</label>
          <select
            value={selectedSubCategory}
            onChange={(e) => setSelectedSubCategory(e.target.value)}
            className="w-full p-3 border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-[#EB5434]/40"
          >
            <option value="">All sub-sectors</option>
            {categories[selectedCategory].map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </>
      )}

      <button
        onClick={onClear}
        className="w-full mt-3 py-2 bg-[#EB5434] text-white rounded-lg hover:bg-[#ff7a4b]"
      >
        Clear Filters
      </button>
    </aside>
  );
}

// ✅ MAIN COMPONENT
export default function Marketplace() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");

  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (selectedCategory ? p.category === selectedCategory : true) &&
      (selectedSubCategory ? p.subCategory === selectedSubCategory : true)
    );
  }, [search, selectedCategory, selectedSubCategory]);

  return (
        <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />
    <div className="font-poppins bg-[#F9FAFB] text-gray-800 min-h-screen">
      {/* HERO SECTION */}
      <section className="flex flex-col lg:flex-row items-center justify-center text-center lg:text-left bg-gradient-to-r from-[#1C3664] to-[#EB5434] text-white py-24 px-5 gap-10">
        <div className="w-full lg:w-1/2 flex justify-center">
          <Lottie animationData={marketplaceAnim} loop className="w-72 lg:w-96" />
        </div>
        <div className="w-full lg:w-1/2">
          <h1 className="text-4xl font-bold mb-4">Explore the Marketplace</h1>
          <p className="text-lg mb-6 max-w-xl mx-auto lg:mx-0">
            Find verified products across multiple sectors — from agriculture to electronics.
          </p>
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-3/4 p-4 rounded-full text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#EB5434]"
          />
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-5 py-16 flex flex-col lg:flex-row gap-10">
        {/* FILTERS SIDEBAR */}
        <FiltersSidebar
          search={search}
          setSearch={setSearch}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedSubCategory={selectedSubCategory}
          setSelectedSubCategory={setSelectedSubCategory}
          onClear={() => {
            setSearch("");
            setSelectedCategory("");
            setSelectedSubCategory("");
          }}
        />

        {/* PRODUCT GRID */}
        <main className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <p className="col-span-full text-center text-gray-500 text-lg">
              No products found.
            </p>
          )}
        </main>
      </div>
    </div>
          <Footer
        brand={footerData.brand}
        columns={footerData.columns}
        socials={footerData.socials}
        actions={footerData.actions}
        bottomLinks={footerData.bottomLinks}
      />
    </>
  );
}
