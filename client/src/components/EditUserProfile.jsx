import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
    >
      {children}
    </select>
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

function EditUserProfile() {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const { userType, id } = useParams();
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
  const [fetchError, setFetchError] = useState(null); // Define setFetchError here
  const [notifications, setNotifications] = useState([]);
  const [availableBlocks, setAvailableBlocks] = useState([]);
  const [employeeId, setEmployeeId] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  // Debounce toast notifications to prevent multiple toasts
  const debounceToast = (message, type = "error", options = {}) => {
    const toastId = message;
    if (!toast.isActive(toastId)) {
      toast[type](message, { ...options, toastId });
    }
  };

  const fetchUserData = async () => {
    const whom = JSON.parse(window.localStorage.getItem("whom"));
    if (!whom || !whom.userType || !whom.username || whom.userType !== "admin") {
      debounceToast("Seuls les administrateurs peuvent modifier les profils des autres utilisateurs.");
      navigate("/login");
      return;
    }
  
    if (!userType || !id) {
      setFetchError("Paramètres d'URL manquants : type d'utilisateur ou ID non spécifié.");
      return;
    }
  
    const validUserTypes = ["admin", "owner", "tenant", "employee"];
    if (!validUserTypes.includes(userType)) {
      setFetchError("Type d'utilisateur invalide.");
      return;
    }
  
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      setFetchError("ID utilisateur invalide : doit être un nombre.");
      return;
    }
  
    try {
      const endpoint = userType === "admin" ? "/block_admin" : `/${userType}`;
      const requestBody = {
        [userType === "admin" ? "admin_id" : `${userType}_id`]: numericId,
      };
      console.log("Fetching user data with endpoint:", endpoint, "and body:", requestBody);
  
      const response = await axios.post(`${process.env.REACT_APP_SERVER}${endpoint}`, requestBody);
      console.log("Server response:", response.data);
  
      const userData = response.data;
      console.log("Processed userData:", userData);
  
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
  
      if (userType === "employee") {
        setEmployeeId(id);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des données:", error);
      console.error("Error response:", error.response?.data);
      if (error.response?.status === 404 && error.response?.data?.error) {
        // Specific error from the server (e.g., "Employee not found for emp_id: 701")
        setFetchError(error.response.data.error);
      } else if (error.response?.status === 404) {
        // Generic 404 (endpoint not found)
        setFetchError("Le service pour récupérer les données de l'utilisateur n'est pas disponible. Veuillez vérifier que le serveur est en cours d'exécution.");
      } else {
        // Other errors
        setFetchError("Erreur lors de la récupération des données : " + (error.response?.data?.error || error.message));
      }
    }
  };

  useEffect(() => {
    if (!hasFetched) {
      fetchUserData();
      setHasFetched(true);
    }

    const fetchNotifications = async () => {
      const userId = JSON.parse(window.localStorage.getItem("whom"))?.username;
      try {
        const notificationsRes = await axios.post(`${process.env.REACT_APP_SERVER}/notifications`, {
          userId,
          userType,
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
  }, [navigate, userType, id]);

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
        return !v || !availableBlocks.some(block => block.block_no === parseInt(v))
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
      const prefix = {
        admin: "a-",
        owner: "o-",
        tenant: "t-",
        employee: "e-",
      }[userType];
      const formattedUserId = `${prefix}${id}`;

      await axios.put(`${process.env.REACT_APP_SERVER}/updateprofile/${userType}`, {
        userId: formattedUserId,
        block_no: formData.block_no,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
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
        navigate("/management-portal");
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      debounceToast("Erreur lors de la mise à jour du profil : " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationEmail = async () => {
    try {
      const prefix = {
        admin: "a-",
        owner: "o-",
        tenant: "t-",
        employee: "e-",
      }[userType];
      const formattedUserId = `${prefix}${id}`;
      await axios.post(`${process.env.REACT_APP_SERVER}/resend-verification`, {
        userId: formattedUserId,
        userType,
      });
      debounceToast("E-mail de vérification renvoyé. Veuillez vérifier votre boîte de réception.", "success");
      await fetchUserData();
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'e-mail:", error);
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
      await axios.post(`${process.env.REACT_APP_SERVER}/logout`);
      window.localStorage.removeItem("whom");
      debounceToast("Déconnexion réussie", "success");
      navigate("/login");
    } catch (error) {
      debounceToast("Erreur lors de la déconnexion : " + (error.response?.data?.error || error.message));
    }
  };

  if (fetchError) {
    return (
      <div
        className={`min-h-screen w-full flex items-center justify-center transition-all duration-300 ${
          darkMode ? "bg-gray-900" : "bg-gray-100"
        }`}
      >
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
            Erreur
          </h1>
          <p className="text-red-500 text-center mb-4">{fetchError}</p>
          <div className="flex justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/management-portal")}
              className={`px-6 py-2 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center ${
                darkMode
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              Retour au Portail de Gestion
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center transition-all duration-300 ${
        darkMode ? "bg-gray-900" : "bg-gray-100"
      }`}
    > 
      <Particle />
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
          {(userType === "admin" || userType === "employee" || userType === "tenant") && (
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
              {userType === "tenant" && (
                <InputField
                  label="Numéro de chambre"
                  type="text"
                  name="room_no"
                  value={formData.room_no}
                  onChange={handleChange}
                  placeholder="Entrez le numéro de chambre"
                  error={errors.room_no}
                  icon={FaHome}
                  darkMode={darkMode}
                />
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
            >
              <FaSignOutAlt className="mr-2" />
              Déconnexion
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default EditUserProfile;