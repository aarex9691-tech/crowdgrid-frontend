import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from './api';
import { useContext } from 'react';
import { AuthContext } from './AuthContext';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, []);

const fetchEvents = async () => {
    try {
      const { data } = await API.get('/events');
      
      // Dynamically extract the array based on common backend response structures
      if (Array.isArray(data)) {
        setEvents(data); // Matches: [...]
      } else if (data.events && Array.isArray(data.events)) {
        setEvents(data.events); // Matches: { events: [...] }
      } else if (data.data && Array.isArray(data.data)) {
        setEvents(data.data); // Matches: { data: [...] }
      } else {
        console.error('Unrecognized data format from backend:', data);
        setEvents([]); // Fallback to empty array to prevent map() crashes
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setEvents([]); 
    } finally {
      setLoading(false);
    }
  };

 const handleLogout = () => {
  logout();
  navigate('/login');
};

{user?.role === 'Organizer' && (
  <button onClick={() => navigate('/create-event')} className="...">
    + Create Event
  </button>
)}
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="flex justify-between items-center mb-8 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">CrowdGrid Dashboard</h1>
          <p className="text-gray-500 text-sm">Manage and explore active events</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/create-event')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + Create Event
          </button>
          <button 
            onClick={handleLogout}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
          >
            Logout
          </button>
        </div>
      </header>

      {loading ? (
        <div className="text-center py-10 text-gray-600">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-10 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300 p-8">
          No events found. Click "+ Create Event" to add your first one!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div 
              key={event._id} 
              className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                  {event.eventType || event.category || 'Event'}
                </span>
                <span className="text-xs text-gray-400">
                  Cap: {event.maxCapacity}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
              <p className="text-gray-600 text-sm mb-4">📍 {event.location}</p>
              <div className="flex justify-between items-center text-xs text-gray-500 border-t pt-3">
                <span>📅 {new Date(event.date).toLocaleDateString()}</span>
                <button 
                  onClick={() => navigate(`/edit-event/${event._id}`)}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Edit Event →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;