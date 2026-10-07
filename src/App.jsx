import { Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import CreateEvent from './CreateEvent';
import EditEvent from './EditEvent';
import ProtectedRoute from './ProtectedRoute';
import Login from './Login';
import Register from './Register';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} /> {/* <-- New Route */}

      {/* Routes for EVERY logged-in user */}
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