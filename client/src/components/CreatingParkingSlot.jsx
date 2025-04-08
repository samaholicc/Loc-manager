import axios from "axios";
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

function CreatingParkingSlot() {
  const [roomNo, setRoomNo] = useState("");
  const [slotNo, setSlotNo] = useState("");
  const [occupiedRooms, setOccupiedRooms] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);

  // Fetch occupied rooms and available parking slots on component mount
  useEffect(() => {
    const fetchOccupiedRooms = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_SERVER}/occupied-rooms`);
        console.log("Occupied rooms response:", res.data); // Debug log
        if (res.status === 200) {
          // Ensure the response data is an array
          const rooms = Array.isArray(res.data) ? res.data : [];
          setOccupiedRooms(rooms);
        } else {
          toast.error("Erreur lors de la récupération des chambres occupées");
          setOccupiedRooms([]);
        }
      } catch (error) {
        console.error("Error fetching occupied rooms:", error);
        toast.error("Erreur lors de la récupération des chambres occupées");
        setOccupiedRooms([]); // Fallback to empty array on error
      }
    };

    const fetchAvailableSlots = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_SERVER}/available-parking-slots`);
        console.log("Available slots response:", res.data); // Debug log
        if (res.status === 200) {
          // Ensure the response data is an array
          const slots = Array.isArray(res.data) ? res.data : [];
          setAvailableSlots(slots);
        } else {
          toast.error("Erreur lors de la récupération des places de parking disponibles");
          setAvailableSlots([]);
        }
      } catch (error) {
        console.error("Error fetching available parking slots:", error);
        toast.error("Erreur lors de la récupération des places de parking disponibles");
        setAvailableSlots([]); // Fallback to empty array on error
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
        // Refresh available slots after booking
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
    <div className="flex items-center justify-center h-screen w-screen bg-gray-100">
      <div className="container mx-auto">
        <div className="max-w-md mx-auto my-5 p-5 bg-white rounded-lg shadow-md">
          <div className="m-7">
            <form onSubmit={handleSubmit} action="" method="POST" id="form">
              <div>
                <h1 className="text-center font-bold text-gray-600 my-2">
                  Place de parking
                </h1>
              </div>
              <div className="mb-6">
                <label
                  htmlFor="roomNo"
                  className="block mb-2 text-base text-gray-600"
                >
                  Numéro de chambre
                </label>
                <select
                  id="roomNo"
                  value={roomNo}
                  onChange={(e) => setRoomNo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100 focus:border-indigo-300 bg-[#eeeff1]"
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
                  className="text-base mb-2 block text-gray-600"
                >
                  Numéro de parking
                </label>
                <select
                  id="slotNo"
                  value={slotNo}
                  onChange={(e) => setSlotNo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100 focus:border-indigo-300 bg-[#eeeff1]"
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
                  className="w-full px-3 py-3 text-white bg-blue-500 rounded-md focus:bg-blue-600 focus:outline-none hover:bg-white hover:text-blue-500 transition-all duration-300 hover:border-blue-500 border-transparent border-2"
                >
                  Réserver une place
                </button>
              </div>
              <p className="text-base text-center text-gray-400" id="result"></p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreatingParkingSlot;