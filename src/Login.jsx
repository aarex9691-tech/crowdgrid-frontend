import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from './api';
import { AuthContext } from './AuthContext';

const Login = () => {
  // 1. Declare the state variables for your inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // 2. Name this exactly what your form's onSubmit expects
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    try {
      // 3. Send the email and password directly to the backend
      const { data } = await API.post('/auth/login', { email, password });

      // Call the context login function
      login(data.token, data.user?.role || data.role);

      // Redirect to dashboard
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleLogin} className="p-8 bg-white rounded-lg shadow-md w-96">
        <h2 className="mb-6 text-2xl font-bold text-center">CrowdGrid Login</h2>

        {/* Optional: Show error message to user if login fails */}
        {error && <p className="mb-4 text-sm text-center text-red-600">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 mb-4 border rounded focus:ring-blue-500 focus:border-blue-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 mb-6 border rounded focus:ring-blue-500 focus:border-blue-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="w-full p-2 text-white transition bg-blue-600 rounded hover:bg-blue-700">
          Sign In
        </button>
      </form>
    </div>
  );
};

export default Login;