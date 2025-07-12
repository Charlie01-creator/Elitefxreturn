// Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Registration Logic
if (document.getElementById('registerForm')) {
    document.getElementById('registerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validate passwords match
        if (password !== confirmPassword) {
            showError("Passwords don't match");
            return;
        }
        
        // Create user with email/password
        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // User created successfully
                const user = userCredential.user;
                
                // Update user profile with name
                return user.updateProfile({
                    displayName: fullName
                }).then(() => {
                    // Save additional data to Firestore (optional)
                    return firebase.firestore().collection('users').doc(user.uid).set({
                        fullName: fullName,
                        email: email,
                        phone: phone,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                });
            })
            .then(() => {
                // Registration complete
                showSuccess("Registration successful! Redirecting...");
                setTimeout(() => {
                    window.location.href = "dashboard.html";
                }, 2000);
            })
            .catch((error) => {
                showError(error.message);
            });
    });
}

// Login Logic
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Login successful
                window.location.href = "dashboard.html";
            })
            .catch((error) => {
                showError(error.message);
            });
    });
}

// Helper functions
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.classList.remove('d-none');
}

function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    successDiv.textContent = message;
    successDiv.classList.remove('d-none');
}

// Check auth state (for protected pages)
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is logged in
        console.log("User logged in:", user.email);
    } else {
        // User is logged out
        console.log("User logged out");
    }
});
