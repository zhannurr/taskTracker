import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAQQPCUePhBLb7tXx4jRgMBN-NNsU8xqwM",
  authDomain: "myapp-49dc6.firebaseapp.com",
  projectId: "myapp-49dc6",
  storageBucket: "myapp-49dc6.firebasestorage.app",
  messagingSenderId: "735227758568",
  appId: "1:735227758568:web:df48f54888e9647c22465d",
  measurementId: "G-E9BPE98170"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
export default app;