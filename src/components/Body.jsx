import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, API_BASE_URL } from "../config";

function Body(props) {
    const nav = useNavigate();
    const [ProData, setProData] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [addedItems, setAddedItems] = useState({});

    useEffect(() => {
        axios.get(`${API_BASE_URL}/products`).then((data) => {
            setProData(data.data);
        });
    }, []);

    async function AddtoCart(id) {
        const user = auth.currentUser;

        if (!user) {
            alert("Please login first");
            return;
        }

        const idToken = await user.getIdToken();

        axios
            .post(`${API_BASE_URL}/add/${id}`, null, {
                headers: {
                    Authorization: `Bearer ${idToken}`,
                },
            })
            .then((response) => {
                props.setCartCount(response.data.count);

                setAddedItems((prev) => ({ ...prev, [id]: true }));
                setTimeout(() => {
                    setAddedItems((prev) => ({ ...prev, [id]: false }));
                }, 1500);
            })
            .catch(() => {});
    }

    // Only extract categories that actually exist in the MongoDB products
    const dbCategories = Array.from(
        new Set(ProData.map((p) => p.category).filter(Boolean))
    );
    const categories = ["All", ...dbCategories];

    const filteredProducts = ProData.filter((item) => {
        const itemCat = (item.category || "").toLowerCase().trim();
        const selCat = selectedCategory.toLowerCase().trim();

        const matchesCategory =
            selectedCategory === "All" ||
            itemCat === selCat ||
            (itemCat && selCat && (itemCat.includes(selCat) || selCat.includes(itemCat)));

        const searchLower = searchQuery.toLowerCase().trim();
        const matchesSearch =
            !searchLower ||
            (item.name && item.name.toLowerCase().includes(searchLower)) ||
            (item.category && item.category.toLowerCase().includes(searchLower)) ||
            (item.description && item.description.toLowerCase().includes(searchLower));

        return matchesCategory && matchesSearch;
    });

    return (
        <div className="bg-[#f8f5ee] min-h-screen">
            {/* Category Navigation Bar & Search Header */}
            <div className="bg-[#174f55] py-3 px-6 shadow-md">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto scrollbar-none py-1">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                                    selectedCategory === cat
                                        ? "bg-white text-[#174f55] shadow-sm"
                                        : "text-white/80 hover:text-white hover:bg-white/10"
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Search Bar Input */}
                    <div className="relative w-full md:w-80">
                        <svg
                            className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                            />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search products by name or category..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-full text-xs text-gray-800 bg-white outline-none focus:ring-2 focus:ring-[#174f55] transition placeholder:text-gray-400 shadow-inner"
                        />
                    </div>
                </div>
            </div>

            {/* Hero Banner Section */}
            <div className="py-10 px-4 text-center">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#173e43] tracking-tight mb-2">
                    Shop Your Way
                </h1>
                <p className="text-gray-600 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
                    Explore our featured products, handpicked for quality, value, and everyday needs.
                </p>
            </div>

            {/* Products Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
                {filteredProducts.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-[#ede7dc] max-w-md mx-auto">
                        <p className="text-gray-500 font-semibold text-sm">No products found matching your search.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
                        {filteredProducts.map((item) => (
                            <div
                                key={item._id}
                                className="bg-white rounded-3xl p-5 shadow-sm border border-[#ede7dc] flex flex-col justify-between hover:shadow-md transition"
                            >
                                <div>
                                    {/* Image Container */}
                                    <div className="w-full h-52 bg-[#f4eee4] rounded-2xl flex items-center justify-center p-4 mb-4 relative overflow-hidden">
                                        <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-[11px] font-semibold px-2.5 py-0.5 rounded-full text-gray-600 border border-gray-100 shadow-2xs">
                                            {item.category || "General"}
                                        </span>
                                        <img
                                            src={`${API_BASE_URL}/images/${item._id}.jpg`}
                                            alt={item.name}
                                            className="w-full h-full object-contain"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src =
                                                    "https://via.placeholder.com/200?text=Product";
                                            }}
                                        />
                                    </div>

                                    {/* Info */}
                                    <h3 className="font-bold text-[#173e43] text-lg mb-1 leading-snug">
                                        {item.name}
                                    </h3>
                                    <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">
                                        {item.description}
                                    </p>
                                    <p className="text-xl font-extrabold text-[#173e43] mb-4">
                                        ₹{item.price}
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => nav(`/product/${item._id}`)}
                                            className="bg-[#174f55] hover:bg-[#113a3f] text-white flex-1 py-2 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition cursor-pointer"
                                        >
                                            Explore
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => nav(`/product/${item._id}`)}
                                            className="bg-stone-200 hover:bg-stone-300 text-stone-700 w-9 h-9 rounded-xl flex items-center justify-center transition font-bold cursor-pointer"
                                        >
                                            →
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => AddtoCart(item._id)}
                                        className={`w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition flex items-center justify-center gap-2 ${
                                            addedItems[item._id]
                                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                                : "bg-[#ee8568] hover:bg-[#e67556] text-white"
                                        }`}
                                    >
                                        {addedItems[item._id] ? (
                                            <>
                                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                </svg>
                                                <span>Added to Cart!</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                                                </svg>
                                                <span>Add to Cart</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Body;