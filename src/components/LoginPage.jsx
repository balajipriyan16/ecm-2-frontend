import { useState } from "react";
import {
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth, googleAuth, API_BASE_URL } from "../config";
import axios from "axios";

function LoginPage({ setUser, setLoggedIn }) {
    const nav = useNavigate();

    const [mode, setMode] = useState("signin");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    async function registerUserInMongo(name, email) {
        await axios.post(`${API_BASE_URL}/register`, {
            name: name,
            email: email,
        });
    }

    async function handleGoogleLogin() {
        setSuccessMsg("");
        try {
            setLoading(true);
            const result = await signInWithPopup(auth, googleAuth);

            await registerUserInMongo(
                result.user.displayName,
                result.user.email
            );

            setLoading(false);
            setUser(result.user);
            setLoggedIn(true);

            nav("/");
        } catch (error) {
            setLoading(false);
            alert(error.message);
        }
    }

    async function handleSubmit() {
        setSuccessMsg("");
        try {
            if (mode === "signin") {
                setLoading(true);
                const result = await signInWithEmailAndPassword(auth, email, password);
                setLoading(false);

                setUser(result.user);
                setLoggedIn(true);

                nav("/");
            } else {
                if (password !== confirmPassword) {
                    alert("Passwords do not match");
                    return;
                }

                setLoading(true);

                const result = await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

                await updateProfile(result.user, {
                    displayName: fullName,
                });

                await registerUserInMongo(fullName, email);

                setLoading(false);
                setSuccessMsg("user created..");

                setUser(result.user);
                setLoggedIn(true);

                setTimeout(() => {
                    nav("/");
                }, 1500);
            }
        } catch (error) {
            setLoading(false);
            alert(error.message);
        }
    }

    return (
        <div className="min-h-screen bg-[#41423d] flex items-center justify-center p-2">
            <div className="w-full max-w-[448px] bg-white rounded-[24px] overflow-hidden shadow-xl">
                <div className="relative bg-[#174f55] text-white text-center px-6 py-6">
                    <button
                        type="button"
                        onClick={() => nav("/")}
                        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-3xl font-light hover:bg-white/20 transition"
                    >
                        ×
                    </button>

                    <h1 className="text-[26px] font-bold leading-tight">
                        {mode === "signin" ? "Welcome Back" : "Create Account"}
                    </h1>

                    <p className="text-[13px] mt-1">
                        {mode === "signin"
                            ? "Sign in to access your MyKart account"
                            : "Sign up to create your MyKart account"}
                    </p>
                </div>

                <div className="px-6 pt-6 pb-6">
                    <div className="bg-[#f1f1f3] rounded-xl p-1 flex mb-6">
                        <button
                            type="button"
                            onClick={() => {
                                setMode("signin");
                                setSuccessMsg("");
                            }}
                            className={`w-1/2 py-2 rounded-lg font-medium transition ${mode === "signin"
                                    ? "bg-white text-[#174f55] shadow-sm"
                                    : "text-[#667085]"
                                }`}
                        >
                            Sign In
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setMode("signup");
                                setSuccessMsg("");
                            }}
                            className={`w-1/2 py-2 rounded-lg font-medium transition ${mode === "signup"
                                    ? "bg-white text-[#174f55] shadow-sm"
                                    : "text-[#667085]"
                                }`}
                        >
                            Sign Up
                        </button>
                    </div>

                    {successMsg && (
                        <div className="bg-emerald-100 border border-emerald-400 text-emerald-800 px-4 py-3 rounded-xl mb-4 text-sm font-semibold flex items-center justify-center gap-2 shadow-sm">
                            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                            <span>{successMsg}</span>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full h-[50px] border border-[#d0d5dd] rounded-xl flex items-center justify-center gap-3 font-semibold text-[#344054] hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 01-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.38z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 22c2.7 0 4.97-.9 6.63-2.39l-3.24-2.51c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.6A10 10 0 0012 22z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M6.39 13.93A6.02 6.02 0 016.08 12c0-.67.11-1.32.31-1.93v-2.6H3.04A10 10 0 002 12c0 1.61.39 3.14 1.04 4.53l3.35-2.6z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.94c1.47 0 2.79.51 3.83 1.5l2.87-2.87C16.96 2.95 14.7 2 12 2a10 10 0 00-8.96 5.47l3.35 2.6C7.18 7.7 9.39 5.94 12 5.94z"
                            />
                        </svg>

                        Continue with Google
                    </button>

                    <div className="flex items-center gap-3 my-4">
                        <div className="h-px bg-[#e4e7ec] flex-1" />
                        <span className="text-xs text-[#98a2b3]">OR</span>
                        <div className="h-px bg-[#e4e7ec] flex-1" />
                    </div>

                    {mode === "signup" && (
                        <div className="mb-4">
                            <label className="block text-[12px] font-semibold text-[#667085] mb-1">
                                FULL NAME
                            </label>

                            <div className="h-[46px] border border-[#dfe3e8] bg-[#fafbfc] rounded-xl flex items-center px-3 gap-3 focus-within:border-[#174f55]">
                                <input
                                    type="text"
                                    placeholder="Enter your name"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full bg-transparent outline-none text-sm text-[#344054] placeholder:text-[#98a2b3]"
                                />
                            </div>
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="block text-[12px] font-semibold text-[#667085] mb-1">
                            EMAIL ADDRESS
                        </label>

                        <div className="h-[46px] border border-[#dfe3e8] bg-[#fafbfc] rounded-xl flex items-center px-3 gap-3 focus-within:border-[#174f55]">
                            <input
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-transparent outline-none text-sm text-[#344054] placeholder:text-[#98a2b3]"
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-[12px] font-semibold text-[#667085] mb-1">
                            PASSWORD
                        </label>

                        <div className="h-[46px] border border-[#dfe3e8] bg-[#fafbfc] rounded-xl flex items-center px-3 gap-3 focus-within:border-[#174f55]">
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-transparent outline-none text-sm text-[#344054] placeholder:text-[#98a2b3]"
                            />
                        </div>
                    </div>

                    {mode === "signup" && (
                        <div className="mb-4">
                            <label className="block text-[12px] font-semibold text-[#667085] mb-1">
                                CONFIRM PASSWORD
                            </label>

                            <div className="h-[46px] border border-[#dfe3e8] bg-[#fafbfc] rounded-xl flex items-center px-3 gap-3 focus-within:border-[#174f55]">
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-transparent outline-none text-sm text-[#344054] placeholder:text-[#98a2b3]"
                                />
                            </div>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full h-[48px] mt-1 rounded-xl bg-[#174f55] hover:bg-[#123f44] text-white font-bold flex items-center justify-center gap-3 shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <svg
                                    className="animate-spin h-5 w-5 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                                <span>{mode === "signin" ? "Signing In..." : "Creating Account..."}</span>
                            </>
                        ) : (
                            <>
                                {mode === "signin" ? "Sign In" : "Create Account"}

                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                                    />
                                </svg>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;