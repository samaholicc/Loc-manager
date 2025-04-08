import axios from "axios";
import React, { useEffect, useState } from "react";
import { MdDeleteForever } from "react-icons/md";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function TenantDetails(props) {
  const header = [
    { label: "Numéro locataire", key: "tenant_id" },
    { label: "Numéro chambre", key: "room_no" },
    { label: "Nom", key: "name" },
    { label: "Âge", key: "age" },
    { label: "Date de naissance", key: "dob" },
    { label: "Statut", key: "stat" },
    { label: "Supprimer", key: null }, // No sorting for action column
  ];

  const [tenantRows, setTenantRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Fetch tenant data
  const getTenantRows = async () => {
    setLoading(true);
    try {
      console.log("Server URL:", process.env.REACT_APP_SERVER);
      const res = await axios.get(`${process.env.REACT_APP_SERVER}/tenantdetails`);
      console.log("Tenant data from server:", res.data);
      setTenantRows(res.data || []);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      toast.error(
        error.response?.data?.message || "Échec de la récupération des données des locataires"
      );
    } finally {
      setLoading(false);
    }
  };

  // Delete tenant with confirmation
  const deleteTenant = async (tenant_id) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le locataire ${tenant_id} ?`)) {
      return;
    }
    try {
      const res = await axios.post(`${process.env.REACT_APP_SERVER}/deletetenant`, {
        userId: tenant_id,
      });
      if (res.status === 200) {
        toast.success("Locataire supprimé avec succès !");
        getTenantRows(); // Refresh the list
      }
    } catch (error) {
      console.error("Error deleting tenant:", error);
      toast.error(
        error.response?.data?.message || "Échec de la suppression du locataire"
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

    const sortedRows = [...tenantRows].sort((a, b) => {
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      return 0;
    });
    setTenantRows(sortedRows);
  };

  useEffect(() => {
    getTenantRows();
  }, []);

  return (
    <section className="min-h-screen py-25 px-10 flex justify-center items-center bg-gray-100 ml-[1px] w-[calc(100%-1px)]">
      <div className="container bg-white rounded-xl shadow-lg overflow-hidden max-w-6xl">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Liste des Locataires
          </h2>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
            </div>
          ) : tenantRows.length === 0 ? (
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
                Aucun locataire trouvé
              </h3>
              <p className="mt-1 text-gray-500">
                Commencez par ajouter un nouveau locataire.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-auto w-full border-collapse">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    {header.map((headerItem, index) => (
                      <th
                        key={index}
                        className="py-4 px-3 text-lg font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
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
                  {tenantRows.map((ele, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-3 text-center text-gray-800 font-medium">
                        {ele.tenant_id}
                      </td>
                      <td className="py-4 px-3 text-center text-gray-800 font-medium">
                        {ele.room_no}
                      </td>
                      <td className="py-4 px-3 text-center text-gray-800 font-medium">
                        {ele.name}
                      </td>
                      <td className="py-4 px-3 text-center text-gray-800 font-medium">
                        {ele.age}
                      </td>
                      <td className="py-4 px-3 text-center text-gray-800 font-medium">
                        {ele.dob}
                      </td>
                      <td className="py-4 px-3 text-center text-gray-800 font-medium">
                        {ele.stat || "N/A"} {/* Handle null/undefined stat */}
                      </td>
                      <td className="py-4 px-3 text-center">
                        <button
                          onClick={() => deleteTenant(ele.tenant_id)}
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

export default TenantDetails;