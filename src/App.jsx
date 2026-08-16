import { useEffect, useState } from "react";
import "./App.css";
import SignUpp from "./Components/SignUpp";
import { useDispatch } from "react-redux";
import { restoreUserFromLocalStorage } from "./redux/actions";

function App() {
  const dispatch = useDispatch();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Restore user session on app load
  useEffect(() => {
    dispatch(restoreUserFromLocalStorage());
  }, [dispatch]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <>
      <SignUpp />
    </>
  );
}

export default App;