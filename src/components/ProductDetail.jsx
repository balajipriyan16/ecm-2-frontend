import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, API_BASE_URL } from "../config";
import axios from "axios";

function ProductDetail({ setCartCount }) {
    const { id } = useParams();
    const nav = useNavigate();
    const [product, setProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [addedToCart, setAddedToCart] = useState(false);

    useEffect(() => {
        axios
            .get(`${API_BASE_URL}/product/${id}`)
            .then((res) => {
                setProduct(res.data);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    }, [id]);

    async function handleAddToCart() {
        const user = auth.currentUser;

        if (!user) {
            alert("Please login first");
            return false;
        }

        if (adding) return false;

        setAdding(true);
        try {
            const idToken = await user.getIdToken();

            const promises = [];
            for (let i = 0; i < quantity; i++) {
                promises.push(
                    axios.post(`${API_BASE_URL}/add/${id}`, null, {
                        headers: {
                            Authorization: `Bearer ${idToken}`,
                        },
                    })
                );
            }

            const responses = await Promise.all(promises);
            const lastRes = responses[responses.length - 1];
            if (lastRes && setCartCount) {
                setCartCount(lastRes.data.count);
            }
            setAddedToCart(true);
            setTimeout(() => {
                setAddedToCart(false);
            }, 1500);
            return true;
        } catch (error) {
            console.error("Add to cart error:", error);
            alert("Failed to add to cart: " + (error.response?.data?.message || error.message));
            return false;
        } finally {
            setAdding(false);
        }
    }

    async function handleBuyNow() {
        const success = await handleAddToCart();
        if (success) {
            nav("/cart");
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f8f5ee] flex items-center justify-center p-6">
                <div className="flex items-center gap-3 font-semibold text-[#174f55]">
                    <svg className="animate-spin h-6 w-6 text-[#174f55]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Loading product details...</span>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-[#f8f5ee] flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-lg text-center border border-[#ede7dc]">
                    <h2 className="text-xl font-bold text-[#173e43] mb-2">Product Not Found</h2>
                    <p className="text-gray-500 text-sm mb-6">The requested product could not be found.</p>
                    <button
                        onClick={() => nav("/")}
                        className="bg-[#174f55] hover:bg-[#113a3f] text-white px-6 py-2.5 rounded-xl font-bold transition shadow-md"
                    >
                        Back to Store
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f5ee] py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <button
                    onClick={() => nav("/")}
                    className="flex items-center gap-2 text-sm font-bold text-[#174f55] hover:text-[#113a3f] transition mb-6"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    <span>Back to Store</span>
                </button>

                <div className="bg-white rounded-[28px] overflow-hidden shadow-xl border border-[#ede7dc] p-6 sm:p-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center">
                        {/* Left Column: Product Image Box */}
                        <div className="bg-[#f4eee4] rounded-2xl p-8 relative flex items-center justify-center min-h-[320px] sm:min-h-[380px]">
                            <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-[11px] font-extrabold tracking-wider px-3 py-1 rounded-full text-gray-700 uppercase border border-gray-100 shadow-xs">
                                {product.category || "General"}
                            </span>
                            <img
                                src={`${API_BASE_URL}/images/${product._id}.jpg`}
                                alt={product.name}
                                className="w-full h-64 sm:h-80 object-contain drop-shadow-md"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://via.placeholder.com/300?text=Product";
                                }}
                            />
                        </div>

                        {/* Right Column: Details & Purchase */}
                        <div className="flex flex-col justify-center space-y-6">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#173e43] leading-snug mb-3">
                                    {product.name}
                                </h1>
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl sm:text-3xl font-black text-[#173e43]">
                                        ₹{product.price}
                                    </span>
                                    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                                        In Stock
                                    </span>
                                </div>
                            </div>

                            <div className="border-t border-[#ede7dc] pt-4">
                                <span className="block text-[10px] font-extrabold text-gray-400 tracking-wider uppercase mb-1">
                                    DESCRIPTION
                                </span>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    {product.description}
                                </p>
                            </div>

                            {/* Quantity Control */}
                            <div className="flex items-center gap-4 pt-2">
                                <span className="text-sm font-bold text-[#173e43]">
                                    Quantity:
                                </span>
                                <div className="flex items-center border border-[#e2ddd3] rounded-xl px-3 py-1.5 bg-[#faf8f5] gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                                        className="w-6 h-6 flex items-center justify-center font-bold text-[#173e43] hover:bg-[#eae5da] rounded transition select-none"
                                    >
                                        -
                                    </button>
                                    <span className="font-bold text-sm text-[#173e43] min-w-[16px] text-center select-none">
                                        {quantity}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setQuantity((prev) => prev + 1)}
                                        className="w-6 h-6 flex items-center justify-center font-bold text-[#173e43] hover:bg-[#eae5da] rounded transition select-none"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                <button
                                    type="button"
                                    disabled={adding}
                                    onClick={handleAddToCart}
                                    className={`flex-1 py-3.5 px-5 rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 ${
                                        addedToCart
                                            ? "bg-emerald-600 text-white cursor-default"
                                            : adding
                                            ? "bg-[#ee8568]/80 text-white cursor-not-allowed opacity-80"
                                            : "bg-[#ee8568] hover:bg-[#e67556] text-white cursor-pointer"
                                    }`}
                                >
                                    {adding ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Adding...</span>
                                        </>
                                    ) : addedToCart ? (
                                        <>
                                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                            </svg>
                                            <span>Added to Cart!</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                                            </svg>
                                            <span>Add to Cart</span>
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    disabled={adding}
                                    onClick={handleBuyNow}
                                    className="flex-1 bg-[#174f55] hover:bg-[#113a3f] text-white py-3.5 px-5 rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    <span>Buy Now</span>
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProductDetail;
