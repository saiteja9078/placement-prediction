import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Register from './pages/Register';
import Aptitude from './pages/Aptitude';
import Coding from './pages/Coding';
import Communication from './pages/Communication';
import Result from './pages/Result';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/aptitude/:studentId" element={<Aptitude />} />
        <Route path="/coding/:studentId" element={<Coding />} />
        <Route path="/communication/:studentId" element={<Communication />} />
        <Route path="/result/:studentId" element={<Result />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
