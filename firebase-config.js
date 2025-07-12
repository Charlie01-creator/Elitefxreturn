// Your complete Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBlAtG3aDSqN7ILX-HtoMZopsPT4LS", // From your screenshot
  authDomain: "elitefxreturn.firebaseapp.com", // Auto-generated
  projectId: "elitefxreturn", // From your screenshot
  storageBucket: "elitefxreturn.appspot.com", // Auto-generated
  messagingSenderId: "333913364691", // From your screenshot
  appId: "1:333913364691:web:abc123def456" // Get from your web app
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Export auth and db for use in other files
const auth = firebase.auth();
const db = firebase.firestore();

export { auth, db };
