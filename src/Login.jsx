import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from './api';
import { AuthContext } from './AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 font-sans">
      <form onSubmit={handleLogin} className="p-8 bg-white rounded-xl shadow-md w-96 border border-gray-200">
        <h2 className="mb-6 text-2xl font-bold text-center text-gray-900">CrowdGrid Login</h2>

        {error && <p className="mb-4 text-sm text-center text-red-600 bg-red-50 p-2 rounded">{error}</p>}

        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-6">
          <label className="block mb-1 text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="w-full p-3 text-white transition bg-blue-600 rounded-lg font-semibold hover:bg-blue-700 shadow mb-4">
          Sign In
        </button>

        <p className="text-sm text-center text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 font-medium hover:underline">
            Register here
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Login;