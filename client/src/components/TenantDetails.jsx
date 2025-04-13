import React, { useEffect, useState } from "react";
import axios from "axios"; // Re-import axios
import { MdDeleteForever } from "react-icons/md";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import Particle from "./Particle"; // Import the Particle component

function TenantDetails({ tenantRows, tenantLoading, tenantError }) {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const header = [
    { label: "Numéro locataire", key: "tenant_id" },
    { label: "Numéro chambre", key: "room_no" },
    { label: "Nom", key: "name" },
    { label: "Âge", key: "age" },
    { label: "Date de naissance", key: "dob" },
    { label: "Statut", key: "stat" },
    { label: "Supprimer", key: null },
  ];

  const [sortedRows, setSortedRows] = useState([]); // Local state for sorted rows
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Update sortedRows when tenantRows changes
  useEffect(() => {
    setSortedRows([...tenantRows]); // Initialize with tenantRows prop
  }, [tenantRows]);

  const deleteTenant = async (tenant_id) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le locataire ${tenant_id} ?`)) {
      return;
    }
    try {
      const res = await axios.post(`${process.env.REACT_APP_SERVER}/deletetenant`, {
        userId: `t-${tenant_id}`,
      });
      if (res.status === 200) {
        toast.success("Locataire supprimé avec succès !");
        // Fetch tenants again through App.jsx by reloading
        window.location.reload(); // Temporary solution; ideally, call a prop function to refetch
      }
    } catch (error) {
      console.error("Error deleting tenant:", error);
      toast.error(
        error.response?.data?.message || "Échec de la suppression du locataire"
      );
    }
  };

  const handleSort = (key) => {
    if (!key) return;
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sorted = [...sortedRows].sort((a, b) => {
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      return 0;
    });
    setSortedRows(sorted);
  };

  useEffect(() => {
    const whom = JSON.parse(window.localStorage.getItem("whom"));
    if (!whom || !whom.userType || !whom.username) {
      toast.error("Veuillez vous connecter pour accéder à cette page.");
      navigate("/login");
      return;
    }
  }, [navigate]);

  useEffect(() => {
    console.log("TenantDetails darkMode:", darkMode);
  }, [darkMode]);

  return (
    <section
      className={`min-h-screen py-25 px-10 flex justify-center items-center ml-[1px] w-[calc(100%-1px)] transition-all duration-300 relative ${
        darkMode ? "bg-gray-900" : "bg-gray-100"
      }`}
    >
      <Particle />
      <div
        className="container rounded-xl shadow-lg overflow-hidden max-w-6xl transition-all duration-300 bg-white dark:bg-gray-800"
      >
        <div className="p-6">
          <h2
            className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-200"
          >
            Liste des Locataires
          </h2>
          {tenantLoading ? (
            <div className="flex justify-center items-center py-10">
              <div
                className="animate-spin rounded-full h-12 w-12 border-t-4 border-solid border-blue-500 dark:border-blue-400"
              ></div>
            </div>
          ) : tenantError ? (
            <div
              className="text-center text-red-500 dark:text-red-400 text-lg font-medium p-5 bg-white dark:bg-gray-800"
            >
              <p>{tenantError}</p>
              <button
                onClick={() => window.location.reload()} // Temporary solution; ideally, call a prop function to refetch
                className="mt-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-all duration-300"
                aria-label="Réessayer de charger les données"
              >
                Réessayer
              </button>
            </div>
          ) : sortedRows.length === 0 ? (
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
                Aucun locataire trouvé
              </h3>
              <p className="mt-1 text-gray-500 dark:text-gray-400">
                Commencez par ajouter un nouveau locataire.
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
                        className="py-4 px-3 text-lg font-semibold cursor-pointer transition-colors hover:bg-blue-700 dark:hover:bg-blue-800"
                        onClick={() => handleSort(headerItem.key)}
                      >
                        <div className="flex items-center justify-center">
                          {headerItem.label}
                          {sortConfig.key === headerItem.key && (
                            <span className="ml-2">
                              {sortConfig.direction === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((ele, index) => (
                    <tr
                      key={index}
                      className="border-b transition-colors border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="py-4 px-3 text-center font-medium text-gray-800 dark:text-gray-200">
                        {`t-${ele.tenant_id}`}
                      </td>
                      <td className="py-4 px-3 text-center font-medium text-gray-800 dark:text-gray-200">
                        {ele.room_no}
                      </td>
                      <td className="py-4 px-3 text-center font-medium text-gray-800 dark:text-gray-200">
                        {ele.name}
                      </td>
                      <td className="py-4 px-3 text-center font-medium text-gray-800 dark:text-gray-200">
                        {ele.age}
                      </td>
                      <td className="py-4 px-3 text-center font-medium text-gray-800 dark:text-gray-200">
                        {ele.dob}
                      </td>
                      <td className="py-4 px-3 text-center font-medium text-gray-800 dark:text-gray-200">
                        {ele.stat || "N/A"}
                      </td>
                      <td className="py-4 px-3 text-center">
                        <button
                          onClick={() => deleteTenant(ele.tenant_id)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        >
                          <MdDeleteForever className="text-2xl" />
                        </button>
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

export default TenantDetails;