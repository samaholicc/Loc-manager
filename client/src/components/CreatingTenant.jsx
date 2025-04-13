import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";
import { FaUser, FaPlus, FaCalendarAlt, FaLock, FaHome, FaIdCard, FaCheckCircle, FaEnvelope } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";

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
      }`}
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

function CreatingTenant() {
  const { darkMode } = useTheme();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    age: "",
    dob: "",
    roomno: "",
    pass: "",
    confirmPass: "",
    ID: "",
    stat: "",
    leaveDate: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);

  useEffect(() => {
    const fetchAvailableRooms = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_SERVER}/available-rooms`);
        setAvailableRooms(res.data);
      } catch (error) {
        toast.error("Erreur lors de la récupération des chambres disponibles");
        console.error("Error fetching available rooms:", error);
      }
    };
    fetchAvailableRooms();
  }, []);

  const validateField = (name, value) => {
    const validators = {
      name: (v) => (v.length < 2 ? "Le nom doit contenir au moins 2 caractères" : ""),
      email: (v) =>
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Veuillez entrer un email valide" : "",
      age: (v) => (isNaN(v) || v < 18 || v > 120 ? "L'âge doit être entre 18 et 120" : ""),
      dob: (v) => (!v ? "La date de naissance est requise" : ""),
      roomno: (v) => (!v ? "Le numéro de chambre est requis" : ""),
      pass: (v) => (v.length < 6 ? "Le mot de passe doit contenir au moins 6 caractères" : ""),
      confirmPass: (v) => (v !== formData.pass ? "Les mots de passe ne correspondent pas" : ""),
      ID: (v) => (!/^\d{9}$/.test(v) ? "L'ID doit contenir exactement 9 chiffres" : ""),
      stat: (v) => (!["Payé", "Non payé"].includes(v) ? "Statut invalide" : ""),
      leaveDate: (v) => {
        if (!v) return "";
        const leaveDateValue = new Date(v);
        const today = new Date();
        return leaveDateValue < today ? "La date de sortie ne peut pas être dans le passé" : "";
      },
    };
    return validators[name] ? validators[name](value) : "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));

    if (name === "dob" && value) {
      const birthDate = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      if (today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())) age--;
      setFormData((prev) => ({ ...prev, age: age.toString() }));
      setErrors((prev) => ({ ...prev, age: validateField("age", age) }));
    }
  };

  const post = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${process.env.REACT_APP_SERVER}/createtenant`, {
        name: formData.name,
        email: formData.email,
        age: formData.age,
        roomno: formData.roomno,
        password: formData.pass,
        ID: formData.ID,
        dob: formData.dob,
        stat: formData.stat,
        leaveDate: formData.leaveDate,
      });
      if (res.status === 200 && res.data.message === "Tenant created successfully. Please verify your email.") {
        toast.success("Locataire créé avec succès !");
        setFormData({
          name: "",
          email: "",
          age: "",
          dob: "",
          roomno: "",
          pass: "",
          confirmPass: "",
          ID: "",
          stat: "",
          leaveDate: "",
        });
        setErrors({});
        const updatedRooms = await axios.get(`${process.env.REACT_APP_SERVER}/available-rooms`);
        setAvailableRooms(updatedRooms.data);
      } else {
        toast.error(res.data.message || "Échec de la création du locataire");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Erreur lors de la requête";
      toast.error(errorMessage);
      console.error("Error creating tenant:", error);
    } finally {
      setLoading(false);
    }
  };

  const submitHandler = (e) => {
    e.preventDefault();
    const newErrors = Object.keys(formData).reduce((acc, key) => {
      const error = validateField(key, formData[key]);
      if (error) acc[key] = error;
      return acc;
    }, {});

    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0 && window.confirm("Confirmer la création du locataire ?")) {
      post();
    } else {
      toast.error("Veuillez corriger les erreurs avant de soumettre");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      age: "",
      dob: "",
      roomno: "",
      pass: "",
      confirmPass: "",
      ID: "",
      stat: "",
      leaveDate: "",
    });
    setErrors({});
  };

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
          Créer un Locataire
        </h1>
        <form onSubmit={submitHandler} className="m-0 p-0">
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
              darkMode={darkMode}
            />
            <InputField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Entrez votre email"
              error={errors.email}
              icon={FaEnvelope}
              darkMode={darkMode}
            />
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
                className={darkMode ? "bg-gray-600 cursor-not-allowed" : "bg-gray-100 cursor-not-allowed"}
                icon={FaCalendarAlt}
                darkMode={darkMode}
              />
            </div>
          </section>

          {/* Tenant Details */}
          <section className="mb-6">
            <h2
              className={`text-lg font-semibold mb-3 border-b-2 pb-1 flex items-center ${
                darkMode ? "text-gray-200 border-indigo-700" : "text-gray-800 border-indigo-100"
              }`}
            >
              <FaHome className={darkMode ? "mr-2 text-indigo-400" : "mr-2 text-indigo-500"} />
              Détails du Locataire
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label="Numéro de chambre"
                name="roomno"
                value={formData.roomno}
                onChange={handleChange}
                error={errors.roomno}
                icon={FaHome}
                darkMode={darkMode}
              >
                <option value="">Sélectionnez une chambre</option>
                {availableRooms.map((room) => (
                  <option key={room} value={room}>
                    {room}
                  </option>
                ))}
              </SelectField>
              <SelectField
                label="Statut de paiement"
                name="stat"
                value={formData.stat}
                onChange={handleChange}
                error={errors.stat}
                icon={FaCheckCircle}
                darkMode={darkMode}
              >
                <option value="">Sélectionnez un statut</option>
                <option value="Payé">Payé</option>
                <option value="Non payé">Non payé</option>
              </SelectField>
            </div>
            <InputField
              label="Date de sortie"
              type="date"
              name="leaveDate"
              value={formData.leaveDate}
              onChange={handleChange}
              error={errors.leaveDate}
              icon={FaCalendarAlt}
              darkMode={darkMode}
            />
            <InputField
              label="Numéro de carte d'identité"
              name="ID"
              value={formData.ID}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                if (value.length <= 9) {
                  setFormData((prev) => ({ ...prev, ID: value }));
                  setErrors((prev) => ({ ...prev, ID: validateField("ID", value) }));
                }
              }}
              placeholder="Entrez 9 chiffres"
              error={errors.ID}
              icon={FaIdCard}
              darkMode={darkMode}
            />
          </section>

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
              label="Mot de passe"
              type="password"
              name="pass"
              value={formData.pass}
              onChange={handleChange}
              placeholder="Entrez votre mot de passe"
              error={errors.pass}
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
                <FaPlus className="mr-2" />
              )}
              {loading ? "Envoi..." : "Créer"}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={resetForm}
              className={`px-6 py-2 rounded-lg shadow-md transition-all duration-200 ${
                darkMode
                  ? "bg-gray-600 text-gray-200 hover:bg-gray-700"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Réinitialiser
            </motion.button>
          </div>
        </form>

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme={darkMode ? "dark" : "light"}
          className="absolute top-0 right-0 m-0 p-0"
        />
      </motion.div>
    </div>
  );
}

export default CreatingTenant;