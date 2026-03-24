export default function PageNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="text-center">
        {/* 404 Text */}
        <h1 className="text-9xl font-extrabold text-gray-800">404</h1>

        {/* Message */}
        <p className="mt-4 text-xl text-gray-600">Oops! Page not found.</p>

        <p className="mt-2 text-gray-500">
          The page you are looking for doesn't exist or has been moved.
        </p>

        {/* Button */}
        <button
          onClick={() => (window.location.href = "/")}
          className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition duration-300"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
}
