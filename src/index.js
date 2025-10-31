import React , { useEffect } from 'react';
import './i18n';
import ReactDOM from 'react-dom/client';
import './index.css';
import "leaflet/dist/leaflet.css";
import App from './App';
import {
  createBrowserRouter,
  RouterProvider, // ★ replaces BrowserRouter + Routes
} from "react-router-dom";
import { actorsSocket } from './services/actorsSocket';
import { Provider , useStore } from "react-redux";
import { store } from "./app/store";
import { adminSocket } from './services/adminSocket';
import LateRefreshBootstrap from "./app/LateRefreshBootstrap";
import RootFrame from "./app/RootFrame";

function SocketBootstrap() {
  const s = useStore();
  useEffect(() => {
    adminSocket.enableDebug(true);           // optional
    adminSocket.init(s).ensureConnected();   // connect once
    return () => adminSocket.disconnect();   // cleanup on app exit
  }, [s]);
  useEffect(() => {
    actorsSocket.enableDebug(true);
    actorsSocket.init(s).ensureConnected();   // connect once
    return () => actorsSocket.disconnect();   // cleanup on app exit
  }, [s]);
  return null;
}
const router = createBrowserRouter([
  {
    element: <RootFrame />,               // ✅ loader lives here
    children: [
      { path: "*", element: <App /> }     // your app handles its own routes
    ]
  }
]);


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <SocketBootstrap></SocketBootstrap>
        <LateRefreshBootstrap />
        <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>
);


