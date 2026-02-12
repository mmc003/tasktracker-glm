import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { Tasks } from './pages/Tasks';
import { Calendar } from './pages/Calendar';
import './App.css';

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/calendar" element={<Calendar />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
