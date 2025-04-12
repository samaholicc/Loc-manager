import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

function Verified() {
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Extract query parameters from the URL
    const params = new URLSearchParams(location.search);
    const message = params.get("message");
    const error = params.get("error");

    if (message) {
      setMessage(decodeURIComponent(message));
      toast.success(decodeURIComponent(message));
      // Clear localStorage to force re-login with updated verification status
      window.localStorage.removeItem("whom");
      // Redirect to login page after a short delay
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } else if (error) {
      setError(decodeURIComponent(error));
      toast.error(decodeURIComponent(error));
    } else {
      setError("Paramètres de vérification manquants.");
      toast.error("Paramètres de vérification manquants.");
    }
  }, [navigate, location]);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 text-center">
        {message ? (
          <>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              E-mail vérifié avec succès !
            </h2>
            <p className="text-gray-700 mb-4">
              Votre adresse e-mail a été vérifiée. Vous allez être redirigé vers la page de connexion.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Aller à la connexion
            </button>
          </>
        ) : (
          <>
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => navigate("/login")}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Retour à la connexion
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Verified;