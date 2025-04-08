import axios from "axios";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { FaCar, FaArrowLeft } from "react-icons/fa";

function ParkingSlot() {
  const navigate = useNavigate();
  const [parkingSlot, setParkingSlot] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchParkingSlots = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${process.env.REACT_APP_SERVER}/viewparking`, {
        userId: JSON.parse(localStorage.getItem("whom"))?.username,
      });
      setParkingSlot(res.data);
    } catch (error) {
      console.error("Error fetching parking slots:", error);
      setError("Erreur lors de la récupération des places de parking");
      toast.error("Erreur lors de la récupération des places de parking");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParkingSlots();
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-100 to-gray-200 flex justify-center items-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <FaCar className="mr-2 text-indigo-500" />
            Place de Parking
          </h1>
          <button
            onClick={() => navigate("/tenant")}
            className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200"
          >
            <FaArrowLeft className="mr-2" />
            Retour
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <svg className="animate-spin h-8 w-8 text-indigo-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 text-lg font-medium p-4 bg-red-50 rounded-lg">
            {error}
          </div>
        ) : parkingSlot.length === 0 ? (
          <div className="text-center text-gray-500 text-lg font-medium p-4 bg-gray-50 rounded-lg">
            Aucune place de parking attribuée
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {parkingSlot.map((ele, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg shadow-sm flex items-center justify-between"
              >
                {ele.parking_slot === null ? (
                  <h1 className="text-gray-500 text-lg font-medium">
                    Aucune place de parking attribuée
                  </h1>
                ) : (
                  <>
                    <div>
                      <p className="font-semibold text-xl text-indigo-600">{ele.parking_slot}</p>
                      <h1 className="text-gray-500 text-sm">Numéro de place</h1>
                    </div>
                    <FaCar className="text-indigo-500 text-2xl" />
                  </>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default ParkingSlot;