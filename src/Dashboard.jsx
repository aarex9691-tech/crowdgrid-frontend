import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import API from './api';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Default strictly to 'Public' instead of 'All'
  const [activeTab, setActiveTab] = useState('Public');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data } = await API.get('/events');
        // Handle varying backend response formats
        if (Array.isArray(data)) setEvents(data);
        else if (data.events && Array.isArray(data.events)) setEvents(data.events);
        else if (data.data && Array.isArray(data.data)) setEvents(data.data);
        else setEvents([]);
      } catch (err) {
        console.error('Failed to fetch events:', err);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // FIXED LOGOUT FUNCTION
  const handleLogout = () => {
    if (logout) logout(); // Calls the Context logout function
    navigate('/login');
  };

  // Filter events strictly based on the 3 categories
  const filteredEvents = events.filter(
    (event) => event.category === activeTab || event.eventType === activeTab
  );

  const handleRSVP = async (eventId) => {
    try {
      await API.post(`/events/${eventId}/rsvp`);
      alert('Successfully registered/RSVP\'d for this event!');
    } catch (err) {
      console.error('RSVP failed:', err);
      alert(err.response?.data?.message || 'Failed to RSVP for event.');
    }
  };

  return (
    <div className="flex min-h-screen font-sans bg-gray-50">

      {/* 1. SIDEBAR NAVIGATION */}
      <aside className="flex flex-col w-64 bg-white border-r border-gray-200">
        <div className="flex items-center justify-center h-16 border-b border-gray-200">
          <h1 className="text-2xl font-black tracking-tight text-blue-700">CrowdGrid</h1>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            <li>
              <button className="flex items-center w-full p-3 font-semibold text-blue-800 rounded-lg bg-blue-50">
                📊 Event Dashboard
              </button>
            </li>
          </ul>
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="mb-4 text-sm text-center text-gray-600">
            Logged in as <br />
            <span className="inline-block px-2 py-1 mt-1 font-bold text-gray-900 bg-gray-200 rounded">
              {user?.role || 'Attendee'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-sm font-bold text-red-600 transition bg-white border border-red-200 rounded-lg shadow-sm hover:bg-red-50 hover:border-red-300"
          >
            Log Out
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 p-8 overflow-y-auto">

        {/* Header & Action Button */}
        <header className="flex flex-col justify-between gap-4 mb-8 md:flex-row md:items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Explore Events</h2>
            <p className="mt-1 text-gray-500">Browse and manage activities across different sectors.</p>
          </div>

          {user?.role === 'Organizer' && (
            <button
              onClick={() => navigate('/create-event')}
              className="flex items-center gap-2 px-5 py-2.5 font-medium text-white transition bg-blue-600 rounded-lg shadow hover:bg-blue-700"
            >
              <span className="text-xl leading-none">+</span> Create Event
            </button>
          )}
        </header>

        {/* 3. STRICT TABS */}
        <div className="flex mb-8 space-x-8 border-b border-gray-200">
          {['Public', 'Pilgrim', 'Corporate'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-bold transition-all border-b-2 ${activeTab === tab
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {tab} Events
            </button>
          ))}
        </div>

        {/* 4. EVENT GRID */}
        {loading ? (
          <div className="flex items-center justify-center font-medium text-gray-400 py-20">
            <svg className="w-6 h-6 mr-3 text-blue-600 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading events data...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-16 font-medium text-center text-gray-500 bg-white border-2 border-gray-200 border-dashed rounded-2xl">
            No active events found for the <span className="text-gray-800">{activeTab}</span> category.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredEvents.map(event => (
              <div key={event._id} className="flex flex-col overflow-hidden transition-all duration-200 bg-white border border-gray-200 shadow-sm rounded-xl hover:shadow-lg group">

                <div className="flex-1 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <span className="px-3 py-1 text-xs font-bold text-blue-800 bg-blue-100 rounded-full">
                      {event.category || event.eventType}
                    </span>
                    <span className="px-2 py-1 text-xs font-bold text-gray-500 bg-gray-100 rounded-md">
                      Cap: {event.maxCapacity}
                    </span>
                  </div>

                  <h3 className="mb-2 text-lg font-bold leading-tight text-gray-900 transition-colors group-hover:text-blue-700">
                    {event.title}
                  </h3>

                  <p className="flex items-center mb-2 text-sm font-medium text-gray-600">
                    <span className="mr-2">📍</span> {event.location}
                  </p>
                  <p className="flex items-center text-sm text-gray-500">
                    <span className="mr-2">📅</span>
                    {new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    <span className="mx-1">•</span>
                    {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {/* Attendee RSVP Action Button */}
                {user?.role !== 'Organizer' && (
                  <div className="p-2 border-t border-gray-100 bg-gray-50">
                    <button
                      onClick={() => handleRSVP(event._id)}
                      className="flex items-center justify-center w-full gap-1 py-2.5 text-sm font-bold text-emerald-700 transition-colors bg-emerald-50 hover:bg-emerald-100 rounded-lg"
                    >
                      ✓ RSVP Now
                    </button>
                  </div>
                )}

                {/* Organizer Controls */}
                {user?.role === 'Organizer' && (
                  <div className="p-1 border-t border-gray-100 bg-gray-50">
                    <button
                      onClick={() => navigate(`/edit-event/${event._id}`)}
                      className="flex items-center justify-center w-full gap-1 py-2.5 text-sm font-bold text-blue-600 transition-colors rounded-lg hover:text-blue-800 hover:bg-blue-100"
                    >
                      Edit Details <span>&rarr;</span>
                    </button>
                  </div>
                )}

              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;