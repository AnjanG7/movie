const BASE_URL = "https://movie-finance.onrender.com/api/auth";

export async function fetchUsersApi() {
  const res = await fetch(`${BASE_URL}/allUsers`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function deleteUserApi(userId: string) {
  const res = await fetch(`${BASE_URL}/delete/${userId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete user");
}

export async function createUserApi(payload: {
  name: string;
  email: string;
  password: string;
  role: string;
}) {
  const res = await fetch(`${BASE_URL}/add-user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create user");

  return data;
}
