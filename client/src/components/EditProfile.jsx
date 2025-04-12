import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";

function EditProfile() {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
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
  const [availableBlocks, setAvailableBlocks] = useState([]);
  const [employeeId, setEmployeeId] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  const fetchUserData = async () => {
    const userTypeFromStorage = JSON.parse(window.localStorage.getItem("whom"))?.userType;
    const userId = JSON.parse(window.localStorage.getItem("whom"))?.username;
    const adminId = JSON.parse(window.localStorage.getItem("whom"))?.adminId;

    if (!userTypeFromStorage || !userId) {
      toast.error("Veuillez vous connecter pour modifier votre profil.");
      navigate("/login");
      return;
    }

    const normalizedUserType = userTypeFromStorage.toLowerCase();
    setUserType(normalizedUserType);
    console.log("UserType set to:", normalizedUserType);

    try {
      if (normalizedUserType === "admin") {
        console.log("Fetching admin data for admin_id:", adminId);
        const res = await axios.post(`${process.env.REACT_APP_SERVER}/block_admin`, { admin_id: adminId });
        console.log("Response from /block_admin:", res.data);
        if (res.data) {
          setFormData({
            name: res.data.admin_name || "",
            block_no: res.data.block_no || "",
            email: res.data.email || "", // Ensure email is set correctly
            phone: res.data.phone || "",
            password: "",
            room_no: "",
            age: "",
            dob: "",
          });
          setIsEmailVerified(!!res.data.is_email_verified);
          console.log("isEmailVerified set to:", !!res.data.is_email_verified);
        }
      } else if (normalizedUserType === "tenant") {
        console.log("Fetching tenant data for userId:", userId);
        const res = await axios.post(`${process.env.REACT_APP_SERVER}/tenant`, { userId });
        console.log("Response from /tenant:", res.data);
        if (res.data && res.data.length > 0) {
          setFormData({
            name: res.data[0].name || "",
            block_no: "",
            email: res.data[0].email || "", // Ensure email is set correctly
            phone: "",
            password: "",
            room_no: res.data[0].room_no || "",
            age: res.data[0].age || "",
            dob: res.data[0].dob || "",
          });
          setIsEmailVerified(!!res.data[0].is_email_verified);
          console.log("isEmailVerified set to:", !!res.data[0].is_email_verified);
        }
      } else if (normalizedUserType === "owner") {
        console.log("Fetching owner data for userId:", userId);
        const res = await axios.post(`${process.env.REACT_APP_SERVER}/owner`, { userId });
        console.log("Response from /owner:", res.data);
        if (res.data && res.data.owner) {
          setFormData({
            name: res.data.owner.name || "",
            block_no: "",
            email: res.data.owner.email || "", // Ensure email is set correctly
            phone: "",
            password: "",
            room_no: res.data.owner.room_no || "",
            age: "",
            dob: "",
          });
          setIsEmailVerified(!!res.data.owner.is_email_verified);
          console.log("isEmailVerified set to:", !!res.data.owner.is_email_verified);
        }
      } else if (normalizedUserType === "employee") {
        console.log("Fetching employee data for userId:", userId);
        const authRes = await axios.post(`${process.env.REACT_APP_SERVER}/get-auth-id`, { userId });
        console.log("Response from /get-auth-id:", authRes.data);
        if (!authRes.data || !authRes.data.id) {
          throw new Error("ID non trouvé dans la table auth.");
        }
        const empId = String(authRes.data.id);
        setEmployeeId(empId);
        console.log("Employee ID from auth table:", empId);

        const res = await axios.post(`${process.env.REACT_APP_SERVER}/dashboard/employee`, { userId });
        console.log("Response from /dashboard/employee:", res.data);
        if (res.data) {
          setFormData({
            name: res.data.emp_name || "",
            block_no: res.data.block_no || "",
            email: res.data.email || "", // Ensure email is set correctly
            phone: "",
            password: "",
            room_no: "",
            age: "",
            dob: "",
          });
          setIsEmailVerified(!!res.data.is_email_verified);
          console.log("isEmailVerified set to:", !!res.data.is_email_verified);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des données:", error);
      toast.error("Erreur lors de la récupération des données : " + (error.response?.data?.error || error.message));
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    }
  };

  useEffect(() => {
    fetchUserData();

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
        toast.error("Erreur lors de la récupération des blocs disponibles.");
      }
    };

    fetchNotifications();
    if (userType === "admin" || userType === "employee") {
      fetchAvailableBlocks();
    }

    const handleFocus = () => {
      fetchUserData();
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [navigate, userType]);

  const validateForm = () => {
    if (userType === "admin") {
      if (!formData.block_no || !availableBlocks.some(block => block.block_no === parseInt(formData.block_no))) {
        toast.error("Veuillez sélectionner un numéro de bloc valide.");
        return false;
      }

      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        toast.error("Veuillez entrer une adresse e-mail valide.");
        return false;
      }

      if (formData.phone) {
        const phoneRegex = /^((\+33[67])|(0[67]))\d{8}$/;
        if (!phoneRegex.test(formData.phone)) {
          toast.error("Le numéro de téléphone doit commencer par +336, +337, 06, ou 07 et être suivi de 8 chiffres (ex: +33612345678 ou 0612345678).");
          return false;
        }
      }
    } else if (userType === "tenant") {
      if (!formData.room_no || !/^\d+$/.test(formData.room_no) || parseInt(formData.room_no) <= 0) {
        toast.error("Le numéro de chambre doit être un entier positif.");
        return false;
      }

      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        toast.error("Veuillez entrer une adresse e-mail valide.");
        return false;
      }

      if (formData.age && (!/^\d+$/.test(formData.age) || parseInt(formData.age) <= 0)) {
        toast.error("L'âge doit être un entier positif.");
        return false;
      }

      if (formData.dob) {
        const dobDate = new Date(formData.dob);
        const today = new Date();
        if (isNaN(dobDate.getTime()) || dobDate >= today) {
          toast.error("La date de naissance doit être une date valide dans le passé.");
          return false;
        }
      }
    } else if (userType === "owner") {
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        toast.error("Veuillez entrer une adresse e-mail valide.");
        return false;
      }
    } else if (userType === "employee") {
      if (!formData.block_no || !availableBlocks.some(block => block.block_no === parseInt(formData.block_no))) {
        toast.error("Veuillez sélectionner un numéro de bloc valide.");
        return false;
      }

      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        toast.error("Veuillez entrer une adresse e-mail valide.");
        return false;
      }

      if (!employeeId) {
        toast.error("Erreur : ID de l'employé non trouvé.");
        return false;
      }
    }

    if (formData.password && formData.password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères.");
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
      const userIdFromStorage = JSON.parse(window.localStorage.getItem("whom"))?.username;
      const userId = userType === "employee" ? userIdFromStorage : userIdFromStorage;

      console.log("Submitting with userId:", userId, "and userType:", userType);

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
      toast.success("Profil mis à jour avec succès. Vérifiez votre e-mail si vous avez modifié votre adresse.");
      if (formData.email) {
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        navigate(`/${userType}`);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      toast.error("Erreur lors de la mise à jour du profil : " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const markNotificationAsRead = (index) => {
    setNotifications(notifications.filter((_, i) => i !== index));
  };

  const resendVerificationEmail = async () => {
    try {
      const userId = JSON.parse(window.localStorage.getItem("whom"))?.username;
      await axios.post(`${process.env.REACT_APP_SERVER}/resend-verification`, {
        userId,
        userType,
      });
      toast.success("E-mail de vérification renvoyé. Veuillez vérifier votre boîte de réception.");
      await fetchUserData();
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'e-mail:", error);
      const errorMessage = error.response?.data?.error || error.message;
      if (errorMessage === "Email is already verified") {
        toast.info("Votre e-mail est déjà vérifié.");
        setIsEmailVerified(true);
        await fetchUserData();
      } else {
        toast.error("Erreur lors de l'envoi de l'e-mail : " + errorMessage);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_SERVER}/logout`);
      window.localStorage.removeItem("whom");
      toast.success("Déconnexion réussie");
      navigate("/login");
    } catch (error) {
      toast.error("Erreur lors de la déconnexion : " + (error.response?.data?.error || error.message));
    }
  };

  return (
    

    <div
      className={`min-h-screen w-full transition-all duration-300 flex justify-center items-center p-4 ${
        darkMode ? "bg-gray-900" : "bg-gradient-to-br from-gray-100 to-gray-200"
      }`}
    >
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Modifier les Informations</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                userType === "admin"
                  ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                  : "bg-white text-gray-800 border-gray-300"
              }`}
              disabled={userType === "admin"}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse e-mail</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
              required
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
          </div>
          {userType === "admin" && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de bloc</label>
                <select
                  value={formData.block_no}
                  onChange={(e) => setFormData({ ...formData, block_no: e.target.value })}
                  className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de téléphone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Ex: 0761551241"
                  className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                />
              </div>
            </>
          )}
          {userType === "tenant" && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de chambre</label>
                <input
                  type="text"
                  value={formData.room_no}
                  onChange={(e) => setFormData({ ...formData, room_no: e.target.value })}
                  className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Âge</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                />
              </div>
            </>
          )}
          {userType === "employee" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de bloc</label>
              <select
                value={formData.block_no}
                onChange={(e) => setFormData({ ...formData, block_no: e.target.value })}
                className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
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
          )}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nouveau mot de passe (laisser vide pour ne pas changer)
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
            />
          </div>
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`w-full p-2 rounded text-sm transition-all duration-300 ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            {loading ? "Enregistrement..." : "Enregistrer"}
          </motion.button>
          <button
            onClick={handleLogout}
            className="mt-4 w-full p-2 rounded text-sm bg-red-500 text-white hover:bg-red-600"
          >
            Déconnexion
          </button>
        </motion.form>
      </div>
    </div>
  );
}

export default EditProfile;