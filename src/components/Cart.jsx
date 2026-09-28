import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, API_BASE_URL } from "../config";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Cart({ setCartCount }) {
    const nav = useNavigate();
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paymentLoading, setPaymentLoading] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                currentUser.getIdToken()
                    .then((idToken) => {
                        axios.get(`${API_BASE_URL}/cart`, {
                            headers: {
                                Authorization: `Bearer ${idToken}`
                            }
                        })
                        .then((response) => {
                            const cartItems = Array.isArray(response.data) ? response.data : [];
                            setCart(cartItems);
                            const totalCount = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
                            if (setCartCount) setCartCount(totalCount);
                            setLoading(false);
                        })
                        .catch(() => {
                            setCart([]);
                            setLoading(false);
                        });
                    })
                    .catch(() => {
                        setLoading(false);
                    });
            } else {
                setLoading(false);
                alert("Please login first");
            }
        });

        return () => unsubscribe();
    }, [setCartCount]);

    async function handleIncrease(id) {
        const user = auth.currentUser;
        if (!user) return;
        const idToken = await user.getIdToken();

        axios.post(`${API_BASE_URL}/cart/increase/${id}`, null, {
            headers: { Authorization: `Bearer ${idToken}` }
        }).then((res) => {
            if (setCartCount) setCartCount(res.data.count);
            setCart((prev) =>
                prev.map((item) =>
                    item._id === id ? { ...item, quantity: item.quantity + 1 } : item
                )
            );
        }).catch(() => {});
    }

    async function handleDecrease(id) {
        const user = auth.currentUser;
        if (!user) return;
        const idToken = await user.getIdToken();

        const currentItem = cart.find((item) => item._id === id);

        if (currentItem && currentItem.quantity > 1) {
            axios.post(`${API_BASE_URL}/cart/decrease/${id}`, null, {
                headers: { Authorization: `Bearer ${idToken}` }
            }).then((res) => {
                if (setCartCount) setCartCount(res.data.count);
                setCart((prev) =>
                    prev.map((item) =>
                        item._id === id ? { ...item, quantity: item.quantity - 1 } : item
                    )
                );
            }).catch(() => {});
        } else {
            handleRemove(id);
        }
    }

    async function handleRemove(id) {
        const user = auth.currentUser;
        if (!user) return;
        const idToken = await user.getIdToken();

        axios.delete(`${API_BASE_URL}/cart/remove/${id}`, {
            headers: { Authorization: `Bearer ${idToken}` }
        }).then((res) => {
            if (setCartCount) setCartCount(res.data.count);
            setCart((prev) => prev.filter((item) => item._id !== id));
        }).catch(() => {});
    }

    const totalAmount = cart.reduce(
        (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
        0
    );

    function loadRazorpayScript() {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    }

    const [orderSuccessData, setOrderSuccessData] = useState(null);

    async function handleRazorpayPayment() {
        if (cart.length === 0 || totalAmount <= 0) {
            alert("Your cart is empty!");
            return;
        }

        const user = auth.currentUser;
        if (!user) {
            alert("Please login to proceed with payment");
            return;
        }

        try {
            setPaymentLoading(true);
            const loaded = await loadRazorpayScript();
            if (!loaded) {
                alert("Failed to load Razorpay SDK. Please check your network connection.");
                setPaymentLoading(false);
                return;
            }

            const idToken = await user.getIdToken();

            const { data: orderData } = await axios.post(
                `${API_BASE_URL}/create-order`,
                { amount: totalAmount },
                { headers: { Authorization: `Bearer ${idToken}` } }
            );

            const options = {
                key: orderData.key,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "MyKart Store",
                description: "Purchase Order Payment",
                order_id: orderData.id,
                handler: async function (response) {
                    try {
                        await axios.post(
                            `${API_BASE_URL}/verify-payment`,
                            {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                cartItems: cart,
                                totalAmount: totalAmount
                            },
                            { headers: { Authorization: `Bearer ${idToken}` } }
                        );

                        const totalItemsCount = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);
                        const refId = response.razorpay_order_id || `RZP-${Date.now()}`;

                        setOrderSuccessData({
                            orderRef: refId,
                            totalItems: totalItemsCount,
                            totalPaid: totalAmount
                        });

                        setPaymentLoading(false);
                        setCart([]);
                        if (setCartCount) setCartCount(0);
                    } catch (error) {
                        setPaymentLoading(false);
                        alert("Payment verification failed: " + (error.response?.data?.message || error.message));
                    }
                },
                prefill: {
                    name: user.displayName || "Customer",
                    email: user.email || "",
                },
                theme: {
                    color: "#174f55"
                },
                modal: {
                    ondismiss: function () {
                        setPaymentLoading(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            setPaymentLoading(false);
            alert("Failed to initiate payment: " + (error.response?.data?.message || error.message));
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
                    <span>Loading your cart...</span>
                </div>
            </div>
        );
    }

    if (orderSuccessData) {
        return (
            <div className="min-h-screen bg-[#f8f5ee] py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    {/* Back Link */}
                    <button
                        onClick={() => nav("/")}
                        className="flex items-center gap-2 text-sm font-bold text-[#174f55] hover:text-[#113a3f] transition mb-6 cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        <span>Back to Store</span>
                    </button>

                    {/* Page Title */}
                    <div className="flex items-center gap-3 mb-8">
                        <div className="bg-[#174f55] text-white p-2.5 rounded-xl flex items-center justify-center shadow-sm">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-extrabold text-[#173e43] tracking-tight">Shopping Cart</h1>
                    </div>

                    {/* Order Confirmed Card */}
                    <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-[#ede7dc] max-w-xl mx-auto text-center space-y-6">
                        {/* Top Check Icon & Badge */}
                        <div className="space-y-3">
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                                <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                            </div>
                            <span className="inline-block bg-emerald-100 text-emerald-700 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                                PAYMENT CONFIRMED
                            </span>
                        </div>

                        {/* Title & Message */}
                        <div>
                            <h2 className="text-3xl font-extrabold text-[#173e43] mb-1">
                                Order Confirmed!
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                                Your payment was successful and your order has been saved to your profile.
                            </p>
                        </div>

                        {/* Summary Details Box */}
                        <div className="bg-[#faf8f5] p-5 rounded-2xl border border-[#ede7dc] text-xs sm:text-sm space-y-3 text-left">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 font-medium">Order Reference:</span>
                                <span className="font-extrabold text-[#173e43] font-mono">{orderSuccessData.orderRef}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 font-medium">Total Items:</span>
                                <span className="font-extrabold text-[#173e43]">{orderSuccessData.totalItems}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 font-medium">Payment Status:</span>
                                <span className="font-bold text-emerald-600 flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                    </svg>
                                    Paid & Confirmed
                                </span>
                            </div>

                            <div className="border-t border-[#ede7dc] pt-3 flex justify-between items-center">
                                <span className="text-sm sm:text-base font-extrabold text-[#173e43]">Total Paid:</span>
                                <span className="text-2xl font-black text-emerald-600">₹{orderSuccessData.totalPaid}</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                                onClick={() => nav("/profile")}
                                className="bg-[#174f55] hover:bg-[#113a3f] text-white font-bold py-3 px-6 rounded-xl shadow-md transition flex-1 text-sm cursor-pointer"
                            >
                                View Orders in Profile
                            </button>
                            <button
                                onClick={() => nav("/")}
                                className="bg-[#f1eeea] hover:bg-[#e7e2da] text-[#173e43] font-bold py-3 px-6 rounded-xl transition flex-1 text-sm cursor-pointer"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f5ee] py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <button
                    onClick={() => nav("/")}
                    className="flex items-center gap-2 text-sm font-bold text-[#174f55] hover:text-[#113a3f] transition mb-6"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    <span>Back to Store</span>
                </button>

                <div className="flex items-center gap-3 mb-8">
                    <div className="bg-[#174f55] text-white p-2.5 rounded-xl flex items-center justify-center shadow-sm">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-extrabold text-[#173e43] tracking-tight">Shopping Cart</h1>
                </div>

                {cart.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-[#ede7dc] max-w-lg mx-auto">
                        <div className="w-16 h-16 bg-[#f4eee4] text-[#174f55] rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-[#173e43] mb-2">Your cart is empty</h2>
                        <p className="text-gray-500 text-sm mb-6">Looks like you haven't added anything to your cart yet.</p>
                        <button
                            onClick={() => nav("/")}
                            className="bg-[#174f55] hover:bg-[#113a3f] text-white px-6 py-2.5 rounded-xl font-bold transition shadow-md"
                        >
                            Browse Products
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Cart Items List */}
                        <div className="lg:col-span-2 flex flex-col gap-4">
                            {cart.map((item) => (
                                <div
                                    key={item._id}
                                    className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-[#ede7dc] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition hover:shadow-md"
                                >
                                    {/* Left: Image & Info */}
                                    <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
                                        <div className="w-20 h-20 bg-[#f4eee4] rounded-xl flex items-center justify-center p-2 flex-shrink-0">
                                            <img
                                                src={`${API_BASE_URL}/images/${item._id}.jpg`}
                                                alt={item.name}
                                                className="w-full h-full object-contain"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = "https://via.placeholder.com/80?text=Product";
                                                }}
                                            />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-[#173e43] text-base sm:text-lg leading-snug truncate">
                                                {item.name}
                                            </h3>
                                            <span className="inline-block bg-[#f1f1f3] text-[#667085] text-xs font-semibold px-2.5 py-0.5 rounded-full mt-1 mb-1">
                                                {item.category || "General"}
                                            </span>
                                            <p className="text-xs sm:text-sm font-semibold text-gray-500">
                                                ₹{item.price} each
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right Controls Container */}
                                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-[#f1f1f3]">
                                        {/* Quantity Pill */}
                                        <div className="flex items-center border border-[#e2ddd3] rounded-lg px-2 py-1 bg-[#faf8f5] gap-3">
                                            <button
                                                type="button"
                                                onClick={() => handleDecrease(item._id)}
                                                className="w-7 h-7 flex items-center justify-center font-bold text-[#173e43] hover:bg-[#eae5da] rounded transition text-base select-none"
                                            >
                                                -
                                            </button>
                                            <span className="font-bold text-sm text-[#173e43] min-w-[16px] text-center select-none">
                                                {item.quantity}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleIncrease(item._id)}
                                                className="w-7 h-7 flex items-center justify-center font-bold text-[#173e43] hover:bg-[#eae5da] rounded transition text-base select-none"
                                            >
                                                +
                                            </button>
                                        </div>

                                        {/* Item Total Price */}
                                        <div className="text-right min-w-[80px]">
                                            <p className="text-lg font-extrabold text-[#173e43]">
                                                ₹{item.price * item.quantity}
                                            </p>
                                        </div>

                                        {/* Trash Delete Icon */}
                                        <button
                                            type="button"
                                            onClick={() => handleRemove(item._id)}
                                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                                            title="Remove item"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary Card */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#ede7dc] flex flex-col gap-5 h-fit sticky top-8">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-[#173e43]">Order Summary</h2>
                                <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-200">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                    </svg>
                                    Secure Payment
                                </span>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between text-gray-500">
                                    <span>Subtotal</span>
                                    <span className="font-semibold text-[#173e43]">₹{totalAmount}</span>
                                </div>
                                <div className="flex justify-between text-gray-500">
                                    <span>Shipping Fee</span>
                                    <span className="font-bold text-emerald-600">FREE</span>
                                </div>
                            </div>

                            <div className="border-t border-[#ede7dc] pt-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-base font-bold text-[#173e43]">Total Amount</span>
                                    <span className="text-2xl font-black text-[#173e43]">₹{totalAmount}</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleRazorpayPayment}
                                disabled={paymentLoading}
                                className="w-full bg-[#174f55] hover:bg-[#113a3f] text-white py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {paymentLoading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Processing Payment...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                        </svg>
                                        <span>Pay ₹{totalAmount} with Razorpay</span>
                                    </>
                                )}
                            </button>

                            <div className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
                                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                </svg>
                                <span>Encrypted & Secure Payment Gateway</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Cart;