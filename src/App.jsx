import { Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import CreateEvent from './CreateEvent';
import EditEvent from './EditEvent';
import ProtectedRoute from './ProtectedRoute';
import Login from './Login';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Routes for EVERY logged-in user (Attendees and Organizers) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Dashboard />} />
      </Route>

      {/* Routes STRICTLY for Organizers */}
      <Route element={<ProtectedRoute allowedRoles={['Organizer']} />}>
        <Route path="/create-event" element={<CreateEvent />} />
        <Route path="/edit-event/:id" element={<EditEvent />} />
      </Route>
    </Routes>
  );
}

export default App;