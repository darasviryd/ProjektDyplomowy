const API = "http://172.20.10.13:3000/sync";

export async function syncData(localData) {
  const response = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(localData)
  });
  return await response.json();
}