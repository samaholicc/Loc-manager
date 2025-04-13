import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FaWrench, FaRedo } from "react-icons/fa";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import debounce from "lodash/debounce";

function MaintenanceRequests() {
  const { darkMode } = useTheme();
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const userType = JSON.parse(window.localStorage.getItem("whom"))?.userType || "";

  const fetchMaintenanceRequests = useCallback(async (pageNum, retries = 3) => {
    const whom = JSON.parse(window.localStorage.getItem("whom"));
    const userType = whom?.userType;
    const userId = whom?.username;
    if (!userType || !userId) {
      console.error("User not logged in");
      toast.error("Utilisateur non connecté. Veuillez vous connecter.");
      throw new Error("User not logged in");
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`Fetching maintenance requests (Attempt ${attempt}) with userId:`, userId, "and userType:", userType, "page:", pageNum);
        console.log("Requesting URL:", `${process.env.REACT_APP_SERVER}/maintenancerequests`);
        const response = await axios.post(
          `${process.env.REACT_APP_SERVER}/maintenancerequests`,
          {
            userId,
            userType: userType,
            page: pageNum,
            limit: 2,
            all: true,
          },
          {
            headers: {
              whom: JSON.stringify({ userType, username: userId }),
            },
          }
        );
        console.log("Maintenance Requests Response:", response.data);
        return response.data;
      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, {
          message: error.message,
          code: error.code,
          response: error.response ? {
            status: error.response.status,
            data: error.response.data,
          } : null,
          config: error.config,
        });
        if (attempt === retries) {
          if (error.code === "ERR_NETWORK") {
            throw new Error("Erreur réseau : Impossible de se connecter au serveur. Vérifiez votre connexion ou si le serveur est en marche.");
          } else if (error.response) {
            throw new Error(`Erreur serveur (${error.response.status}) : ${error.response.data?.error || error.message}`);
          } else {
            throw new Error("Erreur lors de la récupération des demandes de maintenance : " + error.message);
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }, []);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMaintenanceRequests(page);
      setMaintenanceRequests((prev) => (page === 1 ? data : [...prev, ...data]));
      setHasMore(data.length === 2);
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [page, fetchMaintenanceRequests]);

  useEffect(() => {
    // Wrap the async call in a self-invoking async function to catch rejections
    (async () => {
      try {
        await loadRequests();
      } catch (error) {
        // Ensure any uncaught errors are caught here
        console.error("Uncaught error in loadRequests:", error);
      }
    })();
  }, [loadRequests, page]);

  const handleScroll = useCallback(
    debounce(() => {
      if (
        window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 100 &&
        !loading &&
        hasMore
      ) {
        setPage((prevPage) => prevPage + 1);
      }
    }, 200),
    [loading, hasMore]
  );

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      handleScroll.cancel();
    };
  }, [handleScroll]);

  const updateRequestStatus = async (requestId, newStatus) => {
    try {
      const whom = JSON.parse(window.localStorage.getItem("whom"));
      if (!whom || !whom.userType || !whom.username) {
        toast.error("Utilisateur non connecté. Veuillez vous reconnecter.");
        return;
      }

      const response = await axios.put(
        `${process.env.REACT_APP_SERVER}/updatemaintenancerequest/${requestId}`,
        { status: newStatus },
        {
          headers: {
            whom: JSON.stringify(whom),
          },
        }
      );
      toast.success(response.data.message || "Statut mis à jour avec succès.");
      setMaintenanceRequests((prev) =>
        prev.map((req) =>
          req.id === requestId ? { ...req, status: newStatus } : req
        )
      );
    } catch (error) {
      console.error("Error updating maintenance request status:", error);
      toast.error(error.response?.data?.error || "Erreur lors de la mise à jour du statut.");
    }
  };

  return (
    <div
      className={`min-h-screen w-full transition-all duration-300 flex justify-center items-center ${
        darkMode ? "bg-gray-900 text-gray-200" : "bg-gradient-to-br from-blue-50 to-gray-100 text-gray-800"
      }`}
    >
      <div
        className={`container rounded-xl shadow-lg overflow-hidden max-w-6xl transition-all duration-300 bg-white dark:bg-gray-800 ${
          maintenanceRequests.length === 0 ? "flex flex-col justify-center items-center " : ""
        }`}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Demandes de Maintenance</h1>
            <div className="flex items-center gap-3">
              {userType === "tenant" && (
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
              <Link
                to={`/${userType}/maintenancerequests`}
                className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-all duration-300 text-sm flex items-center gap-1 relative group"
                aria-label="Voir toutes les demandes"
              >
                <FaWrench />
                Voir toutes les demandes
                <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
                  Voir toutes les demandes
                </span>
              </Link>
            </div>
          </div>
          {loading && page === 1 ? (
            <div className="text-center py-10">
              <svg
                className="animate-spin h-8 w-8 mx-auto text-blue-500"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="mt-2 text-gray-500 dark:text-gray-400">Chargement...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-300">
                Aucune demande de maintenance trouvée
              </h3>
              <p className="mt-1 text-gray-500 dark:text-gray-400">
                {userType === "tenant"
                  ? "Commencez par soumettre une nouvelle demande."
                  : "Contactez un locataire pour soumettre une demande de maintenance."}
              </p>
              {userType === "tenant" ? (
                <div className="mt-4 flex flex-col items-center gap-2">
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
                  <button
                    onClick={loadRequests}
                    className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 text-sm"
                    aria-label="Réessayer"
                  >
                    <FaRedo />
                    Réessayer
                  </button>
                </div>
              ) : null}
            </div>
          ) : maintenanceRequests.length === 0 ? (
            <div className="text-center py-10">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-300">
                Aucune demande de maintenance trouvée
              </h3>
              <p className="mt-1 text-gray-500 dark:text-gray-400">
                {userType === "tenant"
                  ? "Commencez par soumettre une nouvelle demande."
                  : "Contactez un locataire pour soumettre une demande de maintenance."}
              </p>
              {userType === "tenant" ? (
                <Link
                  to="/tenant/submitmaintenancerequest"
                  className={`mt-4 inline-block px-4 py-2 rounded-md text-sm transition-all duration-300 flex items-center gap-2 mx-auto ${
                    darkMode ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                  aria-label="Soumettre une nouvelle demande"
                >
                  <FaWrench />
                  Soumettre une nouvelle demande
                </Link>
              ) : null}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className={`rounded-lg shadow-lg p-4 transition-all duration-300 hover:shadow-xl ${
                darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"
              }`}
            >
              <ul className="space-y-4">
                {maintenanceRequests.map((request) => (
                  <li
                    key={request.id}
                    className="flex justify-between items-center text-base border-b pb-3 border-gray-200 dark:border-gray-700"
                  >
                    <span className="font-medium">{`Chambre ${request.room_no}: ${request.description}`}</span>
                    <div className="flex items-center gap-3">
                      {["admin", "owner", "employee"].includes(userType) ? (
                        <select
                          value={request.status}
                          onChange={(e) => updateRequestStatus(request.id, e.target.value)}
                          className={`text-sm rounded p-1 ${
                            darkMode
                              ? "bg-gray-700 text-gray-200 border-gray-600"
                              : "bg-gray-200 text-gray-800 border-gray-300"
                          }`}
                          aria-label={`Modifier le statut de la demande pour la chambre ${request.room_no}`}
                        >
                          <option value="pending">En attente</option>
                          <option value="in_progress">En cours</option>
                          <option value="resolved">Résolu</option>
                        </select>
                      ) : (
                        <span
                          className={`text-sm px-3 py-1 rounded-full ${
                            request.status?.toLowerCase() === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : request.status?.toLowerCase() === "in_progress"
                              ? "bg-blue-100 text-blue-800"
                              : request.status?.toLowerCase() === "resolved"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
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
                      )}
                      <span className={darkMode ? "text-sm text-gray-500" : "text-sm text-gray-400"}>
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
    </div>
  );
}

export default MaintenanceRequests;