import { api } from "@/services/api";

export async function getRoot() {
  const res = await api.get("/");
  return res.data;
}
