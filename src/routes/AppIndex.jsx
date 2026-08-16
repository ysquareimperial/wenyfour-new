import React from "react";
import { Outlet } from "react-router-dom";
import NavigationMenu from "../Components/NavigationMenu";
export default function AppIndex() {
  return (
    <div>
      <div className="pb-4">
        <NavigationMenu />
      </div>
      <Outlet />
    </div>
  );
}
