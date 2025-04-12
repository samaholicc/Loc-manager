import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { FaUser, FaEnvelope, FaComment, FaCalendarAlt, FaArrowLeft } from "react-icons/fa";

// Inline CSS to ensure Calendly widget renders correctly
const styles = `
  .calendly-inline-widget {
    position: relative;
    z-index: 10;
    min-width: 320px;
    height: 630px;
    overflow: hidden;
  }
  .calendly-inline-widget iframe {
    width: 100% !important;
    height: 100% !important;
    border: none;
  }
`;

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

// Reusable Textarea Component
const TextareaField = ({ label, error, icon: Icon, ...props }) => (
  <div className="mb-3">
    <label
      className={`flex items-center text-sm font-medium mb-1 ${
        props.darkMode ? "text-gray-200" : "text-gray-700"
      }`}
    >
      {Icon && <Icon className={props.darkMode ? "mr-2 text-gray-400" : "mr-2 text-gray-500"} />}
      {label}
    </label>
    <textarea
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

function Support() {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [calendlyLoaded, setCalendlyLoaded] = useState(false);
  const userType = JSON.parse(window.localStorage.getItem("whom"))?.userType || "";
  const calendlyRef = useRef(null);

  useEffect(() => {
    const whom = JSON.parse(window.localStorage.getItem("whom"));
    if (!whom || !whom.userType || !whom.username) {
      toast.error("Veuillez vous connecter pour accéder à la page de support.");
      navigate("/login");
    }

    // Inject inline styles to prevent CSS conflicts
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    // Load Calendly script dynamically
    const loadCalendlyScript = () => {
      if (document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]')) {
        setCalendlyLoaded(true);
        if (window.Calendly && calendlyRef.current) {
          window.Calendly.initInlineWidget({
            url: "https://calendly.com/samaholiccs/support-call-loc-manager",
            parentElement: calendlyRef.current,
          });
        }
        return;
      }

      const script = document.createElement("script");
      script.type = "text/javascript";
      script.src = "https://assets.calendly.com/assets/external/widget.js";
      script.async = true;
      script.onload = () => {
        setCalendlyLoaded(true);
        if (window.Calendly && calendlyRef.current) {
          window.Calendly.initInlineWidget({
            url: "https://calendly.com/samaholiccs/support-call-loc-manager",
            parentElement: calendlyRef.current,
          });
        } else {
          toast.error("Erreur lors de l'initialisation du widget Calendly.");
        }
      };
      script.onerror = () => {
        toast.error("Erreur lors du chargement du widget Calendly. Veuillez vérifier votre connexion.");
      };
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
        document.head.removeChild(styleSheet);
      };
    };

    loadCalendlyScript();
  }, [navigate]);

  const validateField = (name, value) => {
    const validators = {
      name: (v) => (v.length < 2 ? "Le nom doit contenir au moins 2 caractères" : ""),
      email: (v) => (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Veuillez entrer une adresse e-mail valide" : ""),
      subject: (v) => (v.length < 5 ? "Le sujet doit contenir au moins 5 caractères" : ""),
      message: (v) => (v.length < 10 ? "Le message doit contenir au moins 10 caractères" : ""),
    };
    return validators[name] ? validators[name](value) : "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = Object.keys(formData).reduce((acc, key) => {
      const error = validateField(key, formData[key]);
      if (error) acc[key] = error;
      return acc;
    }, {});

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error("Veuillez corriger les erreurs avant de soumettre.");
      return;
    }

    setLoading(true);
    try {
      const userId = JSON.parse(window.localStorage.getItem("whom"))?.username;
      const response = await axios.post(`${process.env.REACT_APP_SERVER}/send-support-message`, {
        userId,
        userType,
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
      });
      toast.success(response.data.message || "Message envoyé avec succès. Notre équipe vous répondra bientôt.");
      setFormData({ name: "", email: "", subject: "", message: "" });
      setErrors({});
    } catch (error) {
      console.error("Error sending support message:", error);
      const errorMessage = error.response?.data?.error || error.message || "Une erreur s'est produite lors de l'envoi du message.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen w-full transition-all duration-300 flex flex-col p-6 md:p-8 gap-8 ${
        darkMode ? "bg-gray-900" : "bg-gray-100"
      } text-gray-800 dark:text-gray-100`}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center"
      >
        <h1 className="text-3xl font-bold">Contacter le Support</h1>
        <button
          onClick={() => navigate(`/${userType}`)}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-all duration-300 bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          <FaArrowLeft />
          Retour au Tableau de Bord
        </button>
      </motion.div>

      {/* Contact Form Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-xl shadow-lg p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      >
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <FaEnvelope className="text-blue-500" />
          Envoyer un Message au Support
        </h2>
        <p className="text-base mb-4">
          Remplissez le formulaire ci-dessous pour envoyer un message à notre équipe de support. Nous vous répondrons dans les plus brefs délais.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            label="Nom complet"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Entrez votre nom complet"
            error={errors.name}
            icon={FaUser}
            darkMode={darkMode}
            required
          />
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
            required
          />
          <InputField
            label="Sujet"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder="Entrez le sujet de votre message"
            error={errors.subject}
            icon={FaComment}
            darkMode={darkMode}
            required
          />
          <TextareaField
            label="Message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Décrivez votre problème ou votre demande"
            error={errors.message}
            icon={FaComment}
            darkMode={darkMode}
            rows={5}
            required
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={loading}
            className={`w-full px-6 py-2 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${
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
              <FaEnvelope className="mr-2" />
            )}
            {loading ? "Envoi..." : "Envoyer"}
          </motion.button>
        </form>
      </motion.div>

      {/* Calendly Appointment Section */}
      <div
        className="rounded-xl shadow-lg p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      >
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <FaCalendarAlt className="text-blue-500" />
          Prendre un Rendez-vous avec le Support
        </h2>
        <p className="text-base mb-4">
          Si vous préférez une assistance en direct, vous pouvez prendre un rendez-vous avec un membre de notre équipe via Calendly. Sélectionnez une date et une heure ci-dessous.
        </p>
        {calendlyLoaded ? (
          <div>
            <div
              ref={calendlyRef}
              className="calendly-inline-widget"
              data-url="https://calendly.com/samaholiccs/support-call-loc-manager"
            ></div>
            <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">
              Si le widget ne se charge pas,{" "}
              <a
                href="https://calendly.com/samaholiccs/support-call-loc-manager"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                cliquez ici pour prendre un rendez-vous directement sur Calendly
              </a>.
            </p>
          </div>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400">
            <svg
              className="animate-spin h-5 w-5 mx-auto mb-2"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p>Chargement du widget Calendly...</p>
          </div>
        )}
      </div>

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
    </div>
  );
}

export default Support;