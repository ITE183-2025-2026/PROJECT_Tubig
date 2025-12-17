// src/api/algorithmApi.js

export async function runAlgorithm(payload) {
  const res = await fetch(
    "http://localhost/wdn-app/backend/run_algorithm.php",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // IMPORTANT for session auth
      body: JSON.stringify(payload),
    }
  );

  return await res.json();
}
