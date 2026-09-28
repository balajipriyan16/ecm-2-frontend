import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, API_BASE_URL } from "../config";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Profile({ user, setUser, loggedIn, setLoggedIn, cartCount, setCartCount }) {
    const nav = useNavigate();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                if (setUser) setUser(currentUser);
                if (setLoggedIn) setLoggedIn(true);

                currentUser.getIdToken().then((idToken) => {
                    axios.get(`${API_BASE_URL}/orders/history`, {
                        headers: { Authorization: `Bearer ${idToken}` }
                    }).then((res) => {
                        setOrders(res.data || []);
                        setLoading(false);
                    }).catch(() => {
                        setLoading(false);
                    });
                }).catch(() => setLoading(false));
            } else {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [setUser, setLoggedIn]);

    async function handleSignOut() {
        try {
            await signOut(auth);
            if (setLoggedIn) setLoggedIn(false);
            if (setUser) setUser(null);
            if (setCartCount) setCartCount(0);
            nav("/");
        } catch (error) {
            alert(error.message);
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
                    <span>Loading profile...</span>
                </div>
            </div>
        );
    }

    if (!user && !loggedIn) {
        return (
            <div className="min-h-screen bg-[#f8f5ee] flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-lg text-center border border-[#ede7dc]">
                    <div className="w-16 h-16 bg-[#f4eee4] text-[#174f55] rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-[#173e43] mb-2">Not Logged In</h2>
                    <p className="text-gray-500 text-sm mb-6">Please log in to access your profile details.</p>
                    <button
                        onClick={() => nav("/login")}
                        className="w-full bg-[#174f55] hover:bg-[#113a3f] text-white py-3 rounded-xl font-bold transition shadow-md"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    const displayName = user?.displayName || "User";
    const email = user?.email || "No email available";
    const avatarInitial = displayName.charAt(0).toUpperCase();

    return (
        <div className="min-h-screen bg-[#f8f5ee] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
            <div className="w-full max-w-2xl space-y-6">
                {/* Profile Card */}
                <div className="bg-white rounded-[28px] overflow-hidden shadow-xl border border-[#ede7dc]">
                    {/* Header Banner */}
                    <div className="bg-[#174f55] text-white px-8 py-10 text-center relative">
                        <div className="w-20 h-20 bg-[#174f55] border-2 border-white rounded-full flex items-center justify-center text-3xl font-extrabold text-white shadow-md mx-auto mb-3">
                            {avatarInitial}
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1">
                            {displayName}
                        </h1>

                        <p className="text-sm font-medium text-emerald-100/80">
                            {email}
                        </p>
                    </div>

                    {/* Profile Card Body */}
                    <div className="p-6 sm:p-8 space-y-6">
                        {/* Info Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Name Box */}
                            <div className="bg-[#faf8f5] p-4 rounded-2xl border border-[#ede7dc]">
                                <span className="block text-[11px] font-extrabold text-gray-400 tracking-wider uppercase mb-1">
                                    NAME
                                </span>
                                <p className="text-base font-bold text-[#173e43]">
                                    {displayName}
                                </p>
                            </div>

                            {/* Email Box */}
                            <div className="bg-[#faf8f5] p-4 rounded-2xl border border-[#ede7dc]">
                                <span className="block text-[11px] font-extrabold text-gray-400 tracking-wider uppercase mb-1">
                                    EMAIL ADDRESS
                                </span>
                                <div className="flex items-center gap-2 text-gray-700">
                                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                    </svg>
                                    <p className="text-sm font-semibold truncate text-[#173e43]">
                                        {email}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Current Cart Banner */}
                        <div className="bg-emerald-50 border border-emerald-200 p-4 sm:p-5 rounded-2xl flex items-center justify-between gap-4">
                            <div>
                                <h3 className="font-bold text-[#173e43] text-sm sm:text-base">
                                    Current Cart
                                </h3>
                                <p className="text-xs text-gray-600 mt-0.5">
                                    You have <span className="font-bold text-[#173e43]">{cartCount || 0}</span> items in your cart.
                                </p>
                            </div>

                            <button
                                onClick={() => nav("/cart")}
                                className="bg-[#174f55] hover:bg-[#113a3f] text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition shadow-sm flex-shrink-0 cursor-pointer"
                            >
                                View Cart
                            </button>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between pt-4 border-t border-[#ede7dc]">
                            <button
                                type="button"
                                onClick={() => nav("/")}
                                className="border border-[#d0d5dd] hover:bg-gray-50 text-[#173e43] font-bold text-sm px-5 py-2.5 rounded-xl transition cursor-pointer"
                            >
                                Back to Store
                            </button>

                            <button
                                type="button"
                                onClick={handleSignOut}
                                className="bg-[#ff3b30] hover:bg-red-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                                </svg>
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Order History Section */}
                <div className="bg-white rounded-[28px] p-6 sm:p-8 shadow-xl border border-[#ede7dc] space-y-4">
                    <div className="flex items-center justify-between border-b border-[#ede7dc] pb-4">
                        <h2 className="text-xl font-extrabold text-[#173e43] flex items-center gap-2">
                            <span>📦 Order History</span>
                            <span className="bg-[#174f55] text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                                {orders.length}
                            </span>
                        </h2>
                    </div>

                    {orders.length === 0 ? (
                        <div className="p-6 text-center">
                            <p className="text-gray-500 text-sm font-medium">No orders placed yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.map((order, idx) => (
                                <div key={idx} className="bg-[#faf8f5] rounded-2xl p-5 border border-[#ede7dc] space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ede7dc] pb-3">
                                        <div>
                                            <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider block">
                                                Order ID: {order.orderId || `ORD-${idx + 1}`}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {order.date ? new Date(order.date).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Recently"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                                                ✓ Paid
                                            </span>
                                            <span className="text-lg font-black text-[#173e43]">
                                                ₹{order.amount}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Order Items */}
                                    {order.items && order.items.length > 0 && (
                                        <div className="space-y-2 pt-1">
                                            {order.items.map((item, itemIdx) => (
                                                <div key={itemIdx} className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-white rounded-lg p-1 border border-[#ede7dc] flex items-center justify-center flex-shrink-0">
                                                            <img
                                                                src={`${API_BASE_URL}/images/${item._id}.jpg`}
                                                                alt={item.name}
                                                                className="w-full h-full object-contain"
                                                                onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/40?text=P"; }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <span className="font-bold text-[#173e43] block truncate max-w-[180px] sm:max-w-xs">{item.name}</span>
                                                            <span className="text-xs text-gray-500">Qty: {item.quantity || 1} × ₹{item.price}</span>
                                                        </div>
                                                    </div>
                                                    <span className="font-bold text-[#173e43]">₹{(item.price || 0) * (item.quantity || 1)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Profile;
