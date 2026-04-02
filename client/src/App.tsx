import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes/AppRoutes";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8} // 🔽 reduced spacing between toasts
        containerStyle={{ top: 12, right: 12 }}
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: "10px",
            padding: "8px 12px", // 🔽 reduced height
            fontSize: "13px", // 🔽 slightly smaller
            fontWeight: 400, // 🔽 more professional than 600
            maxWidth: "340px",
            backdropFilter: "blur(8px)",
            border: "1px solid",
            boxShadow: "0 4px 16px rgba(0,0,0,0.06)", // 🔽 softer shadow
          },

          success: {
            style: {
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              color: "#065f46",
            },
            iconTheme: { primary: "#10b981", secondary: "#ecfdf5" },
          },

          error: {
            style: {
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
            },
            iconTheme: { primary: "#ef4444", secondary: "#fef2f2" },
          },

          loading: {
            style: {
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              color: "#1e40af",
            },
            iconTheme: { primary: "#3b82f6", secondary: "#eff6ff" },
          },
        }}
      />
    </>
  );
}

export default App;
