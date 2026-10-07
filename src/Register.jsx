import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from './api';
import { AuthContext } from './AuthContext';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Attendee');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data } = await API.post('/auth/register', { name, email, password, role });
            login(data.token, data.user?.role || data.role || role);
            navigate('/');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 font-sans">
            <form onSubmit={handleRegister} className="p-8 bg-white rounded-xl shadow-md w-96 border border-gray-200">
                <h2 className="mb-6 text-2xl font-bold text-center text-gray-900">Create Account</h2>

                {error && <p className="mb-4 text-sm text-center text-red-600 bg-red-50 p-2 rounded">{error}</p>}

                <div className="mb-4">
                    <label className="block mb-1 text-sm font-medium text-gray-700">Full Name</label>
                    <input
                        type="text" required
                        className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={name} onChange={(e) => setName(e.target.value)}
                    />
                </div>

                <div className="mb-4">
                    <label className="block mb-1 text-sm font-medium text-gray-700">Email Address</label>
                    <input
                        type="email" required
                        className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={email} onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="mb-4">
                    <label className="block mb-1 text-sm font-medium text-gray-700">Password</label>
                    <input
                        type="password" required
                        className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={password} onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <div className="mb-6">
                    <label className="block mb-1 text-sm font-medium text-gray-700">Role</label>
                    <select
                        className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        value={role} onChange={(e) => setRole(e.target.value)}
                    >
                        <option value="Attendee">Attendee</option>
                        <option value="Organizer">Organizer</option>
                    </select>
                </div>

                <button
                    type="submit" disabled={loading}
                    className="w-full p-3 text-white transition bg-blue-600 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-300 shadow"
                >
                    {loading ? 'Creating account...' : 'Register'}
                </button>

                <p className="mt-4 text-sm text-center text-gray-600">
                    Already have an account?{' '}
                    <Link to="/login" className="text-blue-600 font-medium hover:underline">
                        Login here
                    </Link>
                </p>
            </form>
        </div>
    );
};

export default Register;