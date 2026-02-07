import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LandingPage } from './components/LandingPage';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const Root = () => {
  // Check if user has visited before or check session storage if needed
  // For now, simple state
  const [hasStarted, setHasStarted] = useState(false);

  return (
    <React.StrictMode>
      {hasStarted ? (
        <App />
      ) : (
        <LandingPage onStart={() => setHasStarted(true)} />
      )}
    </React.StrictMode>
  );
};

const root = ReactDOM.createRoot(rootElement);
root.render(<Root />);