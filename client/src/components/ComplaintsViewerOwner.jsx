import React, { useEffect, useState } from "react";
import axios from "axios";
import { MdDeleteForever } from "react-icons/md";
import { toast } from "react-toastify";
import { useTheme } from "../context/ThemeContext"; // Import ThemeContext

function ComplaintsViewerOwner(props) {
  const { darkMode } = useTheme(); // Access darkMode state
  const [comps, setComps] = useState([]);

  const getComplaints = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_SERVER}/viewcomplaints`);
      setComps(res.data);
      console.log({ res });
    } catch (err) {
      console.log(err);
    }
  };

  const deleteComplaints = async (room_no) => {
    try {
      const res = await axios.post(`${process.env.REACT_APP_SERVER}/deletecomplaint`, {
        roomId: room_no,
      });
      if (res.status === 200) {
        toast.success("Supprimé avec succès");
        getComplaints();
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    getComplaints();
  }, []);

  return (
    <section
      className={`min-h-screen py-25 px-10 flex justify-center items-center ml-[1px] w-[calc(100%-1px)] transition-all duration-300 ${
        darkMode ? "bg-gray-900" : "bg-gray-100"
      }`}
    >
      <div
        className={`container rounded-xl shadow-lg overflow-hidden max-w-6xl w-full transition-all duration-300 ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        <div className="p-6">
          <h2
            className={`text-2xl font-bold mb-6 text-center ${
              darkMode ? "text-gray-200" : "text-gray-800"
            }`}
          >
            Liste des Plaintes
          </h2>
          {comps.length === 0 ? (
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
                Aucune plainte trouvée
              </h3>
              <p className={darkMode ? "mt-1 text-gray-400" : "mt-1 text-gray-500"}>
                Commencez par ajouter une nouvelle plainte.
              </p>
            </div>
          ) : (
            comps.map((ele, index) => {
              return (
                ele.complaints &&
                ele.room_no && (
                  <div
                    key={index + 1}
                    className={`border-2 my-3 p-5 flex justify-evenly rounded-lg shadow-sm transition-all duration-300 ${
                      darkMode ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    <div className="mx-3">
                      <h1
                        className={`text-center font-semibold text-lg ${
                          darkMode ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        {ele.room_no}
                      </h1>
                      <h2
                        className={`capitalize text-center text-base ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Numéro de chambre
                      </h2>
                    </div>
                    <div className="mx-3">
                      <h2
                        className={`text-center font-semibold text-lg ${
                          darkMode ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        {ele.complaints}
                      </h2>
                      <h1
                        className={`capitalize text-center text-base ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Plaintes
                      </h1>
                    </div>
                    <div className="mx-3 flex justify-center items-center text-red-500">
                      <MdDeleteForever
                        className="cursor-pointer text-2xl"
                        onClick={() => {
                          deleteComplaints(ele.room_no);
                        }}
                      />
                    </div>
                  </div>
                )
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}

export default ComplaintsViewerOwner;