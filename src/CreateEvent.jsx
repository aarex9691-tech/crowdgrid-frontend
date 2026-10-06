import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from './api';

const CreateEvent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    location: '',
    category: 'Public',
    maxCapacity: '',
    eventType: 'Volunteer',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Send the POST request to your backend
      await API.post('/events', {
        ...formData,
        maxCapacity: Number(formData.maxCapacity) // Ensure this is a number for Mongoose
      });
      
      // Redirect back to the dashboard upon success
      navigate('/');
    } catch (error) {
      console.error('Failed to create event:', error);
      alert(error.response?.data?.message || 'Failed to create event. Ensure you are an Organizer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl p-6 mx-auto bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Create New Event</h2>
          <button 
            onClick={() => navigate('/')}
            className="text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
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

          <button 
            type="submit" 
            disabled={loading}
            className="w-full px-4 py-2 mt-4 text-white transition bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? 'Publishing...' : 'Publish Event'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;