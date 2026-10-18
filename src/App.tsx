import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
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

function AnimatedRoutes() {
  const loc = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }); }, [loc.pathname]);
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={loc.pathname}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <Routes location={loc}>
          <Route path="/" element={<Home />} />
          <Route path="/venues" element={<Venues />} />
          <Route path="/venues/:id" element={<VenueDetail />} />
          <Route path="/menus" element={<Menus />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/about" element={<About />} />
          <Route path="/dashboard/*" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Navbar />
        <main>
          <AnimatedRoutes />
        </main>
        <Footer />
      </HashRouter>
    </StoreProvider>
  );
}
