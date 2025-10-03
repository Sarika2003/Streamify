import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useState } from "react";

const Layout = ({ children, showSidebar = false }) => {

   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
   const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  return (
    <div className="min-h-screen flex bg-base-100">
      {showSidebar && <div className="flex-shrink-0">
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        </div>}

        <div className="flex-1 flex flex-col overflow-x-hidden">
          <Navbar showHamburger={showSidebar} toggleSidebar={toggleSidebar} />
          <main className="flex-1 w-full">{children}</main>
        </div>
  
    </div>
  );
};
export default Layout;
