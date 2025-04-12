/* eslint-disable no-multi-str */
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FaSyncAlt, FaSearch, FaCheckCircle } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext"; // Import ThemeContext

function ComplaintsViewer(props) {
  const { darkMode } = useTheme(); // Access darkMode state
  const [comps, setComps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("room_no");
  const [sortOrder, setSortOrder] = useState("asc");
  const [filterResolved, setFilterResolved] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const complaintsPerPage = 6;

  const getComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const userId = JSON.parse(localStorage.getItem("whom"))?.username;
      if (!userId) {
        throw new Error("Utilisateur non connecté. Veuillez vous connecter.");
      }
      // Extract numeric part (e.g., "o-123" -> "123")
      const numericId = parseInt(userId.split('-')[1]);
      if (isNaN(numericId)) {
        throw new Error("ID utilisateur invalide.");
      }
      const res = await axios.post(`${process.env.REACT_APP_SERVER}/ownercomplaints`, {
        userId: numericId,
      });
      setComps(res.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des plaintes:", error);
      setError(error.response?.data?.error || error.message || "Une erreur s'est produite lors de la récupération des plaintes.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    getComplaints();
  }, []);

  const handleResolveComplaint = async (room_no) => {
    try {
      await axios.post(`${process.env.REACT_APP_SERVER}/deletecomplaint`, {
        room_no,
      });
      setComps(comps.map((comp) =>
        comp.room_no === room_no ? { ...comp, resolved: true, complaints: null } : comp
      ));
    } catch (error) {
      console.error("Erreur lors de la résolution de la plainte:", error);
      alert("Erreur lors de la résolution de la plainte.");
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const filteredComplaints = useMemo(() => {
    let filtered = comps.filter((ele) => ele.complaints && ele.room_no);

    if (searchQuery) {
      filtered = filtered.filter(
        (ele) =>
          ele.room_no.toString().includes(searchQuery) ||
          ele.complaints.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterResolved) {
      filtered = filtered.filter((ele) => !ele.resolved);
    }

    return filtered.sort((a, b) => {
      const valueA = a[sortBy];
      const valueB = b[sortBy];
      if (sortOrder === "asc") {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });
  }, [comps, searchQuery, filterResolved, sortBy, sortOrder]);

  const totalComplaints = filteredComplaints.length;
  const totalPages = Math.ceil(totalComplaints / complaintsPerPage);
  const paginatedComplaints = filteredComplaints.slice(
    (currentPage - 1) * complaintsPerPage,
    currentPage * complaintsPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div
      className={`p-5 min-h-screen w-full transition-all duration-300 ${
        darkMode ? "bg-gray-900" : "bg-gradient-to-b from-gray-50 to-gray-100"
      }`}
    >
      <div className="flex justify-between items-center mb-6">
        <h1
          className={`text-3xl font-bold ${
            darkMode ? "text-gray-200" : "text-[#07074D]"
          }`}
        >
          Plaintes ({totalComplaints})
        </h1>
        <div className="flex gap-3 items-center">
          
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par chambre ou plainte..."
              className={`pl-10 pr-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                darkMode
                  ? "bg-gray-700 text-gray-200 border-gray-600"
                  : "bg-white text-gray-800 border-gray-300"
              }`}
            />
            <FaSearch
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                darkMode ? "text-gray-400" : "text-gray-400"
              }`}
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filterResolved}
              onChange={(e) => setFilterResolved(e.target.checked)}
              className="form-checkbox h-5 w-5 text-blue-500"
            />
            <span
              className={darkMode ? "text-gray-300" : "text-gray-700"}
            >
              Afficher uniquement les plaintes non résolues
            </span>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div
            className={`animate-spin rounded-full h-12 w-12 border-t-4 border-solid ${
              darkMode ? "border-blue-400" : "border-blue-500"
            }`}
          ></div>
        </div>
      ) : error ? (
        <div
          className={`text-center text-red-500 text-lg font-medium p-5 rounded-lg shadow-md max-w-md mx-auto ${
            darkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          {error}
        </div>
      ) : paginatedComplaints.length === 0 ? (
        <div className="text-center py-10">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-300">
                Pas de plainte trouvée
              </h3>
            </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-4">
            <div className="col-span-1 flex justify-center">
              <button
                onClick={() => handleSort("room_no")}
                className={`font-semibold flex items-center gap-1 hover:text-blue-500 transition-all duration-300 ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Numéro de chambre
                {sortBy === "room_no" && (
                  <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                )}
              </button>
            </div>
            <div className="col-span-1 flex justify-center">
              <button
                onClick={() => handleSort("complaints")}
                className={`font-semibold flex items-center gap-1 hover:text-blue-500 transition-all duration-300 ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Plainte
                {sortBy === "complaints" && (
                  <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                )}
              </button>
            </div>
            <div className="col-span-1 flex justify-center">
              <span
                className={`font-semibold ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Action
              </span>
            </div>
          </div>

          <AnimatePresence>
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {paginatedComplaints.map((ele, index) => (
                <motion.div
                  key={index + 1}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`border-2 rounded-lg p-5 shadow-md flex flex-col items-center justify-center hover:shadow-xl transition-shadow duration-300 ${
                    darkMode
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="mb-2">
                    <h1
                      className={`text-center text-xl font-semibold ${
                        darkMode ? "text-gray-200" : "text-[#07074D]"
                      }`}
                    >
                      Chambre {ele.room_no}
                    </h1>
                    <h2
                      className={`text-center text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Numéro de chambre
                    </h2>
                  </div>
                  <div className="mb-4">
                    <h2
                      className={`text-center text-lg font-medium ${
                        darkMode ? "text-gray-200" : "text-gray-800"
                      }`}
                    >
                      {ele.complaints}
                    </h2>
                    <h1
                      className={`text-center text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Plainte
                    </h1>
                  </div>
                  <button
                    onClick={() => handleResolveComplaint(ele.room_no)}
                    disabled={ele.resolved}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-white transition-all duration-300 ${
                      ele.resolved
                        ? "bg-gray-400 cursor-not-allowed"
                        : darkMode
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-green-500 hover:bg-green-600"
                    }`}
                  >
                    <FaCheckCircle />
                    {ele.resolved ? "Résolu" : "Résoudre"}
                  </button>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>

          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <div className="flex gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 rounded-md transition-all duration-300 ${
                      currentPage === page
                        ? darkMode
                          ? "bg-blue-600 text-white"
                          : "bg-blue-500 text-white"
                        : darkMode
                        ? "bg-gray-600 text-gray-200 hover:bg-gray-700"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ComplaintsViewer;