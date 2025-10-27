// src/api/upload.js
import axios from "axios";
import dotenv from "dotenv";
import FormData from "form-data";
import fs from "fs";
import { LEONARDO } from "../config/leonardo.js";
dotenv.config();

const API_KEY = process.env.LEONARDO_API_KEY;
const HEADERS = {
  accept: "application/json",
  "content-type": "application/json",
  authorization: `Bearer ${API_KEY}`,
};

// =======================
// Upload Helper
// =======================
export async function uploadImage(localPath) {
  const ext = localPath.split(".").pop();
  const presign = await axios.post(
    `${LEONARDO.API_URL}/init-image`,
    { extension: ext },
    { headers: HEADERS }
  );

  const { id, url, fields } = presign.data.uploadInitImage;
  const form = new FormData();
  const parsedFields = JSON.parse(fields);
  for (const [k, v] of Object.entries(parsedFields)) form.append(k, v);
  form.append("file", fs.createReadStream(localPath));

  await axios.post(url, form, { headers: form.getHeaders() });
  console.log(`✅ Uploaded ${localPath} → ${id}`);
  await new Promise((r) => setTimeout(r, 3000));
  return id;
}