import axios from "axios";
import React, { useEffect, useState } from "react";
import { MdDeleteForever } from "react-icons/md";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function OwnerDetails(props) {
  const oHeader = [
    { label: "Identifiant du propriétaire", key: "owner_id" },
    { label: "Nom", key: "name" },
    { label: "Âge", key: "age" },
    { label: "Numéro de chambre", key: "room_no" },
    { label: "Date de naissance", key: "dob" },
    { label: "Statut de l'accord", key: "aggrement_status" },
    { label: "Supprimer", key: null }, // No sorting for action column
  ];

  const [ownerRows, setOwnerRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Fetch owner data
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

  // Delete owner with confirmation
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
        getOwnerData(); // Refresh the table
      }
    } catch (error) {
      console.error("Error deleting owner:", error);
      toast.error(
        error.response?.data?.message || "Échec de la suppression du propriétaire"
      );
    }
  };

  // Sort table by column
  const handleSort = (key) => {
    if (!key) return; // Skip sorting for action column
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
    <section className="min-h-screen py-25 px-10 flex justify-center items-center bg-gray-100 ml-[1px] w-[calc(100%-1px)]">
      <div className="container bg-white rounded-xl shadow-lg overflow-hidden max-w-6xl">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Liste des Propriétaires
          </h2>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
            </div>
          ) : ownerRows.length === 0 ? (
            <div className="text-center py-10">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
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
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                Aucun propriétaire trouvé
              </h3>
              <p className="mt-1 text-gray-500">
                Commencez par ajouter un nouveau propriétaire.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-auto w-full border-collapse">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    {oHeader.map((header, index) => (
                      <th
                        key={index}
                        className="py-4 px-3 text-lg font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
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
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-3 text-center text-gray-800 font-medium">
                        {ele.owner_id}
                      </td>
                      <td className="py-4 px-3 text-center text-gray-800 font-medium">
                        {ele.name}
                      </td>
                      <td className="py-4 px-3 text-center text-gray-800 font-medium">
                        {ele.age}
                      </td>
                      <td className="py-4 px-3 text-center text-gray-800 font-medium">
                        {ele.room_no}
                      </td>
                      <td className="py-4 px-3 text-center text-gray-800 font-medium">
                        {ele.dob}
                      </td>
                      <td className="py-4 px-3 text-center text-gray-800 font-medium">
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
        theme="colored"
      />
    </section>
  );
}

export default OwnerDetails;