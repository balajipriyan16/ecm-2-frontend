import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, API_BASE_URL } from "../config";
import { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Header(props) {
    const nav = useNavigate();

    const cartCount = props.cartCount;
    const setCartCount = props.setCartCount;

    const user = props.user;
    const setUser = props.setUser;

    const loggedIn = props.loggedIn;
    const setLoggedIn = props.setLoggedIn;

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setLoggedIn(true);
                setUser(currentUser);
            } else {
                setLoggedIn(false);
                setUser(null);
            }
        });

        return () => unsubscribe();
    }, [setLoggedIn, setUser]);

    useEffect(() => {
        if (user && typeof user.getIdToken === "function") {
            user.getIdToken()
                .then((idToken) => {
                    axios.get(`${API_BASE_URL}/user`, {
                        headers: {
                            Authorization: `Bearer ${idToken}`,
                        },
                    }).catch(() => {});
                })
                .catch(() => {});
        }
    }, [user]);

    useEffect(() => {
        if (user && typeof user.getIdToken === "function") {
            user.getIdToken()
                .then((idToken) => {
                    axios
                        .get(`${API_BASE_URL}/cart/count`, {
                            headers: {
                                Authorization: `Bearer ${idToken}`,
                            },
                        })
                        .then((response) => {
                            setCartCount(response.data?.count || 0);
                        })
                        .catch(() => {
                            setCartCount(0);
                        });
                })
                .catch(() => {
                    setCartCount(0);
                });
        } else {
            setCartCount(0);
        }
    }, [user, setCartCount]);

    function GoogleLogin() {
        nav("/login");
    }

    async function LogOut() {
        await signOut(auth);

        setLoggedIn(false);
        setUser(null);
        setCartCount(0);

        nav("/");
    }

    return (
        <header className="bg-[#f8f5ee] border-b border-[#ede7dc] px-6 py-4 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Brand Logo */}
                <div
                    onClick={() => nav("/")}
                    className="cursor-pointer font-black text-2xl sm:text-3xl text-[#173e43] tracking-tight hover:opacity-90 transition"
                >
                    MyKart
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-3">
                    {/* Cart Button */}
                    <button
                        type="button"
                        onClick={() => nav("/cart")}
                        className="bg-white border border-[#d0d5dd] hover:bg-gray-50 text-[#173e43] font-bold text-sm px-4 py-2 rounded-full shadow-sm flex items-center gap-2 transition cursor-pointer"
                    >
                        <svg className="w-4 h-4 text-[#174f55]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                        </svg>
                        <span>My Cart</span>
                        <span className="bg-[#174f55] text-white text-xs font-extrabold w-5 h-5 rounded-full flex items-center justify-center">
                            {cartCount || 0}
                        </span>
                    </button>

                    {/* User Profile / Login Button */}
                    {loggedIn ? (
                        <button
                            type="button"
                            onClick={() => nav("/profile")}
                            className="bg-[#174f55] hover:bg-[#113a3f] text-white font-bold text-sm px-5 py-2 rounded-full shadow-sm flex items-center gap-2 transition cursor-pointer uppercase tracking-wider"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                            <span>{user?.displayName?.split(" ")[0] || "PROFILE"}</span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={GoogleLogin}
                            className="bg-white border border-[#d0d5dd] hover:bg-gray-50 text-[#173e43] font-bold text-sm px-5 py-2 rounded-full shadow-sm flex items-center gap-2 transition cursor-pointer"
                        >
                            <svg className="w-4 h-4 text-[#174f55]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                            </svg>
                            <span>Login</span>
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Header;