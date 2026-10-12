import { Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import Home from './Home';
import Settings from './Settings';
import Notes from './Notes';
import Search from './Search';
import PrivateNotes from './PrivateNotes';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/search" element={<Search />} />
        <Route path="/private" element={<PrivateNotes />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
