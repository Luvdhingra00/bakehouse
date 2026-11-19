"use client";

import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <CartProvider>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: { borderRadius: "999px", background: "#4a2f20", color: "#fffdf9", fontSize: "14px" },
            success: { iconTheme: { primary: "#f08fa5", secondary: "#fffdf9" } },
          }}
        />
      </CartProvider>
    </AuthProvider>
  );
}
