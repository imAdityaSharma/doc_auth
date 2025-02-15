import React, { } from 'react';
import './styles/App.css';
  
import {BrowserRouter, Routes, Route, Link} from 'react-router-dom';
  
import Home from "./components/Home";
import LoginForm from './components/LoginForm'
import RegistrationForm from './components/Registration/RegistrationForm'
import PatientDashboard from './components/patientfrontend/patientDashboard'
import DocDashboard from './components/docFrontend/docdashboard'
function App() {
  return (   
      <BrowserRouter>
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegistrationForm />} />
            <Route path="/puser/dashboard" element={<PatientDashboard />} />
            <Route path="/doc/docDashboard" element={<DocDashboard />} />

        </Routes>
      </BrowserRouter>
  );
}
   
export default App;