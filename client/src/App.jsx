import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import CreateRoom from './pages/CreateRoom.jsx';
import JoinRoom from './pages/JoinRoom.jsx';
import ModeratorView from './pages/ModeratorView.jsx';
import PlayerView from './pages/PlayerView.jsx';

export default function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateRoom />} />
        <Route path="/join" element={<JoinRoom />} />
        <Route path="/moderator/:roomCode" element={<ModeratorView />} />
        <Route path="/play/:roomCode" element={<PlayerView />} />
      </Routes>
    </div>
  );
}
