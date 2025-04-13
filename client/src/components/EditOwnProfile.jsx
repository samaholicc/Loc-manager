import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";
import { FaUser, FaEnvelope, FaLock, FaHome, FaPhone, FaCalendarAlt, FaSignOutAlt } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import Particle from "./Particle"; // Import the Particle component


// Reusable Input Component
const InputField = ({ label, error, icon: Icon, ...props }) => (
  <div className="mb-3">
    <label
      className={`flex items-center text-sm font-medium mb-1 ${
        props.darkMode ? "text-gray-200" : "text-gray-700"
      }`}
    >
      {Icon && <Icon className={props.darkMode ? "mr-2 text-gray-400" : "mr-2 text-gray-500"} />}
      {label}
    </label>
    <input
      className={`w-full px-3 py-2 rounded-lg border shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 transition-all duration-200 ease-in-out ${
        error ? "border-red-500" : "border-gray-300"
      } placeholder-gray-400 transition-all duration-300 ${
        props.darkMode
          ? "bg-gray-700 text-gray-200 border-gray-600 placeholder-gray-500"
          : "bg-gray-50 text-gray-800 border-gray-300 placeholder-gray-400"
      } ${props.disabled ? (props.darkMode ? "bg-gray-600 cursor-not-allowed" : "bg-gray-100 cursor-not-allowed") : ""}`}
      {...props}
      aria-label={label}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

// Reusable Select Component
const SelectField = ({ label, error, icon: Icon, children, ...props }) => (
  <div className="mb-3">
    <label
      className={`flex items-center text-sm font-medium mb-1 ${
        props.darkMode ? "text-gray-200" : "text-gray-700"
      }`}
    >
      {Icon && <Icon className={props.darkMode ? "mr-2 text-gray-400" : "mr-2 text-gray-500"} />}
      {label}
    </label>
    <select
      className={`w-full px-3 py-2 rounded-lg border shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 transition-all duration-200 ease-in-out appearance-none ${
        error ? "border-red-500" : "border-gray-300"
      } transition-all duration-300 ${
        props.darkMode
          ? "bg-gray-700 text-gray-200 border-gray-600"
          : "bg-gray-50 text-gray-800 border-gray-300"
      }`}
      {...props}
      aria-label={label}
    >
      {children}
    </select>
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

function EditOwnProfile() {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    block_no: "",
    email: "",
    phone: "",
    password: "",
    confirmPass: "",
    room_no: "",
    age: "",
    dob: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [availableBlocks, setAvailableBlocks] = useState([]);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  // Get userType and userId from localStorage
  const whom = JSON.parse(window.localStorage.getItem("whom"));
  const userType = whom?.userType;
  const userId = whom?.username;

  // Debounce toast notifications to prevent multiple toasts
  const debounceToast = useCallback((message, type = "error", options = {}) => {
    const toastId = message;
    if (!toast.isActive(toastId)) {
      toast[type](message, { ...options, toastId });
    }
  }, []);

  const fetchUserData = useCallback(async () => {
    if (!whom || !userType || !userId) {
      debounceToast("Utilisateur non connecté. Veuillez vous connecter.");
      navigate("/login");
      return;
    }

    const validUserTypes = ["admin", "owner", "tenant", "employee"];
    if (!validUserTypes.includes(userType)) {
      debounceToast("Type d'utilisateur invalide.");
      navigate("/login");
      return;
    }

    try {
      let endpoint;
      let requestBody;

      if (userType === "admin") {
        endpoint = "/block_admin";
        requestBody = { admin_id: parseInt(userId.substring(2)) };
      } else if (userType === "employee") {
        endpoint = "/dashboard/employee";
        requestBody = { userId }; // Send the full userId (e.g., "e-701")
      } else {
        endpoint = `/dashboard/${userType}`;
        requestBody = { userId }; // Use userId directly
      }

      console.log("Fetching user data with endpoint:", endpoint, "and body:", requestBody);

      const response = await axios.post(`${process.env.REACT_APP_SERVER}${endpoint}`, requestBody);
      console.log("User data response:", response.data);

      const userData = userType === "admin" ? response.data : response.data[0] || response.data.owner || response.data;
      if (!userData) {
        throw new Error("Utilisateur non trouvé.");
      }

      setFormData({
        name: userData.name || userData.admin_name || userData.emp_name || "",
        block_no: userData.block_no || "",
        email: userData.email || "",
        phone: userData.phone || "",
        password: "",
        confirmPass: "",
        room_no: userData.room_no || "",
        age: userData.age || "",
        dob: userData.dob || "",
      });
      setIsEmailVerified(!!userData.is_email_verified);
      console.log("isEmailVerified set to:", !!userData.is_email_verified);
    } catch (error) {
      console.error("Erreur lors de la récupération des données:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      debounceToast("Erreur lors de la récupération des données : " + (error.response?.data?.error || error.message));
    }
  }, [whom, userType, userId, navigate, debounceToast]);

  useEffect(() => {
    if (!hasFetched) {
      fetchUserData();
      setHasFetched(true);
    }

    const fetchNotifications = async () => {
      try {
        const notificationsRes = await axios.post(`${process.env.REACT_APP_SERVER}/notifications`, {
          userId,
          userType,
        });
        console.log("Notifications response:", notificationsRes.data);
        setNotifications(notificationsRes.data);
      } catch (error) {
        console.error("Error fetching notifications:", error.response?.data || error.message);
        setNotifications([]);
      }
    };

    const fetchAvailableBlocks = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_SERVER}/available-blocks`);
        console.log("Available blocks response:", res.data);
        setAvailableBlocks(res.data);
      } catch (error) {
        console.error("Error fetching available blocks:", error.response?.data?.error || error.message);
        debounceToast("Erreur lors de la récupération des blocs disponibles.");
      }
    };

    fetchNotifications();
    if (userType === "admin" || userType === "employee") {
      fetchAvailableBlocks();
    }

    const handleFocus = () => {
      if (!hasFetched) {
        fetchUserData();
        setHasFetched(true);
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [navigate, userType, userId, hasFetched, fetchUserData, debounceToast]);

  const validateField = (name, value) => {
    const validators = {
      name: (v) => (v.length < 2 ? "Le nom doit contenir au moins 2 caractères" : ""),
      email: (v) => (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Veuillez entrer une adresse e-mail valide" : ""),
      phone: (v) => {
        if (!v) return "";
        const phoneRegex = /^((\+33[67])|(0[67]))\d{8}$/;
        return phoneRegex.test(v)
          ? ""
          : "Le numéro de téléphone doit commencer par +336, +337, 06, ou 07 et être suivi de 8 chiffres (ex: +33612345678 ou 0612345678).";
      },
      room_no: (v) => {
        if (userType !== "tenant") return "";
        return !v || !/^\d+$/.test(v) || parseInt(v) <= 0 ? "Le numéro de chambre doit être un entier positif" : "";
      },
      block_no: (v) => {
        if (userType !== "admin" && userType !== "employee") return "";
        return !v || !availableBlocks.some(block => block.block_no === v)
          ? "Veuillez sélectionner un numéro de bloc valide"
          : "";
      },
      age: (v) => {
        if (userType !== "tenant") return "";
        return !v || !/^\d+$/.test(v) || parseInt(v) <= 0 ? "L'âge doit être un entier positif" : "";
      },
      dob: (v) => {
        if (userType !== "tenant") return "";
        const dobDate = new Date(v);
        const today = new Date();
        return !v || isNaN(dobDate.getTime()) || dobDate >= today
          ? "La date de naissance doit être une date valide dans le passé"
          : "";
      },
      password: (v) => (v && v.length < 6 ? "Le mot de passe doit contenir au moins 6 caractères" : ""),
      confirmPass: (v) => (v !== formData.password ? "Les mots de passe ne correspondent pas" : ""),
    };
    return validators[name] ? validators[name](value) : "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));

    if (name === "dob" && value && userType === "tenant") {
      const birthDate = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      if (today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())) age--;
      setFormData((prev) => ({ ...prev, age: age.toString() }));
      setErrors((prev) => ({ ...prev, age: validateField("age", age) }));
    }
  };

  const validateForm = () => {
    const newErrors = Object.keys(formData).reduce((acc, key) => {
      const error = validateField(key, formData[key]);
      if (error) acc[key] = error;
      return acc;
    }, {});

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      debounceToast("Veuillez corriger les erreurs avant de soumettre.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await axios.put(`${process.env.REACT_APP_SERVER}/updateprofile/${userType}`, {
        userId,
        block_no: formData.block_no,
        email: formData.email,
        phone: formData.phone,
        password: formData.password || undefined,
        name: formData.name,
        room_no: formData.room_no,
        age: formData.age,
        dob: formData.dob,
      });
      debounceToast("Profil mis à jour avec succès. Vérifiez votre e-mail si vous avez modifié votre adresse.", "success");
      if (formData.email) {
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        navigate(userType === "admin" ? "/management-portal" : "/dashboard");
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      debounceToast("Erreur lors de la mise à jour du profil : " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationEmail = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_SERVER}/resend-verification`, {
        userId,
        userType,
      });
      debounceToast(response.data.message, "success");
      await fetchUserData();
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'e-mail:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      const errorMessage = error.response?.data?.error || error.message;
      if (errorMessage === "Email is already verified") {
        debounceToast("Votre e-mail est déjà vérifié.", "info");
        setIsEmailVerified(true);
        await fetchUserData();
      } else {
        debounceToast("Erreur lors de l'envoi de l'e-mail : " + errorMessage);
      }
    }
  };

  const handleLogout = async () => {
    try {
      // Attempt to call the logout endpoint
      await axios.post(`${process.env.REACT_APP_SERVER}/logout`, { userId });
    } catch (error) {
      console.warn("Logout endpoint failed:", error.response?.data?.error || error.message);
      // Proceed with client-side logout if endpoint fails
    } finally {
      // Clear localStorage and navigate to login
      window.localStorage.removeItem("whom");
      debounceToast("Déconnexion réussie", "success");
      navigate("/login");
    }
  };

  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center transition-all duration-300 relative ${
        darkMode ? "bg-gray-900" : "bg-gray-100 " 
      }`}
    > 
      <Particle />
      <div className="relative z-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`container mx-auto max-w-md p-6 pb-2 rounded-2xl shadow-xl my-8 border transition-all duration-300 ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
        }`}
      >
        <h1
          className={`text-2xl font-bold mb-6 text-center tracking-tight ${
            darkMode ? "text-gray-200" : "text-gray-800"
          }`}
        >
          Modifier le Profil
        </h1>
        <form onSubmit={handleSubmit} className="m-0 p-0">
          {/* Personal Information */}
          <section className="mb-6">
            <h2
              className={`text-lg font-semibold mb-3 border-b-2 pb-1 flex items-center ${
                darkMode ? "text-gray-200 border-indigo-700" : "text-gray-800 border-indigo-100"
              }`}
            >
              <FaUser className={darkMode ? "mr-2 text-indigo-400" : "mr-2 text-indigo-500"} />
              Informations Personnelles
            </h2>
            <InputField
              label="Nom complet"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Entrez votre nom complet"
              error={errors.name}
              icon={FaUser}
              disabled={userType === "admin"}
              darkMode={darkMode}
            />
            {userType === "tenant" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Date de naissance"
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  error={errors.dob}
                  icon={FaCalendarAlt}
                  darkMode={darkMode}
                />
                <InputField
                  label="Âge"
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="Âge"
                  error={errors.age}
                  disabled
                  icon={FaCalendarAlt}
                  darkMode={darkMode}
                />
              </div>
            )}
          </section>

          {/* Contact Information */}
          <section className="mb-6">
            <h2
              className={`text-lg font-semibold mb-3 border-b-2 pb-1 flex items-center ${
                darkMode ? "text-gray-200 border-indigo-700" : "text-gray-800 border-indigo-100"
              }`}
            >
              <FaEnvelope className={darkMode ? "mr-2 text-indigo-400" : "mr-2 text-indigo-500"} />
              Informations de Contact
            </h2>
            <InputField
              label="Adresse e-mail"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Entrez votre adresse e-mail"
              error={errors.email}
              icon={FaEnvelope}
              darkMode={darkMode}
            />
            <p className="text-sm mt-1">
              Statut de vérification :{" "}
              {isEmailVerified ? (
                <span className="text-green-500">Vérifié</span>
              ) : (
                <span className="text-red-500">Non vérifié</span>
              )}
            </p>
            {!isEmailVerified && (
              <button
                type="button"
                onClick={resendVerificationEmail}
                className="mt-1 text-sm text-blue-500 hover:underline"
                aria-label="Renvoyer l'e-mail de vérification"
              >
                Renvoyer l'e-mail de vérification
              </button>
            )}
            {userType === "admin" && (
              <InputField
                label="Numéro de téléphone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Ex: 0761551241"
                error={errors.phone}
                icon={FaPhone}
                darkMode={darkMode}
              />
            )}
          </section>

          {/* Location Details */}
          {(userType === "admin" || userType === "employee" ) && (
            <section className="mb-6">
              <h2
                className={`text-lg font-semibold mb-3 border-b-2 pb-1 flex items-center ${
                  darkMode ? "text-gray-200 border-indigo-700" : "text-gray-800 border-indigo-100"
                }`}
              >
                <FaHome className={darkMode ? "mr-2 text-indigo-400" : "mr-2 text-indigo-500"} />
                Détails de Localisation
              </h2>
              {(userType === "admin" || userType === "employee") && (
                <SelectField
                  label="Numéro de bloc"
                  name="block_no"
                  value={formData.block_no}
                  onChange={handleChange}
                  error={errors.block_no}
                  icon={FaHome}
                  darkMode={darkMode}
                >
                  <option value="">Sélectionnez un bloc</option>
                  {availableBlocks.map((block) => (
                    <option key={block.block_no} value={block.block_no}>
                      {block.block_name} (Bloc {block.block_no})
                    </option>
                  ))}
                </SelectField>
              )}
              
            </section>
          )}

          {/* Security */}
          <section className="mb-6">
            <h2
              className={`text-lg font-semibold mb-3 border-b-2 pb-1 flex items-center ${
                darkMode ? "text-gray-200 border-indigo-700" : "text-gray-800 border-indigo-100"
              }`}
            >
              <FaLock className={darkMode ? "mr-2 text-indigo-400" : "mr-2 text-indigo-500"} />
              Sécurité
            </h2>
            <InputField
              label="Nouveau mot de passe (laisser vide pour ne pas changer)"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Entrez votre nouveau mot de passe"
              error={errors.password}
              icon={FaLock}
              darkMode={darkMode}
            />
            <InputField
              label="Confirmer le mot de passe"
              type="password"
              name="confirmPass"
              value={formData.confirmPass}
              onChange={handleChange}
              placeholder="Confirmez votre mot de passe"
              error={errors.confirmPass}
              icon={FaLock}
              darkMode={darkMode}
            />
          </section>

          {/* Actions */}
          <div className="flex justify-center gap-3 mb-0 buttons-container">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={loading}
              className={`px-6 py-2 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${
                darkMode
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
              aria-label="Enregistrer les modifications"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4 mr-2 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <FaUser className="mr-2" />
              )}
              {loading ? "Enregistrement..." : "Enregistrer"}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={handleLogout}
              className={`px-6 py-2 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center ${
                darkMode
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-red-500 text-white hover:bg-red-600"
              }`}
              aria-label="Déconnexion"
            >
              <FaSignOutAlt className="mr-2" />
              Déconnexion
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
    </div>
  );
}

export default EditOwnProfile;