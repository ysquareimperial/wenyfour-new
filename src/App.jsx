// src/App.jsx
import React from "react";
import { AuthProvider } from "./context/AuthContext";
import AppNavigation from "./routes/AppNavigation";

// NOTE: this assumes <BrowserRouter> already wraps <App /> in your
// main.jsx/index.jsx (it must, since AppNavigation uses useRoutes).
function App() {
  return (  
    <AuthProvider>
      <AppNavigation />
    </AuthProvider>
  );
}

export default App;