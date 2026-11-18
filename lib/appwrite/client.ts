"use client";

import { Client, Account, Databases, OAuthProvider } from "appwrite";

const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";

export const appwriteClient = new Client();

if (APPWRITE_PROJECT_ID) {
  appwriteClient.setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID);
}

export const appwriteAccount = new Account(appwriteClient);
export const appwriteDatabases = new Databases(appwriteClient);

export function isAppwriteConfigured(): boolean {
  return Boolean(APPWRITE_PROJECT_ID && APPWRITE_PROJECT_ID.trim().length > 0);
}

export { OAuthProvider };
