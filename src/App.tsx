import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider } from './state/store';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Venues from './pages/Venues';
import VenueDetail from './pages/VenueDetail';
import Menus from './pages/Menus';
import Calculator from './pages/Calculator';
import CalendarPage from './pages/CalendarPage';
import Planner from './pages/Planner';
import Quote from './pages/Quote';
import About from './pages/About';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/venues" element={<Venues />} />
            <Route path="/venues/:id" element={<VenueDetail />} />
            <Route path="/menus" element={<Menus />} />
            <Route path="/calculator" element={<Calculator />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/planner" element={<Planner />} />
            <Route path="/quote" element={<Quote />} />
            <Route path="/about" element={<About />} />
            <Route path="/dashboard/*" element={<Dashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </HashRouter>
    </StoreProvider>
  );
}
