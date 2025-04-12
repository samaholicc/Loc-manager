import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FaWrench } from "react-icons/fa";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext"; // Import ThemeContext

function MaintenanceRequests() {
  const { darkMode } = useTheme(); // Access darkMode state
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchMaintenanceRequests = useCallback(async (pageNum) => {
    const whom = JSON.parse(window.localStorage.getItem("whom"))?.userType;
    const userId = JSON.parse(window.localStorage.getItem("whom"))?.username;
    if (!whom || !userId) {
      console.error("User not logged in");
      toast.error("Utilisateur non connecté. Veuillez vous connecter.");
      return [];
    }
    try {
      console.log("Fetching maintenance requests with userId:", userId, "and userType:", whom, "page:", pageNum);
      const response = await axios.post(`${process.env.REACT_APP_SERVER}/maintenancerequests`, {
        userId,
        userType: whom,
        page: pageNum,
        all: true,
      });
      console.log("Maintenance Requests Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching maintenance requests:", error.response?.data || error.message);
      toast.error("Erreur lors de la récupération des demandes de maintenance : " + (error.response?.data?.error || error.message));
      return [];
    }
  }, []);

  useEffect(() => {
    const loadRequests = async () => {
      setLoading(true);
      const data = await fetchMaintenanceRequests(page);
      setMaintenanceRequests((prev) => (page === 1 ? data : [...prev, ...data]));
      setHasMore(data.length === 10);
      setLoading(false);
    };
    loadRequests();
  }, [page, fetchMaintenanceRequests]);

  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 100 &&
      !loading &&
      hasMore
    ) {
      setPage((prevPage) => prevPage + 1);
    }
  }, [loading, hasMore]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <div
      className={`min-h-screen w-full transition-all duration-300 flex flex-col ${
        darkMode ? "bg-gray-900 text-gray-200" : "bg-gradient-to-br from-blue-50 to-gray-100 text-gray-800"
      }`}
    >
      <div className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Demandes de Maintenance</h1>
          {JSON.parse(window.localStorage.getItem("whom"))?.userType === "tenant" && (
            <Link
              to="/tenant/submitmaintenancerequest"
              className={`px-4 py-2 rounded-md text-sm transition-all duration-300 flex items-center gap-2 ${
                darkMode ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
              aria-label="Soumettre une nouvelle demande"
            >
              <FaWrench />
              Soumettre une nouvelle demande
            </Link>
          )}
        </div>
        {loading && page === 1 ? (
          <div className="animate-pulse flex flex-col gap-4">
            <div
              className={darkMode ? "h-10 bg-gray-700 rounded" : "h-10 bg-gray-200 rounded"}
            ></div>
            <div
              className={darkMode ? "h-32 bg-gray-700 rounded-lg" : "h-32 bg-gray-200 rounded-lg"}
            ></div>
          </div>
        ) : maintenanceRequests.length === 0 ? (
          <p className={darkMode ? "text-gray-400" : "text-gray-500"}>Aucune demande de maintenance.</p>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`rounded-lg shadow-lg p-4 transition-all duration-300 hover:shadow-xl ${
              darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"
            }`}
          >
            <ul className="space-y-2">
              {maintenanceRequests.map((request) => (
                <li key={request.id} className="flex justify-between items-center text-sm border-b pb-2">
                  <span>Chambre {request.room_no}: {request.description}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs ${
                        request.status?.toLowerCase() === "pending"
                          ? "text-yellow-500"
                          : request.status?.toLowerCase() === "in_progress"
                          ? "text-blue-500"
                          : request.status?.toLowerCase() === "resolved"
                          ? "text-green-500"
                          : darkMode
                          ? "text-gray-400"
                          : "text-gray-400"
                      }`}
                    >
                      {request.status?.toLowerCase() === "pending"
                        ? "En attente"
                        : request.status?.toLowerCase() === "in_progress"
                        ? "En cours"
                        : request.status?.toLowerCase() === "resolved"
                        ? "Résolu"
                        : "Inconnu"}
                    </span>
                    <span className={darkMode ? "text-xs text-gray-500" : "text-xs text-gray-400"}>
                      {new Date(request.submitted_at).toLocaleString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            {loading && page > 1 && (
              <div className="mt-4 text-center text-gray-500">Chargement...</div>
            )}
            {!hasMore && maintenanceRequests.length > 0 && (
              <div className="mt-4 text-center text-gray-500">Aucune autre demande à afficher.</div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default MaintenanceRequests;