import React, { useEffect, useState } from "react";
import axios from "axios";

function RoomDetails(props) {
  const roomDetailsHeader = [
    "Identifiant du locataire",
    "Nom",
    "Âge",
    "Date de naissance",
    "Statut",
    "Numéro de chambre",
  ];

  const [roomRows, setRoomRows] = useState([]);

  const getRoomDetails = async (userId) => {
    try {
      const res = await axios.post(`${process.env.REACT_APP_SERVER}/ownertenantdetails`, {
        userId,
      });
      console.log("Response data:", res.data);
      setRoomRows(res.data);
    } catch (error) {
      console.error("Error fetching tenant details:", error.response ? error.response.data : error.message);
    }
  };

  useEffect(() => {
    const userId = JSON.parse(window.localStorage.getItem("whom"))?.username;
    console.log("userId:", userId);
    if (!userId) {
      console.error("No userId found in localStorage");
      return; // Early return inside useEffect is fine
    }
    getRoomDetails(userId);
  }, []);

  // If there's no userId, you can return a message or redirect
  const userId = JSON.parse(window.localStorage.getItem("whom"))?.username;
  if (!userId) {
    return (
      <section className="pr-5 px-10 py-20">
        <div className="container card overflow-hidden">
          <p className="text-center text-red-500">Please log in to view tenant details.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="pr-5 px-10 py-20">
      <div className="container card overflow-hidden">
        <div className="flex flex-wrap -mx-4">
          <div className="w-full px-4">
            <div className="max-w-full overflow-x-auto">
              <table className="table-auto w-full">
                <thead>
                  <tr className="bg-blue-500 text-center">
                    {roomDetailsHeader.map((ele, index) => (
                      <th
                        key={index + 1}
                        className="
                          w-1/6
                          min-w-[160px]
                          text-lg
                          font-semibold
                          text-white
                          py-4
                          lg:py-7       
                          px-3
                          lg:px-4
                          border-l border-transparent
                        "
                      >
                        {ele}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {roomRows.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-5">
                        No tenants found.
                      </td>
                    </tr>
                  ) : (
                    roomRows.map((ele, index) => (
                      <tr key={index + 1}>
                        <td
                          className="
                            text-center text-dark
                            font-medium
                            text-base
                            py-5
                            px-2
                            bg-[#F3F6FF]
                            border-b border-l border-[#E8E8E8]
                          "
                        >
                          {`t-${ele.tenant_id}`}
                        </td>
                        <td
                          className="
                            text-center text-dark
                            font-medium
                            text-base
                            py-5
                            px-2
                            bg-[#F3F6FF]
                            border-b border-l border-[#E8E8E8]
                          "
                        >
                          {ele.name}
                        </td>
                        <td
                          className="
                            text-center text-dark
                            font-medium
                            text-base
                            py-5
                            px-2
                            bg-[#F3F6FF]
                            border-b border-l border-[#E8E8E8]
                          "
                        >
                          {ele.age}
                        </td>
                        <td
                          className="
                            text-center text-dark
                            font-medium
                            text-base
                            py-5
                            px-2
                            bg-[#F3F6FF]
                            border-b border-l border-[#E8E8E8]
                          "
                        >
                          {ele.dob}
                        </td>
                        <td
                          className="
                            text-center text-dark
                            font-medium
                            text-base
                            py-5
                            px-2
                            bg-[#F3F6FF]
                            border-b border-l border-[#E8E8E8]
                          "
                        >
                          {ele.stat}
                        </td>
                        <td
                          className="
                            text-center text-dark
                            font-medium
                            text-base
                            py-5
                            px-2
                            bg-[#F3F6FF]
                            border-b border-l border-[#E8E8E8]
                          "
                        >
                          {ele.room_no}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default RoomDetails;