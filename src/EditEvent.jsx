import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from './api';

function EditEvent() {
    const { id } = useParams(); // Grabs the /:id from the URL
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ title: '', category: '', description: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    // Fetch the existing event data when the page loads
    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const response = await api.get(`/event/${id}`);
                setFormData({
                    title: response.data.title,
                    category: response.data.category,
                    description: response.data.description
                });
                setLoading(false);
            } catch (err) {
                setError('Failed to load event data. It may have been deleted.');
                setLoading(false);
            }
        };
        fetchEvent();
    }, [id]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Send a PUT request to update the data
            await api.put(`/event/${id}`, formData);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update event.');
        }
    };

    if (loading) return <div className="text-center mt-20 text-gray-500 italic">Loading event data...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md border border-gray-200">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Edit Event</h2>

                {error && <p className="text-red-500 mb-4 p-3 bg-red-100 rounded">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">Event Title</label>
                        <input
                            type="text" name="title" value={formData.title} onChange={handleChange} required
                            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">Category</label>
                        <input
                            type="text" name="category" value={formData.category} onChange={handleChange} required
                            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">Description</label>
                        <textarea
                            name="description" value={formData.description} onChange={handleChange} required rows="5"
                            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        ></textarea>
                    </div>

                    <div className="flex justify-end gap-4 mt-8">
                        <button type="button" onClick={() => navigate('/dashboard')} className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 font-semibold">
                            Cancel
                        </button>
                        <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditEvent;