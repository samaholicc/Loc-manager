import React, { useEffect, useState } from "react";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import Particle from "./Particle"; // Import the Particle component

function RoomDetailsOwner() {
  const { darkMode } = useTheme();


  const roomDetailsHeader = [
    "Numéro de chambre",
    "Type de chambre",
    "Numéro d'étage",
    "Numéro d'enregistrement",
    "Numéro de bloc",
    "Place de parking",
  ];

  const [roomRows, setRoomRows] = useState([]);

  const getRoomDetails = async (userId) => {
    try {
      const res = await axios.post(`${process.env.REACT_APP_SERVER}/ownerroomdetails`, {
        userId,
      });
      console.log("Response data:", res.data);
      setRoomRows(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error fetching room details:", error.response ? error.response.data : error.message);
      toast.error("Erreur lors de la récupération des détails des chambres.");
      setRoomRows([]);
    }
  };

  useEffect(() => {
    const userId = JSON.parse(window.localStorage.getItem("whom"))?.username;
    console.log("userId:", userId);
    if (!userId) {
      console.error("No userId found in localStorage");
      return;
    }
    getRoomDetails(userId);
  }, []);

  // If there's no userId, return a message
  const userId = JSON.parse(window.localStorage.getItem("whom"))?.username;
  if (!userId) {
    return (
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl card overflow-hidden">
          <p className="text-center text-red-500 dark:text-red-400">Please log in to view room details.</p>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`min-h-screen py-25 px-10 flex justify-center items-center ml-[1px] w-[calc(100%-1px)] transition-all duration-300 relative ${
        darkMode ? "bg-gray-900" : "bg-gray-100"
      }`}
    >
      {/* Particle Background */}
      <Particle />
      
      <div
        className="container rounded-xl shadow-lg overflow-hidden max-w-6xl transition-all duration-300 bg-white dark:bg-gray-800 flex flex-col gap-8 relative z-20"
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-200">
            Détails des Chambres
          </h2>
          {roomRows.length === 0 ? (
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
                Aucune chambre trouvée
              </h3>
              <p className="mt-1 text-gray-500 dark:text-gray-400">
                Aucune chambre associée à votre compte.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-auto w-full border-collapse">
                <thead>
                  <tr className="bg-blue-600 dark:bg-blue-700 text-white">
                    {roomDetailsHeader.map((ele, index) => (
                      <th
                        key={index}
                        className="py-4 px-3 text-lg font-semibold text-center transition-colors hover:bg-blue-700 dark:hover:bg-blue-800"
                      >
                        {ele}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {roomRows.map((ele, index) => (
                    <tr
                      key={index}
                      className="border-b transition-colors border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="py-4 px-3 text-center font-medium text-gray-800 dark:text-gray-200">
                        {ele.room_no}
                      </td>
                      <td className="py-4 px-3 text-center font-medium text-gray-800 dark:text-gray-200">
                        {ele.room_type || "F1"}
                      </td>
                      <td className="py-4 px-3 text-center font-medium text-gray-800 dark:text-gray-200">
                        {ele.floor_number || "1"}
                      </td>
                      <td className="py-4 px-3 text-center font-medium text-gray-800 dark:text-gray-200">
                        {ele.registration_number || "1001"}
                      </td>
                      <td className="py-4 px-3 text-center font-medium text-gray-800 dark:text-gray-200">
                        {ele.block_no || "6"}
                      </td>
                      <td className="py-4 px-3 text-center font-medium text-gray-800 dark:text-gray-200">
                        {ele.parking_slot || "A-101"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        
      </div>
    </section>
  );
}

export default RoomDetailsOwner;