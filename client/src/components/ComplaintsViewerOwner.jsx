/* eslint-disable no-multi-str */
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion"; // For animations
import { FaSyncAlt, FaSearch, FaCheckCircle } from "react-icons/fa"; // Icons

function ComplaintsViewer(props) {
  const [comps, setComps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("room_no"); // Default sort by room_no
  const [sortOrder, setSortOrder] = useState("asc"); // Default ascending
  const [filterResolved, setFilterResolved] = useState(false); // Filter unresolved complaints
  const [searchQuery, setSearchQuery] = useState(""); // Search query
  const [currentPage, setCurrentPage] = useState(1); // Pagination
  const complaintsPerPage = 6; // Number of complaints per page

  const getComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const userId = JSON.parse(localStorage.getItem("whom"))?.username;
      if (!userId) {
        throw new Error("Utilisateur non connecté. Veuillez vous connecter.");
      }
      const res = await axios.post(`${process.env.REACT_APP_SERVER}/ownercomplaints`, {
        userId,
      });
      setComps(res.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des plaintes:", error);
      setError(error.message || "Une erreur s'est produite lors de la récupération des plaintes.");
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

  // Filter and sort complaints
  const filteredComplaints = useMemo(() => {
    let filtered = comps.filter((ele) => ele.complaints && ele.room_no);

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (ele) =>
          ele.room_no.toString().includes(searchQuery) ||
          ele.complaints.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply resolved filter
    if (filterResolved) {
      filtered = filtered.filter((ele) => !ele.resolved);
    }

    // Apply sorting
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

  // Pagination logic
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
    <div className="p-5 min-h-screen w-full bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#07074D]">
          Plaintes ({totalComplaints})
        </h1>
        <div className="flex gap-3 items-center">
          <button
            onClick={getComplaints}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all duration-300"
          >
            <FaSyncAlt className={loading ? "animate-spin" : ""} />
            Rafraîchir
          </button>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par chambre ou plainte..."
              className="pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filterResolved}
              onChange={(e) => setFilterResolved(e.target.checked)}
              className="form-checkbox h-5 w-5 text-blue-500"
            />
            <span className="text-gray-700">Afficher uniquement les plaintes non résolues</span>
          </label>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 text-lg font-medium p-5 bg-white rounded-lg shadow-md max-w-md mx-auto">
          {error}
        </div>
      ) : paginatedComplaints.length === 0 ? (
        <div className="text-center text-gray-600 text-lg font-medium p-5 bg-white rounded-lg shadow-md max-w-md mx-auto">
          Pas de plaintes trouvées.
        </div>
      ) : (
        <>
          {/* Sorting Headers */}
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-4">
            <div className="col-span-1 flex justify-center">
              <button
                onClick={() => handleSort("room_no")}
                className="text-gray-700 font-semibold flex items-center gap-1 hover:text-blue-500"
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
                className="text-gray-700 font-semibold flex items-center gap-1 hover:text-blue-500"
              >
                Plainte
                {sortBy === "complaints" && (
                  <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                )}
              </button>
            </div>
            <div className="col-span-1 flex justify-center">
              <span className="text-gray-700 font-semibold">Action</span>
            </div>
          </div>

          {/* Complaints Grid */}
          <AnimatePresence>
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {paginatedComplaints.map((ele, index) => (
                <motion.div
                  key={index + 1}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="border-2 border-gray-200 rounded-lg p-5 bg-white shadow-md flex flex-col items-center justify-center hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="mb-2">
                    <h1 className="text-center text-xl font-semibold text-[#07074D]">
                      Chambre {ele.room_no}
                    </h1>
                    <h2 className="text-center text-sm text-gray-500">
                      Numéro de chambre
                    </h2>
                  </div>
                  <div className="mb-4">
                    <h2 className="text-center text-lg font-medium text-gray-800">
                      {ele.complaints}
                    </h2>
                    <h1 className="text-center text-sm text-gray-500">Plainte</h1>
                  </div>
                  <button
                    onClick={() => handleResolveComplaint(ele.room_no)}
                    disabled={ele.resolved}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-white transition-all duration-300 ${
                      ele.resolved
                        ? "bg-gray-400 cursor-not-allowed"
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <div className="flex gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 rounded-md ${
                      currentPage === page
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    } transition-all duration-300`}
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