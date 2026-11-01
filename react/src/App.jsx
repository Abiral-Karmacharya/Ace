import { BrowserRouter, Routes, Route, NavLink, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AddProject from "./pages/AddProject";
import ProjectDetail from "./pages/ProjectDetail";
import Gallery from "./pages/Gallery";
import Archive from "./pages/Archive";
import ArchivedProjectDetail from "./pages/ArchiveDetail";

function App() {
  return (
    <BrowserRouter>
      <header className="workspace-nav">
        <Link to="/" className="brand"><span className="brand-mark">a<span>↗</span></span><span>ace<span className="brand-caption">PROJECT WORKSPACE</span></span></Link>
        <nav aria-label="Main navigation">
          <NavLink to="/" end>Overview</NavLink>
          <NavLink to="/gallery">Gallery</NavLink>
          <NavLink to="/archive">Archive</NavLink>
        </nav>
        <Link to="/projects/new" className="nav-create">+ <span>Register project</span></Link>
      </header>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects/new" element={<AddProject />} />
        <Route path="/projects/:projectId" element={<ProjectDetail />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/archive" element={<Archive />} />
        <Route
          path="/archives/:projectId"
          element={<ArchivedProjectDetail />}
        ></Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
