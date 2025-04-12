import axios from "axios";
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useTheme } from "../context/ThemeContext"; // Import ThemeContext

function CreatingParkingSlot() {
  const { darkMode } = useTheme(); // Access darkMode state
  const [roomNo, setRoomNo] = useState("");
  const [slotNo, setSlotNo] = useState("");
  const [occupiedRooms, setOccupiedRooms] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);

  useEffect(() => {
    const fetchOccupiedRooms = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_SERVER}/occupied-rooms`);
        console.log("Occupied rooms response:", res.data);
        if (res.status === 200) {
          const rooms = Array.isArray(res.data) ? res.data : [];
          setOccupiedRooms(rooms);
        } else {
          toast.error("Erreur lors de la récupération des chambres occupées");
          setOccupiedRooms([]);
        }
      } catch (error) {
        console.error("Error fetching occupied rooms:", error);
        toast.error("Erreur lors de la récupération des chambres occupées");
        setOccupiedRooms([]);
      }
    };

    const fetchAvailableSlots = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_SERVER}/available-parking-slots`);
        console.log("Available slots response:", res.data);
        if (res.status === 200) {
          const slots = Array.isArray(res.data) ? res.data : [];
          setAvailableSlots(slots);
        } else {
          toast.error("Erreur lors de la récupération des places de parking disponibles");
          setAvailableSlots([]);
        }
      } catch (error) {
        console.error("Error fetching available parking slots:", error);
        toast.error("Erreur lors de la récupération des places de parking disponibles");
        setAvailableSlots([]);
      }
    };

    fetchOccupiedRooms();
    fetchAvailableSlots();
  }, []);

  const createSlot = async () => {
    if (!roomNo || !slotNo) {
      toast.error("Veuillez sélectionner une chambre et une place de parking");
      return;
    }

    try {
      const res = await axios.post(`${process.env.REACT_APP_SERVER}/bookslot`, {
        roomNo: roomNo,
        slotNo: slotNo,
      });
      if (res.status === 200) {
        setRoomNo("");
        setSlotNo("");
        toast.success("Place de parking attribuée");
        const slotRes = await axios.get(`${process.env.REACT_APP_SERVER}/available-parking-slots`);
        const slots = Array.isArray(slotRes.data) ? slotRes.data : [];
        setAvailableSlots(slots);
      }
    } catch (error) {
      console.error("Error booking slot:", error);
      toast.error(error.message);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createSlot();
  };

  return (
    <div
      className={`flex items-center justify-center h-screen w-screen transition-all duration-300 ${
        darkMode ? "bg-gray-900" : "bg-gray-100"
      }`}
    >
      <div className="container mx-auto">
        <div
          className={`max-w-md mx-auto my-5 p-5 rounded-lg shadow-md transition-all duration-300 ${
            darkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <div className="m-7">
            <form onSubmit={handleSubmit} action="" method="POST" id="form">
              <div>
                <h1
                  className={`text-center font-bold my-2 ${
                    darkMode ? "text-gray-200" : "text-gray-600"
                  }`}
                >
                  Place de parking
                </h1>
              </div>
              <div className="mb-6">
                <label
                  htmlFor="roomNo"
                  className={`block mb-2 text-base ${
                    darkMode ? "text-gray-200" : "text-gray-600"
                  }`}
                >
                  Numéro de chambre
                </label>
                <select
                  id="roomNo"
                  value={roomNo}
                  onChange={(e) => setRoomNo(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-indigo-100 focus:border-indigo-300 transition-all duration-300 ${
                    darkMode
                      ? "bg-gray-700 text-gray-200 border-gray-600"
                      : "bg-[#eeeff1] text-gray-800 border-gray-300"
                  }`}
                  required
                >
                  <option value="">Sélectionnez une chambre occupée</option>
                  {occupiedRooms.length > 0 ? (
                    occupiedRooms.map((room) => (
                      <option key={room} value={room}>
                        {room}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      Aucune chambre occupée disponible
                    </option>
                  )}
                </select>
              </div>

              <div className="mb-6">
                <label
                  htmlFor="slotNo"
                  className={`text-base mb-2 block ${
                    darkMode ? "text-gray-200" : "text-gray-600"
                  }`}
                >
                  Numéro de parking
                </label>
                <select
                  id="slotNo"
                  value={slotNo}
                  onChange={(e) => setSlotNo(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-indigo-100 focus:border-indigo-300 transition-all duration-300 ${
                    darkMode
                      ? "bg-gray-700 text-gray-200 border-gray-600"
                      : "bg-[#eeeff1] text-gray-800 border-gray-300"
                  }`}
                  required
                >
                  <option value="">Sélectionnez une place de parking disponible</option>
                  {availableSlots.length > 0 ? (
                    availableSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      Aucune place de parking disponible
                    </option>
                  )}
                </select>
              </div>

              <div className="mb-6">
                <button
                  type="submit"
                  className={`w-full px-3 py-3 rounded-md focus:outline-none transition-all duration-300 border-2 ${
                    darkMode
                      ? "bg-blue-600 text-white hover:bg-gray-800 hover:text-blue-400 hover:border-blue-400"
                      : "bg-blue-500 text-white hover:bg-white hover:text-blue-500 hover:border-blue-500 border-transparent"
                  }`}
                >
                  Réserver une place
                </button>
              </div>
              <p
                className={`text-base text-center ${
                  darkMode ? "text-gray-400" : "text-gray-400"
                }`}
                id="result"
              ></p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreatingParkingSlot;