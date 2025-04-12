import React, { useState, useEffect } from "react";
import axios from "axios";
import { MdDeleteForever } from "react-icons/md";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTheme } from "../context/ThemeContext"; // Import ThemeContext

function OwnerDetails(props) {
  const { darkMode } = useTheme(); // Access darkMode state
  const oHeader = [
    { label: "Identifiant du propriétaire", key: "owner_id" },
    { label: "Nom", key: "name" },
    { label: "Âge", key: "age" },
    { label: "Numéro de chambre", key: "room_no" },
    { label: "Date de naissance", key: "dob" },
    { label: "Statut de l'accord", key: "aggrement_status" },
    { label: "Supprimer", key: null },
  ];

  const [ownerRows, setOwnerRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const getOwnerData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${process.env.REACT_APP_SERVER}/ownerdetails`);
      setOwnerRows(res.data || []);
    } catch (error) {
      console.error("Error fetching owner data:", error);
      toast.error(
        error.response?.data?.message || "Échec de la récupération des données des propriétaires"
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteOwner = async (owner_id) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le propriétaire ${owner_id} ?`)) {
      return;
    }
    try {
      const res = await axios.post(`${process.env.REACT_APP_SERVER}/deleteowner`, {
        userId: owner_id,
      });
      if (res.status === 200) {
        toast.success("Propriétaire supprimé avec succès !");
        getOwnerData();
      }
    } catch (error) {
      console.error("Error deleting owner:", error);
      toast.error(
        error.response?.data?.message || "Échec de la suppression du propriétaire"
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

    const sortedRows = [...ownerRows].sort((a, b) => {
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      return 0;
    });
    setOwnerRows(sortedRows);
  };

  useEffect(() => {
    getOwnerData();
  }, []);

  return (
    <section
      className={`min-h-screen py-25 px-10 flex justify-center items-center ml-[1px] w-[calc(100%-1px)] transition-all duration-300 ${
        darkMode ? "bg-gray-900" : "bg-gray-100"
      }`}
    >
      <div
        className={`container rounded-xl shadow-lg overflow-hidden max-w-6xl transition-all duration-300 ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        <div className="p-6">
          <h2
            className={`text-2xl font-bold mb-6 text-center ${
              darkMode ? "text-gray-200" : "text-gray-800"
            }`}
          >
            Liste des Propriétaires
          </h2>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div
                className={`animate-spin rounded-full h-12 w-12 border-t-4 border-solid ${
                  darkMode ? "border-blue-400" : "border-blue-500"
                }`}
              ></div>
            </div>
          ) : ownerRows.length === 0 ? (
            <div className="text-center py-10">
              <svg
                className={darkMode ? "mx-auto h-12 w-12 text-gray-500" : "mx-auto h-12 w-12 text-gray-400"}
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
                className={darkMode ? "mt-2 text-lg font-medium text-gray-300" : "mt-2 text-lg font-medium text-gray-900"}
              >
                Aucun propriétaire trouvé
              </h3>
              <p className={darkMode ? "mt-1 text-gray-400" : "mt-1 text-gray-500"}>
                Commencez par ajouter un nouveau propriétaire.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-auto w-full border-collapse">
                <thead>
                  <tr
                    className={darkMode ? "bg-blue-700 text-white" : "bg-blue-600 text-white"}
                  >
                    {oHeader.map((header, index) => (
                      <th
                        key={index}
                        className={`py-4 px-3 text-lg font-semibold cursor-pointer transition-colors ${
                          darkMode ? "hover:bg-blue-800" : "hover:bg-blue-700"
                        }`}
                        onClick={() => handleSort(header.key)}
                      >
                        <div className="flex items-center justify-center">
                          {header.label}
                          {sortConfig.key === header.key && (
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
                  {ownerRows.map((ele, index) => (
                    <tr
                      key={index}
                      className={`border-b transition-colors ${
                        darkMode
                          ? "border-gray-700 hover:bg-gray-700"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <td
                        className={`py-4 px-3 text-center font-medium ${
                          darkMode ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        {ele.owner_id}
                      </td>
                      <td
                        className={`py-4 px-3 text-center font-medium ${
                          darkMode ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        {ele.name}
                      </td>
                      <td
                        className={`py-4 px-3 text-center font-medium ${
                          darkMode ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        {ele.age}
                      </td>
                      <td
                        className={`py-4 px-3 text-center font-medium ${
                          darkMode ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        {ele.room_no}
                      </td>
                      <td
                        className={`py-4 px-3 text-center font-medium ${
                          darkMode ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        {ele.dob}
                      </td>
                      <td
                        className={`py-4 px-3 text-center font-medium ${
                          darkMode ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        {ele.aggrement_status}
                      </td>
                      <td className="py-4 px-3 text-center">
                        <button
                          onClick={() => deleteOwner(ele.owner_id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
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

export default OwnerDetails;