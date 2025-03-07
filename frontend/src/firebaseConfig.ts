import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyC_05U7cqseg7i_pvYnCqAuNuuCK6SBBnE",
  authDomain: "temptrack-2965f.firebaseapp.com",
  projectId: "temptrack-2965f",
  storageBucket: "temptrack-2965f.firebasestorage.app",
  messagingSenderId: "622154464663",
  appId: "1:622154464663:web:9e772635def8bab491d8d2",
  measurementId: "G-01CB17QZHF"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, analytics };
