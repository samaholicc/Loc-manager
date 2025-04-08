import React, { useState, useEffect } from "react";
import { FaSun, FaMoon, FaBell, FaSyncAlt, FaCheck } from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

function EditProfile() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    block_no: "",
    email: "",
    phone: "",
    password: "",
    room_no: "",
    age: "",
    dob: "",
  });
  const [loading, setLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [userType, setUserType] = useState("");
  const [availableBlocks, setAvailableBlocks] = useState([]); // State to store available blocks

  useEffect(() => {
    const userTypeFromStorage = JSON.parse(window.localStorage.getItem("whom"))?.userType;
    const userId = JSON.parse(window.localStorage.getItem("whom"))?.username;
    const adminId = JSON.parse(window.localStorage.getItem("whom"))?.adminId;

    if (!userTypeFromStorage || !userId) {
      toast.error("Veuillez vous connecter pour modifier votre profil.");
      navigate("/login");
      return;
    }

    setUserType(userTypeFromStorage);

    const fetchUserData = async () => {
      try {
        if (userTypeFromStorage === "admin") {
          const res = await axios.post(`${process.env.REACT_APP_SERVER}/block_admin`, { admin_id: adminId });
          if (res.data) {
            setFormData({
              name: res.data.admin_name || "",
              block_no: res.data.block_no || "",
              email: res.data.email || "",
              phone: res.data.phone || "",
              password: "",
              room_no: "",
              age: "",
              dob: "",
            });
          }
        } else if (userTypeFromStorage === "tenant") {
          const res = await axios.post(`${process.env.REACT_APP_SERVER}/dashboard/tenant`, { userId });
          if (res.data && res.data.length > 0) {
            setFormData({
              name: res.data[0].name || "",
              block_no: "",
              email: "",
              phone: "",
              password: "",
              room_no: res.data[0].room_no || "",
              age: res.data[0].age || "",
              dob: res.data[0].dob || "",
            });
          }
        } else if (userTypeFromStorage === "owner") {
          const res = await axios.post(`${process.env.REACT_APP_SERVER}/dashboard/owner`, { userId });
          if (res.data && res.data.owner) {
            setFormData({
              name: res.data.owner.name || "",
              block_no: "",
              email: "",
              phone: "",
              password: "",
              room_no: res.data.owner.room_no || "",
              age: "",
              dob: "",
            });
          }
        } else if (userTypeFromStorage === "employee") {
          const res = await axios.post(`${process.env.REACT_APP_SERVER}/dashboard/employee`, { userId });
          if (res.data) {
            setFormData({
              name: res.data.name || "",
              block_no: "",
              email: "",
              phone: "",
              password: "",
              room_no: "",
              age: "",
              dob: "",
            });
          }
        }
      } catch (error) {
        toast.error("Erreur lors de la récupération des données : " + (error.response?.data?.error || error.message));
      }
    };

    const fetchNotifications = async () => {
      try {
        const notificationsRes = await axios.post(`${process.env.REACT_APP_SERVER}/notifications`, {
          userId,
          userType: userTypeFromStorage,
        });
        setNotifications(notificationsRes.data);
      } catch (error) {
        console.error("Error fetching notifications:", error.response?.data || error.message);
        setNotifications([]);
      }
    };

    const fetchAvailableBlocks = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_SERVER}/available-blocks`);
        setAvailableBlocks(res.data);
      } catch (error) {
        console.error("Error fetching available blocks:", error.response?.data?.error || error.message);
        toast.error("Erreur lors de la récupération des blocs disponibles.");
      }
    };

    fetchUserData();
    fetchNotifications();
    if (userTypeFromStorage === "admin") {
      fetchAvailableBlocks();
    }
  }, [navigate]);

  const validateForm = () => {
    if (userType === "admin") {
      // Validate block_no: should be one of the available blocks
      if (!formData.block_no || !availableBlocks.some(block => block.block_no === parseInt(formData.block_no))) {
        toast.error("Veuillez sélectionner un numéro de bloc valide.");
        return false;
      }

      // Validate email: should be a valid email format (if provided)
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        toast.error("Veuillez entrer une adresse e-mail valide.");
        return false;
      }

      // Validate phone: should match +336/+337 or 06/07 followed by 8 digits (if provided)
      if (formData.phone) {
        const phoneRegex = /^((\+33[67])|(0[67]))\d{8}$/;
        if (!phoneRegex.test(formData.phone)) {
          toast.error("Le numéro de téléphone doit commencer par +336, +337, 06, ou 07 et être suivi de 8 chiffres (ex: +33612345678 ou 0612345678).");
          return false;
        }
      }
    } else if (userType === "tenant") {
      // Validate room_no: should be a positive integer
      if (!formData.room_no || !/^\d+$/.test(formData.room_no) || parseInt(formData.room_no) <= 0) {
        toast.error("Le numéro de chambre doit être un entier positif.");
        return false;
      }

      // Validate age: should be a positive integer (if provided)
      if (formData.age && (!/^\d+$/.test(formData.age) || parseInt(formData.age) <= 0)) {
        toast.error("L'âge doit être un entier positif.");
        return false;
      }

      // Validate dob: should be a valid date in the past (if provided)
      if (formData.dob) {
        const dobDate = new Date(formData.dob);
        const today = new Date();
        if (isNaN(dobDate.getTime()) || dobDate >= today) {
          toast.error("La date de naissance doit être une date valide dans le passé.");
          return false;
        }
      }
    }

    // Validate password: should be at least 6 characters (if provided)
    if (formData.password && formData.password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate the form before submitting
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const userId = JSON.parse(window.localStorage.getItem("whom"))?.username;
      await axios.put(`${process.env.REACT_APP_SERVER}/updateprofile/${userType}`, {
        userId,
        block_no: formData.block_no,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        name: formData.name,
        room_no: formData.room_no,
        age: formData.age,
        dob: formData.dob,
      });
      toast.success("Profil mis à jour avec succès");
      navigate(`/${userType}`);
    } catch (error) {
      toast.error("Erreur lors de la mise à jour du profil : " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const markNotificationAsRead = (index) => {
    setNotifications(notifications.filter((_, i) => i !== index));
  };

  return (
    <div
      className={`min-h-screen w-full transition-all duration-300 flex flex-row ${
        darkMode ? "bg-gray-900 text-gray-200" : "bg-gradient-to-br from-blue-50 to-gray-100 text-gray-800"
      }`}
    >
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navigation Bar */}
        <div className="flex justify-between items-center p-4 md:p-6">
          <h1 className="text-2xl font-bold">Modifier le Profil</h1>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => navigate(`/${userType}`)}
              className={`flex items-center gap-1 px-3 py-1 rounded-md transition-all duration-300 text-sm ${
                darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
              aria-label="Retour au tableau de bord"
            >
              <FaSyncAlt className={loading ? "animate-spin" : ""} />
              Retour
            </button>
            <div className="relative">
              <button
                onClick={toggleNotifications}
                className={`p-1 rounded-full transition-all duration-300 relative ${
                  darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                }`}
                aria-label="Notifications"
              >
                <FaBell size={16} />
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg p-3 z-10 ${
                    darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"
                  }`}
                >
                  <h3 className="text-sm font-semibold mb-1">Notifications</h3>
                  {notifications.length === 0 ? (
                    <p className="text-xs text-gray-500">Aucune notification.</p>
                  ) : (
                    notifications.map((notif, index) => (
                      <div key={index} className="text-xs mb-1 flex justify-between items-center">
                        <div>
                          <p>{notif.message}</p>
                          <p className="text-xs text-gray-400">{new Date(notif.date).toLocaleString()}</p>
                        </div>
                        <button
                          onClick={() => markNotificationAsRead(index)}
                          className="text-green-500 hover:text-green-700"
                          aria-label="Marquer comme lu"
                        >
                          <FaCheck size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </motion.div>
              )}
            </div>
            <button
              onClick={toggleDarkMode}
              className={`p-1 rounded-full transition-all duration-300 ${
                darkMode ? "bg-yellow-400 text-gray-900 hover:bg-yellow-500" : "bg-gray-300 text-gray-700 hover:bg-gray-400"
              }`}
              aria-label={darkMode ? "Passer au mode clair" : "Passer au mode sombre"}
            >
              {darkMode ? <FaSun size={16} /> : <FaMoon size={16} />}
            </button>
            <button
              onClick={() => {
                window.localStorage.removeItem("whom");
                navigate("/login");
                toast.success("Déconnexion réussie.");
              }}
              className={`px-3 py-1 rounded-md text-sm transition-all duration-300 ${
                darkMode ? "bg-red-600 text-white hover:bg-red-700" : "bg-red-500 text-white hover:bg-red-600"
              }`}
            >
              Déconnexion
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 p-4 md:p-6">
          <div className="max-w-md mx-auto">
            <form
              onSubmit={handleSubmit}
              className={`p-6 rounded-lg shadow-lg ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <h2 className="text-xl font-bold mb-4">Modifier les Informations</h2>
              {/* Name field for all user types, disabled for admins */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Nom</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full p-2 border rounded text-sm ${
                    userType === "admin"
                      ? darkMode
                        ? "bg-gray-600 text-gray-200 border-gray-500 cursor-not-allowed"
                        : "bg-gray-100 text-gray-800 border-gray-300 cursor-not-allowed"
                      : darkMode
                      ? "bg-gray-700 text-gray-200 border-gray-600"
                      : "bg-white text-gray-800 border-gray-300"
                  }`}
                  disabled={userType === "admin"}
                  required
                />
              </div>
              {/* Admin-specific fields */}
              {userType === "admin" && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Numéro de bloc</label>
                    <select
                      value={formData.block_no}
                      onChange={(e) => setFormData({ ...formData, block_no: e.target.value })}
                      className={`w-full p-2 border rounded text-sm ${
                        darkMode ? "bg-gray-700 text-gray-200 border-gray-600" : "bg-white text-gray-800 border-gray-300"
                      }`}
                      required
                    >
                      <option value="">Sélectionnez un bloc</option>
                      {availableBlocks.map((block) => (
                        <option key={block.block_no} value={block.block_no}>
                          {block.block_name} (Bloc {block.block_no})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Adresse e-mail</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full p-2 border rounded text-sm ${
                        darkMode ? "bg-gray-700 text-gray-200 border-gray-600" : "bg-white text-gray-800 border-gray-300"
                      }`}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Numéro de téléphone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Ex: +33612345678 ou 0612345678"
                      className={`w-full p-2 border rounded text-sm ${
                        darkMode ? "bg-gray-700 text-gray-200 border-gray-600" : "bg-white text-gray-800 border-gray-300"
                      }`}
                    />
                  </div>
                </>
              )}
              {/* Tenant-specific fields */}
              {userType === "tenant" && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Numéro de chambre</label>
                    <input
                      type="text"
                      value={formData.room_no}
                      onChange={(e) => setFormData({ ...formData, room_no: e.target.value })}
                      className={`w-full p-2 border rounded text-sm ${
                        darkMode ? "bg-gray-700 text-gray-200 border-gray-600" : "bg-white text-gray-800 border-gray-300"
                      }`}
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Âge</label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      className={`w-full p-2 border rounded text-sm ${
                        darkMode ? "bg-gray-700 text-gray-200 border-gray-600" : "bg-white text-gray-800 border-gray-300"
                      }`}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Date de naissance</label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      className={`w-full p-2 border rounded text-sm ${
                        darkMode ? "bg-gray-700 text-gray-200 border-gray-600" : "bg-white text-gray-800 border-gray-300"
                      }`}
                    />
                  </div>
                </>
              )}
              {/* Owner and Employee have only name field (already included above) */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Nouveau mot de passe (laisser vide pour ne pas changer)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`w-full p-2 border rounded text-sm ${
                    darkMode ? "bg-gray-700 text-gray-200 border-gray-600" : "bg-white text-gray-800 border-gray-300"
                  }`}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full p-2 rounded text-sm transition-all duration-300 ${
                  loading
                    ? "bg-gray-500 cursor-not-allowed"
                    : darkMode
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                {loading ? "Enregistrement..." : "Enregistrer"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditProfile;