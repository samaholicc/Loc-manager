import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import {
  FaUser, FaUsers, FaBriefcase, FaChartBar, FaServer, FaArrowLeft, FaPlus, FaEdit, FaTrash, FaExclamationCircle, FaSortUp, FaSortDown, FaFilter
} from "react-icons/fa";
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from "chart.js";

// Register Chart.js components
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

function ManagementPortal() {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalOwners: 0,
    totalTenants: 0,
    totalEmployees: 0,
    activeLeases: 0,
    pendingRequests: 0,
  });
  const [systemStatus, setSystemStatus] = useState({
    uptime: "0%",
    activeUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [filter, setFilter] = useState({ type: "", name: "" });
  const chartRef = useRef(null);

  useEffect(() => {
    const whom = JSON.parse(window.localStorage.getItem("whom"));
    if (!whom || !whom.userType || !whom.username || whom.userType !== "admin") {
      toast.error("Seuls les administrateurs peuvent accéder au portail de gestion.");
      navigate("/login");
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [usersResponse, analyticsResponse, systemStatusResponse] = await Promise.all([
          axios.get(`${process.env.REACT_APP_SERVER}/all-users`),
          axios.get(`${process.env.REACT_APP_SERVER}/analytics`),
          axios.get(`${process.env.REACT_APP_SERVER}/systemstatus`),
        ]);

        console.log("Fetched users:", usersResponse.data);
        const validUsers = usersResponse.data.filter(user => user.id && user.type);
        setUsers(validUsers);
        setFilteredUsers(validUsers);
        setAnalytics({
          totalUsers: analyticsResponse.data.totalUsers || 0,
          totalAdmins: analyticsResponse.data.totalAdmins || 0,
          totalOwners: analyticsResponse.data.totalOwners || 0,
          totalTenants: analyticsResponse.data.totalTenants || 0,
          totalEmployees: analyticsResponse.data.totalEmployees || 0,
          activeLeases: analyticsResponse.data.activeLeases || 0,
          pendingRequests: analyticsResponse.data.pendingRequests || 0,
        });
        setSystemStatus({
          uptime: systemStatusResponse.data.uptime || "0%",
          activeUsers: systemStatusResponse.data.activeUsers || 0,
        });
      } catch (error) {
        console.error("Error fetching management portal data:", error);
        setError(error.response?.data?.error || error.message || "Une erreur s'est produite lors de la récupération des données.");
        toast.error(error.response?.data?.error || error.message || "Erreur lors de la récupération des données.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    if (!loading && !error) {
      const ctx = document.getElementById("userGrowthChart")?.getContext("2d");
      if (ctx) {
        chartRef.current = new Chart(ctx, {
          type: "bar",
          data: {
            labels: ["Admins", "Propriétaires", "Locataires", "Employés"],
            datasets: [
              {
                label: "Nombre d'Utilisateurs",
                data: [
                  analytics.totalAdmins,
                  analytics.totalOwners,
                  analytics.totalTenants,
                  analytics.totalEmployees,
                ],
                backgroundColor: [
                  "rgba(255, 99, 132, 0.7)",
                  "rgba(54, 162, 235, 0.7)",
                  "rgba(255, 206, 86, 0.7)",
                  "rgba(75, 192, 192, 0.7)",
                ],
                borderColor: [
                  "rgba(255, 99, 132, 1)",
                  "rgba(54, 162, 235, 1)",
                  "rgba(255, 206, 86, 1)",
                  "rgba(75, 192, 192, 1)",
                ],
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: "Nombre d'Utilisateurs",
                  color: darkMode ? "#e5e7eb" : "#1f2937",
                },
                ticks: {
                  color: darkMode ? "#e5e7eb" : "#1f2937",
                },
              },
              x: {
                title: {
                  display: true,
                  text: "Type d'Utilisateur",
                  color: darkMode ? "#e5e7eb" : "#1f2937",
                },
                ticks: {
                  color: darkMode ? "#e5e7eb" : "#1f2937",
                },
              },
            },
            plugins: {
              legend: {
                labels: {
                  color: darkMode ? "#e5e7eb" : "#1f2937",
                },
              },
              tooltip: {
                callbacks: {
                  label: (context) => `${context.dataset.label}: ${context.raw}`,
                },
              },
            },
          },
        });
      }
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [loading, error, analytics, darkMode]);

  const handleDeleteUser = async (userId, userType) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer cet utilisateur (${userType}, ID: ${userId}) ?`)) {
      return;
    }

    try {
      await axios.delete(`${process.env.REACT_APP_SERVER}/delete-user`, {
        data: { userId, userType },
      });
      toast.success("Utilisateur supprimé avec succès.");
      setUsers(users.filter((user) => user.id !== userId || user.type !== userType));
      setFilteredUsers(filteredUsers.filter((user) => user.id !== userId || user.type !== userType));
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(error.response?.data?.error || error.message || "Erreur lors de la suppression de l'utilisateur.");
    }
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sortedUsers = [...filteredUsers].sort((a, b) => {
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      return 0;
    });
    setFilteredUsers(sortedUsers);
  };

  const handleFilter = () => {
    let filtered = [...users];
    if (filter.type) {
      filtered = filtered.filter((user) => user.type.toLowerCase() === filter.type.toLowerCase());
    }
    if (filter.name) {
      filtered = filtered.filter((user) =>
        user.name.toLowerCase().includes(filter.name.toLowerCase())
      );
    }
    setFilteredUsers(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
  };

  const renderSkeletonLoader = () => (
    <div className="animate-pulse space-y-4">
      <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-2/3"></div>
    </div>
  );

  const renderEmptyPlaceholder = (message) => (
    <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-2">
      <FaExclamationCircle className="inline-block mr-1" />
      {message}
    </div>
  );

  return (
    <div
      className={`min-h-screen w-full transition-all duration-300 flex flex-col p-6 md:p-8 gap-8 ${
        darkMode ? "bg-gray-900" : "bg-gray-100"
      } text-gray-800 dark:text-gray-100`}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center"
      >
        <h1 className="text-3xl font-bold">Portail de Gestion</h1>
        <button
          onClick={() => navigate("/admin")}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-all duration-300 bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          <FaArrowLeft />
          Retour au Tableau de Bord
        </button>
      </motion.div>

      {/* Analytics Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-xl shadow-lg p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      >
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <FaChartBar className="text-blue-500" />
          Aperçu des Statistiques
        </h2>
        {loading ? (
          renderSkeletonLoader()
        ) : error ? (
          <div className="text-center text-red-500 text-lg font-medium">
            <FaExclamationCircle className="inline-block mr-2" />
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center gap-3">
              <FaUsers className="text-3xl text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold">Total Utilisateurs</h3>
                <p className="text-2xl">{analytics.totalUsers}</p>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center gap-3">
              <FaUser className="text-3xl text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold">Baux Actifs</h3>
                <p className="text-2xl">{analytics.activeLeases}</p>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center gap-3">
              <FaExclamationCircle className="text-3xl text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold">Demandes en Attente</h3>
                <p className="text-2xl">{analytics.pendingRequests}</p>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center gap-3">
              <FaServer className="text-3xl text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold">Utilisateurs Actifs</h3>
                <p className="text-2xl">{systemStatus.activeUsers}</p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* User Growth Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-xl shadow-lg p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      >
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <FaChartBar className="text-blue-500" />
          Croissance des Utilisateurs
        </h2>
        {loading ? (
          renderSkeletonLoader()
        ) : error ? (
          <div className="text-center text-red-500 text-lg font-medium">
            <FaExclamationCircle className="inline-block mr-2" />
            {error}
          </div>
        ) : (
          <div className="h-64">
            <canvas id="userGrowthChart" height="200"></canvas>
          </div>
        )}
      </motion.div>

      {/* User Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-xl shadow-lg p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      >
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <FaUsers className="text-blue-500" />
          Gestion des Utilisateurs
        </h2>
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-500" />
            <select
              name="type"
              value={filter.type}
              onChange={handleFilterChange}
              onBlur={handleFilter}
              className={`p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                darkMode ? "bg-gray-700 text-gray-200 border-gray-600" : "bg-white text-gray-800 border-gray-300"
              }`}
            >
              <option value="">Tous les types</option>
              <option value="admin">Admin</option>
              <option value="owner">Propriétaire</option>
              <option value="tenant">Locataire</option>
              <option value="employee">Employé</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-500" />
            <input
              type="text"
              name="name"
              value={filter.name}
              onChange={handleFilterChange}
              onBlur={handleFilter}
              placeholder="Filtrer par nom"
              className={`p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                darkMode ? "bg-gray-700 text-gray-200 border-gray-600" : "bg-white text-gray-800 border-gray-300"
              }`}
            />
          </div>
        </div>

        {loading ? (
          renderSkeletonLoader()
        ) : error ? (
          <div className="text-center text-red-500 text-lg font-medium">
            <FaExclamationCircle className="inline-block mr-2" />
            {error}
          </div>
        ) : filteredUsers.length === 0 ? (
          renderEmptyPlaceholder("Aucun utilisateur trouvé.")
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th
                    className="p-3 text-sm font-semibold tracking-wide cursor-pointer"
                    onClick={() => handleSort("id")}
                  >
                    <div className="flex items-center">
                      ID
                      {sortConfig.key === "id" && (
                        <span className="ml-1">
                          {sortConfig.direction === "asc" ? <FaSortUp /> : <FaSortDown />}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="p-3 text-sm font-semibold tracking-wide cursor-pointer"
                    onClick={() => handleSort("type")}
                  >
                    <div className="flex items-center">
                      Type
                      {sortConfig.key === "type" && (
                        <span className="ml-1">
                          {sortConfig.direction === "asc" ? <FaSortUp /> : <FaSortDown />}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="p-3 text-sm font-semibold tracking-wide cursor-pointer"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center">
                      Nom
                      {sortConfig.key === "name" && (
                        <span className="ml-1">
                          {sortConfig.direction === "asc" ? <FaSortUp /> : <FaSortDown />}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="p-3 text-sm font-semibold tracking-wide">Email</th>
                  <th className="p-3 text-sm font-semibold tracking-wide">Bloc</th>
                  <th className="p-3 text-sm font-semibold tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr
                    key={index}
                    className={`border-b dark:border-gray-700 ${
                      index % 2 === 0 ? "bg-gray-50 dark:bg-gray-800" : "bg-white dark:bg-gray-900"
                    }`}
                  >
                    <td className="p-3 text-sm">{user.id}</td>
                    <td className="p-3 text-sm">{user.type}</td>
                    <td className="p-3 text-sm">{user.name}</td>
                    <td className="p-3 text-sm">{user.email}</td>
                    <td className="p-3 text-sm">{user.block_no || "N/A"}</td>
                    <td className="p-3 text-sm flex gap-2">
                      <Link
                        to={`/${user.type}/edit-profile/${user.id}`}
                        className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <FaEdit />
                      </Link>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.type)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={darkMode ? "dark" : "light"}
      />
    </div>
  );
}

export default ManagementPortal;