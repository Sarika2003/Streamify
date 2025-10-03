import { Link, useLocation } from "react-router"; 
import useAuthUser from "../hooks/useAuthUser";
import { BellIcon, ClockIcon, HomeIcon, ShipWheelIcon, XIcon } from "lucide-react";
import { useFriendRequestsCount } from "../hooks/useFriendRequestsCount"; 

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const currentPath = location.pathname;
  const { incomingCount } = useFriendRequestsCount();

  const getLinkClass = (path) =>
    `btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
      currentPath === path ? "btn-active" : ""
    }`;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`
          w-64 bg-base-200 border-r border-base-300 flex-col h-screen z-50 transition-transform duration-300
          
          fixed top-0 left-0 
          ${isOpen ? "translate-x-0 flex" : "-translate-x-full hidden"}
          
          lg:flex lg:sticky lg:top-0 lg:translate-x-0
        `}
      >
        <div className="p-5 border-b border-base-300 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5" onClick={toggleSidebar}>
            <ShipWheelIcon className="size-9 text-primary" />
            <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary  tracking-wider">
              Streamify
            </span>
          </Link>
          <button className="btn btn-ghost btn-circle lg:hidden" onClick={toggleSidebar}>
            <XIcon className="size-6" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <Link to="/" className={getLinkClass("/")} onClick={toggleSidebar}>
            <HomeIcon className="size-5 text-base-content opacity-70" />
            <span>Home</span>
          </Link>

          <Link to="/recent-chats" className={getLinkClass("/recent-chats")} onClick={toggleSidebar}>
            <ClockIcon className="size-5 text-base-content opacity-70" />
            <span>Recent Chats</span>
          </Link>

          <Link to="/notifications" className={getLinkClass("/notifications")} onClick={toggleSidebar}>
            <div className="relative">
              <BellIcon className="size-5 text-base-content opacity-70" />
              {/* Notification badge */}
              {incomingCount > 0 && (
                <span className="absolute -top-1 -right-2 badge badge-xs badge-error text-white p-2">
                  {incomingCount}
                </span>
              )}
            </div>
            <span>Notifications</span>
          </Link>
        </nav>

        {/* User profile section */}
        <div className="p-4 border-t border-base-300 mt-auto">
          <Link to="/profile" className="flex items-center gap-3" onClick={toggleSidebar}>
            <div className="avatar">
              <div className="w-10 rounded-full">
                <img src={authUser?.profilePic} alt="User Avatar" />
              </div>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{authUser?.fullName}</p>
              <p className="text-xs text-success flex items-center gap-1">
                <span className="size-2 rounded-full bg-success inline-block" />
                Online
              </p>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
};
export default Sidebar;