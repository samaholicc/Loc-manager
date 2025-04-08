import axios from "axios";
import React, { useContext, useState, useEffect } from "react";
import { HamContext } from "../HamContextProvider";
import { FaUser, FaUsers, FaBuilding, FaExclamationCircle, FaMoneyBill, FaIdCard, FaSyncAlt } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

function Dashboard(props) {
  const { hamActive, hamHandler } = useContext(HamContext);
  const [forBox, setForBox] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getBoxInfo = async () => {
    setLoading(true);
    setError(null);
    const whom = JSON.parse(window.localStorage.getItem("whom")).userType;
    const userId = JSON.parse(window.localStorage.getItem("whom")).username;

    try {
      const res = await axios.post(`http://localhost:5000/dashboard/${whom}`, { userId });
      
      const boxData = {
        admin: [
          { "Total propriétaires": res.data.totalowner || 0 },
          { "Total locataires": res.data.totaltenant || 0 },
          { "Total employés": res.data.totalemployee || 0 },
          { "Plaintes en attente": res.data.pendingcomplaints || 0 }
        ],
        owner: [
          { "Nombre d'employés": res.data.totalemployee || 0 },
          { "Nombre total de plaintes": res.data.totalcomplaint || 0 },
          { "Revenus mensuels": "€" + (res.data.monthlyrevenue || "0") }
        ],
        employee: [
          { "Nombre total de plaintes": res.data.totalcomplaint || 0 },
          { "Salaire": "€" + (res.data.salary || "0") },
          { "Heures travaillées": res.data.workhours || "0" }
        ],
        tenant: [
          { "ID locataire": res.data[0]?.tenant_id || "N/A" },
          { "Nom du locataire": res.data[0]?.name || "Inconnu" },
          { "Âge du locataire": res.data[0]?.age || "Inconnu" },
          { "Numéro de chambre": res.data[0]?.room_no || "Inconnu" }
        ]
      };

      setForBox(boxData[whom]);
    } catch (error) {
      setError("Erreur lors du chargement des données");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getBoxInfo();
  }, []);

  const getIconForKey = (key) => {
    const icons = {
      "total propriétaires": <FaUser className="text-blue-500 mr-2" />,
      "nombre d'employés": <FaUser className="text-blue-500 mr-2" />,
      "total locataires": <FaUsers className="text-green-500 mr-2" />,
      "total employés": <FaBuilding className="text-purple-500 mr-2" />,
      "nombre total de plaintes": <FaExclamationCircle className="text-red-500 mr-2" />,
      "salaire": <FaMoneyBill className="text-yellow-500 mr-2" />,
      "id locataire": <FaIdCard className="text-teal-500 mr-2" />,
      "plaintes en attente": <FaExclamationCircle className="text-orange-500 mr-2" />,
      "revenus mensuels": <FaMoneyBill className="text-green-500 mr-2" />,
      "heures travaillées": <FaBuilding className="text-indigo-500 mr-2" />
    };
    return icons[key.toLowerCase()] || null;
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    hover: { scale: 1.03, transition: { duration: 0.2 } }
  };

  return (
    <div
      onClick={() => hamActive && hamHandler()}
      style={{
        filter: hamActive ? "blur(2px)" : "blur(0px)",
        background: "linear-gradient(to bottom right, #f0f4f8, #e0e7ff)",
        minHeight: "100vh",
      }}
      className="w-screen relative"
    >
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Tableau de Bord</h1>
          <motion.button
            whileHover={{ rotate: 180 }}
            whileTap={{ scale: 0.95 }}
            onClick={getBoxInfo}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
          >
            <FaSyncAlt size={20} />
          </motion.button>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="inline-block"
            >
              <FaSyncAlt size={30} className="text-blue-500" />
            </motion.div>
            <p className="mt-2 text-gray-600">Chargement...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-500">{error}</div>
        ) : (
          <AnimatePresence>
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.1 } }
              }}
            >
              {forBox?.map((ele, index) => {
                const key = Object.keys(ele)[0];
                const value = Object.values(ele)[0];
                return (
                  <motion.div
                    key={index}
                    variants={cardVariants}
                    whileHover="hover"
                    className="p-6 bg-white rounded-xl shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center">
                      {getIconForKey(key)}
                      <div>
                        <h1 className="font-bold text-3xl text-gray-800">{value}</h1>
                        <p className="font-semibold text-sm text-gray-600 capitalize">{key}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-white rounded-xl shadow-lg p-8"
        >
          <h1 className="text-center font-bold text-3xl text-gray-800 mb-6">
            Règles et Régulations de l'Appartement
          </h1>
          <ol className="list-decimal px-6 py-4 space-y-3 text-gray-700">
            {[
              "Les résidents sont encouragés à entretenir les lieux avec soin et à signaler toute anomalie rapidement.",
              "Le respect de la vie privée des voisins et la jouissance paisible de leur espace sont essentiels.",
              "Le paiement des loyers doit être effectué à la date spécifiée afin de garantir un environnement harmonieux pour tous.",
              "Toute modification de l'appartement nécessite l'approbation écrite de l'administration.",
              "Les résidents doivent avoir une couverture d'assurance adéquate pour leurs effets personnels.",
              "Les dépôts de garantie seront remboursés rapidement après vérification que l'appartement est exempt de dommages lors du départ.",
              "Les résidents sont responsables de ne pas manipuler les systèmes de chauffage, d'éclairage ou d'autres installations du bâtiment.",
              "Le stationnement est limité aux zones désignées délimitées par des lignes jaunes pour la commodité de tous les résidents.",
              "Les articles sanitaires doivent être jetés correctement, emballés et placés avec les autres déchets.",
              "Les résidents sont responsables de sécuriser les fenêtres en cas de mauvais temps pour leur sécurité.",
              "La sécurité des femmes est une priorité, et des mesures sont mises en place pour garantir un environnement de vie sûr et confortable pour toutes.",
              "L'administration s'engage à favoriser une atmosphère de maison loin de chez soi, en priorisant le bien-être et la satisfaction de tous les résidents."
            ].map((rule, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="leading-relaxed hover:text-blue-600 transition-colors"
              >
                {rule}
              </motion.li>
            ))}
          </ol>
        </motion.div>
      </div>
    </div>
  );
}

export default Dashboard;