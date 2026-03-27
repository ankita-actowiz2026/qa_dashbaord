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
        gutter={12}
        containerStyle={{ top: 16, right: 16 }}
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: "12px",
            padding: "14px 24px",
            fontSize: "14px",
            fontWeight: 600,
            maxWidth: "380px",
            backdropFilter: "blur(10px)",
            border: "1px solid",
          },
          success: {
            style: {
              background: "linear-gradient(135deg, #ecfdf5, #d1fae5)",
              border: "1px solid #a7f3d0",
              color: "#065f46",
              boxShadow: "0 6px 24px rgba(16, 185, 129, 0.1)",
            },
          },
          error: {
            style: {
              background: "linear-gradient(135deg, #fef2f2, #fee2e2)",
              border: "1px solid #fca5a5",
              color: "#991b1b",
              boxShadow: "0 6px 24px rgba(239, 68, 68, 0.1)",
            },
            iconTheme: { primary: "#ef4444", secondary: "#fef2f2" },
          },
          loading: {
            style: {
              background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
              border: "1px solid #93c5fd",
              color: "#1e40af",
              boxShadow: "0 6px 24px rgba(59, 130, 246, 0.1)",
            },
            iconTheme: { primary: "#3b82f6", secondary: "#eff6ff" },
          },
        }}
      />
    </>
  );
}

export default App;
