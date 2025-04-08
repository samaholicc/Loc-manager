import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";
import { FaUser, FaCalendarAlt, FaLock, FaHome, FaFileSignature, FaPlus } from "react-icons/fa";

// Reusable Input Component
const InputField = ({ label, error, icon: Icon, ...props }) => (
  <div className="mb-3">
    <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
      {Icon && <Icon className="mr-2 text-gray-500" />}
      {label}
    </label>
    {/* Reduced py-3 to py-2 (12px to 8px) */}
    <input
      className={`w-full px-3 py-2 rounded-lg border shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 transition-all duration-200 ease-in-out ${
        error ? "border-red-500" : "border-gray-300"
      } placeholder-gray-400 text-gray-800 bg-gray-50`}
      {...props}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

// Reusable Select Component
const SelectField = ({ label, error, icon: Icon, children, ...props }) => (
  <div className="mb-3">
    <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
      {Icon && <Icon className="mr-2 text-gray-500" />}
      {label}
    </label>
    {/* Reduced py-3 to py-2 (12px to 8px) */}
    <select
      className={`w-full px-3 py-2 rounded-lg border shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 transition-all duration-200 ease-in-out ${
        error ? "border-red-500" : "border-gray-300"
      } text-gray-800 bg-gray-50 appearance-none`}
      {...props}
    >
      {children}
    </select>
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

function CreatingUser() {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    dob: "",
    roomno: "",
    pass: "",
    confirmPass: "",
    aggrementStatus: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);

  // Fetch available rooms on component mount
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

  // Validation logic
  const validateField = (name, value) => {
    const validators = {
      name: (v) => (v.length < 2 ? "Le nom doit contenir au moins 2 caractères" : ""),
      age: (v) => (isNaN(v) || v < 18 || v > 150 ? "L'âge doit être entre 18 et 150" : ""),
      roomno: (v) => (!v ? "Le numéro de chambre est requis" : ""),
      pass: (v) => (v.length < 6 ? "Le mot de passe doit contenir au moins 6 caractères" : ""),
      confirmPass: (v) => (v !== formData.pass ? "Les mots de passe ne correspondent pas" : ""),
      aggrementStatus: (v) =>
        !["Oui", "Non", "En attente"].includes(v) ? "Statut invalide" : "",
      dob: (v) => (!v ? "La date de naissance est requise" : ""),
    };
    return validators[name] ? validators[name](value) : "";
  };

  // Handle input changes
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

  // API submission
  const post = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${process.env.REACT_APP_SERVER}/createowner`, {
        name: formData.name,
        age: formData.age,
        roomno: formData.roomno,
        password: formData.pass,
        aggrementStatus: formData.aggrementStatus,
        dob: formData.dob,
      });
      if (res.status === 200 && res.data.message === "Owner created successfully") {
        toast.success("Propriétaire créé avec succès !");
        setFormData({
          name: "",
          age: "",
          dob: "",
          roomno: "",
          pass: "",
          confirmPass: "",
          aggrementStatus: "",
        });
        setErrors({});
        // Refetch available rooms after successful creation
        const updatedRooms = await axios.get(`${process.env.REACT_APP_SERVER}/available-rooms`);
        setAvailableRooms(updatedRooms.data);
      } else {
        toast.error(res.data.message || "Échec de la création du propriétaire");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Erreur lors de la requête";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Form submission
  const submitHandler = (e) => {
    e.preventDefault();
    const newErrors = Object.keys(formData).reduce((acc, key) => {
      const error = validateField(key, formData[key]);
      if (error) acc[key] = error;
      return acc;
    }, {});

    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0 && window.confirm("Confirmer la création du propriétaire ?")) {
      post();
    } else {
      toast.error("Veuillez corriger les erreurs avant de soumettre");
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      age: "",
      dob: "",
      roomno: "",
      pass: "",
      confirmPass: "",
      aggrementStatus: "",
    });
    setErrors({});
  };

  
return (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="container mx-auto max-w-md p-6 pb-2 bg-white rounded-2xl shadow-xl my-8 border border-gray-100" // Changed p-6 to include pb-2 for less bottom padding
  >
    <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center tracking-tight">
      Créer un Propriétaire
    </h1>
    <form onSubmit={submitHandler} className="m-0 p-0"> {/* Ensure form has no margins or padding */}
      {/* Personal Information */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b-2 border-indigo-100 pb-1 flex items-center">
          <FaUser className="mr-2 text-indigo-500" />
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
            className="bg-gray-100 cursor-not-allowed"
            icon={FaCalendarAlt}
          />
        </div>
      </section>

      {/* Owner Details */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b-2 border-indigo-100 pb-1 flex items-center">
          <FaHome className="mr-2 text-indigo-500" />
          Détails du Propriétaire
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField
            label="Numéro de chambre"
            name="roomno"
            value={formData.roomno}
            onChange={handleChange}
            error={errors.roomno}
            icon={FaHome}
          >
            <option value="">Sélectionnez une chambre</option>
            {availableRooms.map((room) => (
              <option key={room} value={room}>
                {room}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Statut de l'accord"
            name="aggrementStatus"
            value={formData.aggrementStatus}
            onChange={handleChange}
            error={errors.aggrementStatus}
            icon={FaFileSignature}
          >
            <option value="">Sélectionnez un statut</option>
            <option value="Oui">Oui</option>
            <option value="Non">Non</option>
            <option value="En attente">En attente</option>
          </SelectField>
        </div>
      </section>

      {/* Security */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b-2 border-indigo-100 pb-1 flex items-center">
          <FaLock className="mr-2 text-indigo-500" />
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
        />
      </section>

      {/* Actions */}
      <div className="flex justify-center gap-3 mb-0 buttons-container">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <svg className="animate-spin h-4 w-4 mr-2 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg shadow-md hover:bg-gray-300 transition-all duration-200"
        >
          Réinitialiser
        </motion.button>
      </div>
    </form>

    {/* ToastContainer with absolute positioning */}
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
      theme="light"
      className="absolute top-0 right-0 m-0 p-0"
    />
  </motion.div>
);
}

export default CreatingUser;