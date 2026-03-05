To do
1) use cookies
2)add interceptor
3) authentication set for report
4) error message showin toaster
5) better design
6)issue. login with user. login wtih admin. it create problem



1) npm install
2) npm run seed:admin


🔹 Frontend Axios
axios.post("http://localhost:5000/login", data, {
  withCredentials: true
});

Without withCredentials: true, cookies will NOT be saved.

✅ Step 4: Access Cookie in Protected Route
const token = req.cookies.accessToken;
🚀 Production Version (Recommended)
res.cookie("accessToken", accessToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 24 * 60 * 60 * 1000,
});