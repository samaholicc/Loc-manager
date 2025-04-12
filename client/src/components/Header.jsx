import React, { useContext, useState, useEffect } from "react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import { HamContext } from "../HamContextProvider";
import { useTheme } from "../context/ThemeContext";
import { FaSyncAlt, FaMoon, FaSun, FaBell, FaCheck, FaUser, FaUserEdit, FaSignOutAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import axios from "axios";

function Header(props) {
  const nav = useNavigate();
  const { hamActive, hamHandler } = useContext(HamContext);
  const { darkMode, toggleDarkMode } = useTheme();

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState("Utilisateur");
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const user = JSON.parse(localStorage.getItem("whom"))?.userType || "";
  const userId = JSON.parse(localStorage.getItem("whom"))?.username || "";

  // Function to fetch user name
  const fetchUserName = async () => {
    const whomData = JSON.parse(localStorage.getItem("whom"));
    if (!whomData) return;

    try {
      if (whomData?.userType === "admin" && whomData?.adminId) {
        const res = await axios.post(`${process.env.REACT_APP_SERVER}/block_admin`, { admin_id: whomData.adminId });
        setUserName(res.data.admin_name || "Utilisateur");
      } else if (whomData?.userType === "owner") {
        const res = await axios.post(`${process.env.REACT_APP_SERVER}/dashboard/owner`, { userId: whomData.username });
        setUserName(res.data.owner?.name || "Utilisateur");
      } else if (whomData?.userType === "tenant") {
        const res = await axios.post(`${process.env.REACT_APP_SERVER}/dashboard/tenant`, { userId: whomData.username });
        setUserName(res.data[0]?.name || "Utilisateur");
      } else if (whomData?.userType === "employee") {
        const res = await axios.post(`${process.env.REACT_APP_SERVER}/dashboard/employee`, { userId: whomData.username });
        setUserName(res.data.emp_name || "Utilisateur"); // Use emp_name for employee
      }
    } catch (error) {
      console.error("Error fetching user name:", error);
      setUserName("Utilisateur");
    }
  };

  // Fetch user name on mount and when profile is updated
  useEffect(() => {
    fetchUserName();

    // Listen for a custom event to re-fetch user name after profile update
    const handleProfileUpdate = () => {
      fetchUserName();
    };

    window.addEventListener("profileUpdated", handleProfileUpdate);

    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate);
    };
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const notificationsRes = await axios.post(`${process.env.REACT_APP_SERVER}/notifications`, {
        userId,
        userType: user,
      });
      setNotifications(notificationsRes.data);
    } catch (error) {
      console.error("Error fetching notifications:", error.response?.data || error.message);
      setNotifications([]);
    }
  };

  // Handle refresh action
  const handleRefresh = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Données rafraîchies avec succès");
    } catch (error) {
      toast.error("Erreur lors du rafraîchissement des données");
    } finally {
      setLoading(false);
    }
  };

  // Toggle notifications dropdown
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      fetchNotifications();
    }
  };

  // Mark a notification as read
  const markNotificationAsRead = (index) => {
    setNotifications(notifications.filter((_, i) => i !== index));
  };

  // Handle logout
  const logoutHandler = () => {
    localStorage.clear();
    nav("/", { replace: true });
    toast.success("Déconnexion réussie.");
  };

  // Toggle profile dropdown
  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <nav className="w-full sticky z-50 top-0 h-14 bg-[#061025] shadow-md">
      <div className="flex items-center justify-between p-2">
        {/* Left Section: Logo, Title, and Greeting */}
        <div className="ml-4 flex items-center gap-4">
          <img className="h-10 w-10" src={"/Apartment rent-bro.svg"} alt="Icône Jasmine" />
          <div className="flex flex-col">
            <h1 className="text-base md:text-lg font-semibold text-white">
              LocManager
            </h1>
            <span className="text-sm text-gray-300 hidden md:block">
              Bienvenue, {userName} !
            </span>
          </div>
        </div>

        {/* Right Section: Navbar Actions */}
        <div className="flex items-center gap-3">
          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-3 mr-5">
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              onKeyDown={(e) => e.key === "Enter" && handleRefresh()}
              className={`flex items-center gap-1 px-3 py-1 rounded-md transition-all duration-300 text-sm bg-blue-500 text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none`}
              aria-label="Rafraîchir les données"
            >
              <FaSyncAlt className={loading ? "animate-spin" : ""} />
              Rafraîchir
            </button>

            {/* Notifications Button */}
            {["tenant", "owner", "admin"].includes(user) && (
              <div className="relative">
                <button
                  onClick={toggleNotifications}
                  onKeyDown={(e) => e.key === "Enter" && toggleNotifications()}
                  className="p-1 rounded-full transition-all duration-300 relative bg-gray-300 text-gray-700 hover:bg-gray-400 focus:ring-2 focus:ring-gray-500 focus:outline-none"
                  aria-label="Notifications"
                >
                  <FaBell size={16} />
                  {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg p-3 z-10 bg-white text-gray-800"
                  >
                    <h3 className="text-sm font-semibold mb-1">Notifications</h3>
                    {notifications.length === 0 ? (
                      <p className="text-xs text-gray-500">Aucune notification.</p>
                    ) : (
                      notifications.map((notif, index) => (
                        <div key={index} className="text-xs mb-1 flex justify-between items-center">
                          <div>
                            <p>{notif.message}</p>
                            <p className="text-xs text-gray-400">{new Date(notif.date).toLocaleString()}</p>
                          </div>
                          <button
                            onClick={() => markNotificationAsRead(index)}
                            className="text-green-500 hover:text-green-700 focus:outline-none"
                            aria-label="Marquer comme lu"
                          >
                            <FaCheck size={12} />
                          </button>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </div>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              onKeyDown={(e) => e.key === "Enter" && toggleDarkMode()}
              className="p-1 rounded-full transition-all duration-300 bg-gray-300 text-gray-700 hover:bg-gray-400 focus:ring-2 focus:ring-gray-500 focus:outline-none"
              aria-label={darkMode ? "Passer au mode clair" : "Passer au mode sombre"}
            >
              {darkMode ? <FaSun size={16} /> : <FaMoon size={16} />}
            </button>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={toggleProfileDropdown}
                onKeyDown={(e) => e.key === "Enter" && toggleProfileDropdown()}
                className="flex items-center gap-2 text-white font-medium text-base transition duration-300 focus:ring-2 focus:ring-gray-500 focus:outline-none"
                aria-label="Menu utilisateur"
              >
                <FaUser size={16} />
                <span className="hidden lg:inline">{userName}</span>
              </button>
              {showProfileDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg p-3 z-10 bg-white text-gray-800"
                >
                  <Link
                    to={`/${user}/edit-profile`}
                    className="flex items-center gap-2 px-2 py-1 text-sm hover:bg-gray-100 rounded"
                    onClick={() => setShowProfileDropdown(false)}
                  >
                    <FaUserEdit />
                    Modifier le profil
                  </Link>
                  <button
                    onClick={() => {
                      logoutHandler();
                      setShowProfileDropdown(false);
                    }}
                    className="flex items-center gap-2 px-2 py-1 text-sm text-red-500 hover:bg-gray-100 rounded w-full text-left"
                    aria-label="Déconnexion"
                  >
                    <FaSignOutAlt />
                    Déconnexion
                  </button>
                </motion.div>
              )}
            </div>
          </div>

          {/* Hamburger Icon (Mobile) */}
          <div className="md:hidden absolute top-4 right-4">
            <button onClick={hamHandler} aria-label="Ouvrir le menu">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="white"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Hamburger Menu (Mobile) */}
      {hamActive && (
        <div
          style={{
            transform: hamActive ? "translateX(0px)" : "translateX(-300px)",
          }}
          className="md:hidden fixed left-0 top-14 transition duration-300 w-[200px] h-full rounded-r-md text-sm bg-[#061025] text-white p-3 z-50"
        >
          <ul className="font-medium">
            {/* Greeting in Mobile Menu */}
            <li className="mt-2 px-8 text-left text-gray-300">
              Bienvenue, {userName} !
            </li>

            {/* Navigation Links */}
            {props.forHam &&
              props.forHam.map((ele, index) => {
                if (ele === "Déconnexion") {
                  return (
                    <li key={index + 1} className="mt-6 px-8 text-left">
                      <NavLink to="/" onClick={hamHandler}>
                        <span
                          className="transition duration-300 border-2 border-transparent hover:border-b-white"
                          onClick={logoutHandler}
                        >
                          Déconnexion
                        </span>
                      </NavLink>
                    </li>
                  );
                }
                if (ele === "Accueil") {
                  return (
                    <li key={index + 1} className="mt-6 px-8 text-left">
                      <NavLink to={`/${user}`} onClick={hamHandler}>
                        <span className="transition duration-300 border-2 border-transparent hover:border-b-white">
                          Accueil
                        </span>
                      </NavLink>
                    </li>
                  );
                }
                return (
                  <li key={index + 1} className="mt-6 px-8 text-left">
                    <NavLink
                      to={`/${user}/${ele.replace(/\s/g, "").toLowerCase()}`}
                      onClick={hamHandler}
                    >
                      <span className="transition duration-300 border-2 border-transparent hover:border-b-white">
                        {ele}
                      </span>
                    </NavLink>
                  </li>
                );
              })}

            {/* Additional Actions in Hamburger Menu */}
            <li className="mt-6 px-8 text-left">
              <button
                onClick={() => {
                  handleRefresh();
                  hamHandler();
                }}
                className="flex items-center gap-1 transition duration-300 text-white"
                aria-label="Rafraîchir les données"
              >
                <FaSyncAlt className={loading ? "animate-spin" : ""} />
                Rafraîchir
              </button>
            </li>

            {["tenant", "owner", "admin"].includes(user) && (
              <li className="mt-6 px-8 text-left">
                <button
                  onClick={() => {
                    toggleNotifications();
                    hamHandler();
                  }}
                  className="flex items-center gap-1 transition duration-300 text-white"
                  aria-label="Notifications"
                >
                  <FaBell />
                  Notifications
                  {notifications.length > 0 && (
                    <span className="ml-2 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>
              </li>
            )}

            <li className="mt-6 px-8 text-left">
              <button
                onClick={() => {
                  toggleDarkMode();
                  hamHandler();
                }}
                className="flex items-center gap-1 transition duration-300 text-white"
                aria-label={darkMode ? "Passer au mode clair" : "Passer au mode sombre"}
              >
                {darkMode ? <FaSun /> : <FaMoon />}
                {darkMode ? "Mode Clair" : "Mode Sombre"}
              </button>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}

export default Header;