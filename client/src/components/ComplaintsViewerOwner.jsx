import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";

function ComplaintsViewerOwner() {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const header = [
    { label: "Numéro de chambre", key: "room_no" },
    { label: "Plainte", key: "complaints" },
    { label: "Statut", key: "resolved" },
    { label: "Action", key: null },
  ];

  const [complaintRows, setComplaintRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const userId = JSON.parse(window.localStorage.getItem("whom"))?.username;
      console.log("Fetching complaints with userId:", userId);
      if (!userId || typeof userId !== "string") {
        throw new Error("Invalid userId: userId must be a non-empty string.");
      }

      console.log("Server URL:", process.env.REACT_APP_SERVER);
      const res = await axios.post(`${process.env.REACT_APP_SERVER}/ownercomplaints`, { userId });
      console.log("Complaints data from server:", res.data);
      setComplaintRows(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error fetching complaints:", error);
      const errorMessage =
        error.response?.data?.message || "Échec de la récupération des plaintes";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resolveComplaint = async (room_no) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir résoudre la plainte pour la chambre ${room_no} ?`)) {
      return;
    }
    try {
      const res = await axios.post(`${process.env.REACT_APP_SERVER}/deletecomplaint`, { room_no });
      if (res.status === 200) {
        toast.success("Plainte résolue avec succès !");
        getComplaints();
      }
    } catch (error) {
      console.error("Error resolving complaint:", error);
      toast.error(
        error.response?.data?.message || "Échec de la résolution de la plainte"
      );
    }
  };

  useEffect(() => {
    const whom = JSON.parse(window.localStorage.getItem("whom"));
    if (!whom || !whom.userType || !whom.username) {
      toast.error("Veuillez vous connecter pour accéder à cette page.");
      navigate("/login");
      return;
    }
    getComplaints();
  }, [navigate]);

  return (
    <section
      className={`min-h-screen py-25 px-10 flex justify-center items-center ml-[1px] w-[calc(100%-1px)] transition-all duration-300 ${
        darkMode ? "bg-gray-900" : "bg-gray-100"
      }`}
    >
      <div
        className="container rounded-xl shadow-lg overflow-hidden max-w-6xl transition-all duration-300 bg-white dark:bg-gray-800"
      >
        <div className="p-6">
          <h2
            className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-200"
          >
            Liste des Plaintes
          </h2>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div
                className="animate-spin rounded-full h-12 w-12 border-t-4 border-solid border-blue-500 dark:border-blue-400"
              ></div>
            </div>
          ) : error ? (
            <div
              className="text-center text-red-500 dark:text-red-400 text-lg font-medium p-5 bg-white dark:bg-gray-800"
            >
              <p>{error}</p>
              <button
                onClick={getComplaints}
                className="mt-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-all duration-300"
                aria-label="Réessayer de charger les données"
              >
                Réessayer
              </button>
            </div>
          ) : complaintRows.length === 0 ? (
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
              <h3
                className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-300"
              >
                Aucune plainte trouvée
              </h3>
              <p className="mt-1 text-gray-500 dark:text-gray-400">
                Aucune plainte n'a été déposée pour vos chambres.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-auto w-full border-collapse">
                <thead>
                  <tr className="bg-blue-600 dark:bg-blue-700 text-white">
                    {header.map((headerItem, index) => (
                      <th
                        key={index}
                        className="py-4 px-3 text-lg font-semibold transition-colors hover:bg-blue-700 dark:hover:bg-blue-800"
                      >
                        <div className="flex items-center justify-center">
                          {headerItem.label}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {complaintRows.map((ele, index) => (
                    <tr
                      key={index}
                      className="border-b transition-colors border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td
                        className="py-4 px-3 text-center font-medium text-gray-800 dark:text-gray-200"
                      >
                        {ele.room_no}
                      </td>
                      <td
                        className="py-4 px-3 text-center font-medium text-gray-800 dark:text-gray-200"
                      >
                        {ele.complaints || "Aucune description"}
                      </td>
                      <td
                        className="py-4 px-3 text-center font-medium text-gray-800 dark:text-gray-200"
                      >
                        {ele.resolved ? "Résolu" : "Non résolu"}
                      </td>
                      <td className="py-4 px-3 text-center">
                        {!ele.resolved && (
                          <button
                            onClick={() => resolveComplaint(ele.room_no)}
                            className="text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                          >
                            Résoudre
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
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
        theme={darkMode ? "dark" : "colored"}
      />
    </section>
  );
}

export default ComplaintsViewerOwner;