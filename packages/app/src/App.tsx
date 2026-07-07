import { Routes, Route } from 'react-router-dom';
import { Menu } from './pages/Menu';
import { Game } from './pages/Game';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Menu />} />
      <Route path="/game" element={<Game />} />
    </Routes>
  );
}
