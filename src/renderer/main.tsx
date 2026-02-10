import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@arco-design/web-react/dist/css/arco.css';
import '@arco-design/web-react/es/_util/react-19-adapter';
import './index.css';
import './i18n'; // Initialize i18n

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
