    import { BrowserRouter, Routes, Route } from 'react-router-dom';

    import Home from './pages/Home.jsx';
    import AdminLogin from './pages/admin/AdminLogin.jsx';
    import ProtectedAdminRoute from './pages/admin/ProtectedAdminRoute.jsx';
    import AdminDashboard from './pages/admin/AdminDashboard.jsx';
    import AdminProjects from './pages/admin/AdminProjects.jsx';
    import AdminCategories from './pages/admin/AdminCategories.jsx';
    import AdminInquiries from './pages/admin/AdminInquiries.jsx';
    import AdminTechnologies from './pages/admin/AdminTechnologies.jsx';
    
    

    function ProjectDetails() {
    return (
        <div>
        Project Details
        </div>
    );
    }

    function App() {
    return (
        <BrowserRouter>
        <Routes>
            {/* Public website */}
            <Route
            path="/"
            element={<Home />}
            />

            {/* Public project details */}
            <Route
            path="/projects/:slug"
            element={<ProjectDetails />}
            />

            {/* Admin login */}
            <Route
            path="/admin/login"
            element={<AdminLogin />}
            />

            {/* Protected admin */}
            <Route element={<ProtectedAdminRoute />}>
            <Route
                path="/admin"
                element={<AdminDashboard />}
                />

                <Route
                path="/admin/projects"
                element={<AdminProjects />}
                />
                <Route
                path="/admin/categories"
                element={<AdminCategories />}
                />
                <Route
                path="/admin/inquiries"
                element={<AdminInquiries />}
                />
                <Route
                path="/admin/technologies"
                element={<AdminTechnologies />}
                />
            </Route>
        </Routes>
        </BrowserRouter>
    );
    }

    export default App;