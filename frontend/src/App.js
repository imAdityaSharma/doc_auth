import React, { } from 'react';
import './styles/App.css';
  
import {BrowserRouter, Routes, Route, Link} from 'react-router-dom';
  
import Home from "./components/Home";
import LoginForm from './components/LoginForm'
import RegistrationForm from './components/Registration/RegistrationForm'
import PatientDashboard from './components/patientfrontend/patientDashboard'
import DocDashboard from './components/docFrontend/docdashboard'
import ParaDashboard from './components/paraFrontend/paraDashboard'
import { AuthProvider } from './contexts/AuthContext';
import ForgotPassword from "./components/ForgotPassword";
import PageNotFound from './components/PageNotFound';

function App() {
  return (   
    <AuthProvider>
      <BrowserRouter>
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegistrationForm />} />

            <Route path="/puser/dashboard" element={<PatientDashboard />} />
            <Route path="/puser" element={<PatientDashboard />} />

            <Route path="/para/dashboard" element={<ParaDashboard />} />
            <Route path="/para" element={<ParaDashboard />} />

            <Route path="/doc/docDashboard" element={<DocDashboard />} />
            <Route path="/doc" element={<DocDashboard />} />

            <Route path="/forgot-password" element={<ForgotPassword />} />
            


            <Route path="*" element={<PageNotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
   
export default App;