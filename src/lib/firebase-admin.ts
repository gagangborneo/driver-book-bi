// Firebase Admin SDK for server-side push notifications
import admin from "firebase-admin";

// Initialize Firebase Admin (singleton)
function getFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  // Use service account credentials from environment variable
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccount) {
    try {
      const parsed = JSON.parse(serviceAccount);
      return admin.initializeApp({
        credential: admin.credential.cert(parsed),
      });
    } catch (error) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", error);
    }
  }

  // Fallback: initialize with project ID only (for development)
  return admin.initializeApp({
    projectId: "driver-bi",
  });
}

const adminApp = getFirebaseAdmin();

export { adminApp };
export default admin;
