import { Routes, Route } from 'react-router-dom';
import { Menu } from './pages/Menu';
import { Game } from './pages/Game';
import { ControllerSettings } from './pages/ControllerSettings';
import { MobileJoystick } from './pages/MobileJoystick';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Menu />} />
      <Route path="/game" element={<Game />} />
      <Route path="/controller-settings" element={<ControllerSettings />} />
      <Route path="/controller" element={<MobileJoystick />} />
    </Routes>
  );
}
