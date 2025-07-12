document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Get form values
  const formData = {
    fullname: document.getElementById('fullname').value.trim(),
    email: document.getElementById('email').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    password: document.getElementById('password').value
  };

  // Validate all fields are filled
  if (!formData.phone) { // Phone was empty in your screenshot
    showError('Phone number is required');
    return;
  }

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await response.json();
    
    if (!response.ok) throw new Error(data.message || 'Registration failed');
    
    // Registration success
    localStorage.setItem('authToken', data.token);
    window.location.href = '/dashboard.html';
    
  } catch (error) {
    showError(error.message);
  }
});

function showError(message) {
  const errorElement = document.getElementById('errorMessage');
  errorElement.textContent = message;
  errorElement.style.display = 'block';
}
