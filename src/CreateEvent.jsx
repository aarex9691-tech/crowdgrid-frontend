import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from './api';

const CreateEvent = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    date: '',
    location: '',
    category: 'Public', // Default to your new strict tabs
    maxCapacity: '',
    eventType: 'Volunteer',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      // Send a POST request to create a new event
      await API.post('/events', {
        ...formData,
        maxCapacity: Number(formData.maxCapacity)
      });

      // Redirect back to the dashboard on success
      navigate('/');
    } catch (err) {
      console.error('Failed to create event:', err);
      setError(err.response?.data?.message || 'Failed to create event. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50 font-sans">
      <div className="max-w-2xl p-8 mx-auto bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create New Event</h2>
            <p className="text-gray-500 text-sm mt-1">Publish a new activity to the CrowdGrid dashboard.</p>
          </div>
          <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-800 font-medium transition-colors">
            Cancel
          </button>
        </div>

        {error && <div className="mb-6 p-3 bg-red-50 text-red-700 border border-red-200 rounded text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-1.5 text-sm font-bold text-gray-700">Event Title</label>
            <input
              type="text" name="title" required placeholder="e.g., Annual Tech Conference"
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={formData.title} onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block mb-1.5 text-sm font-bold text-gray-700">Date & Time</label>
              <input
                type="datetime-local" name="date" required
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={formData.date} onChange={handleChange}
              />
            </div>
            <div>
              <label className="block mb-1.5 text-sm font-bold text-gray-700">Max Capacity</label>
              <input
                type="number" name="maxCapacity" min="1" required placeholder="e.g., 100"
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={formData.maxCapacity} onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block mb-1.5 text-sm font-bold text-gray-700">Location</label>
            <input
              type="text" name="location" required placeholder="e.g., Main Auditorium"
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={formData.location} onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block mb-1.5 text-sm font-bold text-gray-700">Category</label>
              <select
                name="category"
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                value={formData.category} onChange={handleChange}
              >
                <option value="Public">Public</option>
                <option value="Pilgrim">Pilgrim</option>
                <option value="Corporate">Corporate</option>
              </select>
            </div>
            <div>
              <label className="block mb-1.5 text-sm font-bold text-gray-700">Event Type</label>
              <select
                name="eventType"
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                value={formData.eventType} onChange={handleChange}
              >
                <option value="Volunteer">Volunteer</option>
                <option value="Social">Social</option>
                <option value="Professional">Professional</option>
              </select>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-gray-100">
            <button
              type="submit" disabled={saving}
              className="w-full px-4 py-3 text-white font-bold transition bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 disabled:bg-blue-300"
            >
              {saving ? 'Publishing Event...' : 'Publish Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;