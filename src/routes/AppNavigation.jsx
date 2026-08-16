import { useRoutes } from "react-router-dom";
import SignUpp from "../Components/SignUpp";

function AppNavigation() {
  let element = useRoutes([
    {
      path: "/",
      element: <SignUpp />,
    },
    {
      path: "/auth",
      element: <SignUpp />,
    },
    // Add other routes as needed
    // {
    //   path: "/home",
    //   element: <Home />,
    // },
    // {
    //   path: "/signup-message",
    //   element: <SignupMessage />,
    // },
  ]);
  
  return element;
}

export default AppNavigation;