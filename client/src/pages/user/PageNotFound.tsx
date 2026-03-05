import { Link } from "react-router-dom";
function PageNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-7xl md:text-8xl font-extrabold text-red-600">
          404
        </h1>

        <h2 className="mt-4 text-2xl md:text-3xl font-semibold">
          Oops! Page Not Found
        </h2>

        <p className="mt-3 text-gray-500 max-w-md mx-auto">
          The page you are looking for might have been removed or does not
          exist.
        </p>

        <Link
          to="/dashboard"
          className="inline-block mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-lg font-medium transition"
        >
          ⬅ Back to Home
        </Link>
      </div>
    </div>
  );
}

export default PageNotFound;
