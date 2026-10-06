import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from './api';

const EditEvent = () => {
    const { id } = useParams(); // Get the event ID from the URL
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        date: '',
        location: '',
        category: 'Public',
        maxCapacity: '',
        eventType: 'Volunteer',
    });

    // Fetch the existing event data when the component mounts
    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const { data } = await API.get(`/events/${id}`);
                // Handle different backend JSON structures
                const eventData = data.event || data.data || data;

                // Format the date string so it fits inside a <input type="datetime-local">
                const formattedDate = new Date(eventData.date).toISOString().slice(0, 16);

                setFormData({
                    title: eventData.title || '',
                    date: formattedDate,
                    location: eventData.location || '',
                    category: eventData.category || 'Public',
                    maxCapacity: eventData.maxCapacity || '',
                    eventType: eventData.eventType || 'Volunteer',
                });
            } catch (error) {
                console.error('Failed to fetch event:', error);
                alert('Could not load event details.');
                navigate('/');
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [id, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Send a PUT/PATCH request to update the event
            await API.put(`/events/${id}`, {
                ...formData,
                maxCapacity: Number(formData.maxCapacity)
            });
            navigate('/');
        } catch (error) {
            console.error('Failed to update event:', error);
            alert(error.response?.data?.message || 'Failed to update event.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this event? This cannot be undone.')) return;

        try {
            await API.delete(`/events/${id}`);
            navigate('/');
        } catch (error) {
            console.error('Failed to delete event:', error);
            alert(error.response?.data?.message || 'Failed to delete event.');
        }
    };

    if (loading) return <div className="text-center py-10 text-gray-500">Loading event data...</div>;

    return (
        <div className="min-h-screen p-8 bg-gray-50">
            <div className="max-w-2xl p-6 mx-auto bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Edit Event</h2>
                    <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-700">Cancel</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Event Title</label>
                        <input
                            type="text" name="title" required
                            className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                            value={formData.title} onChange={handleChange}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Date & Time</label>
                            <input
                                type="datetime-local" name="date" required
                                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                value={formData.date} onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Max Capacity</label>
                            <input
                                type="number" name="maxCapacity" min="1" required
                                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                value={formData.maxCapacity} onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Location</label>
                        <input
                            type="text" name="location" required
                            className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                            value={formData.location} onChange={handleChange}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Category</label>
                            <select
                                name="category"
                                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                value={formData.category} onChange={handleChange}
                            >
                                <option value="Public">Public</option>
                                <option value="Private">Private</option>
                                <option value="Corporate">Corporate</option>
                            </select>
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Event Type</label>
                            <select
                                name="eventType"
                                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                value={formData.eventType} onChange={handleChange}
                            >
                                <option value="Volunteer">Volunteer</option>
                                <option value="Social">Social</option>
                                <option value="Professional">Professional</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 mt-6 border-t">
                        <button
                            type="submit" disabled={saving}
                            className="flex-1 px-4 py-2 text-white transition bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                        >
                            {saving ? 'Saving Changes...' : 'Save Changes'}
                        </button>
                        <button
                            type="button" onClick={handleDelete}
                            className="px-4 py-2 text-red-700 transition bg-red-100 rounded-lg hover:bg-red-200"
                        >
                            Delete Event
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditEvent;