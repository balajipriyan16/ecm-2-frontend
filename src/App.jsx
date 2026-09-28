import { Routes, Route } from "react-router-dom";
import { useState } from "react";
import Header from "./components/Header";
import Body from "./components/Body";
import LoginPage from "./components/LoginPage";
import Cart from "./components/Cart";
import Profile from "./components/Profile";
import ProductDetail from "./components/ProductDetail";
import { useLocation } from "react-router-dom";

function App() {
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const loc = useLocation();

  return (
    <>
      {loc.pathname !== "/login" && (
        <Header
          cartCount={cartCount}
          setCartCount={setCartCount}
          user={user}
          setUser={setUser}
          loggedIn={loggedIn}
          setLoggedIn={setLoggedIn}
        />
      )}
      <Routes>
        <Route path="/" element={<Body cartCount={cartCount} setCartCount={setCartCount} />} />
        <Route path="/login" element={<LoginPage user={user} setUser={setUser} setLoggedIn={setLoggedIn} />} />
        <Route path="/cart" element={<Cart cartCount={cartCount} setCartCount={setCartCount} />} />
        <Route
          path="/profile"
          element={
            <Profile
              user={user}
              setUser={setUser}
              loggedIn={loggedIn}
              setLoggedIn={setLoggedIn}
              cartCount={cartCount}
              setCartCount={setCartCount}
            />
          }
        />
        <Route path="/product/:id" element={<ProductDetail setCartCount={setCartCount} />} />
      </Routes>
    </>
  );
}

export default App;