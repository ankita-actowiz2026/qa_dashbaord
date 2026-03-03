export const getAuthData = () => {
  const data = localStorage.getItem("user_data");

  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

export const isAuthenticated = () => {
  const auth = getAuthData();
  return !!auth?.accessToken;
};