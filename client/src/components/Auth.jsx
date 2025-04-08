import React, { useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Particle from "./Particle";
import { toast } from "react-toastify";

function Auth() {
  const nav = useNavigate();
  const inputEl = useRef(null);
  const passEl = useRef(null);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const authorize = async () => {
    setLoading(true);
    const apiUrl = `${process.env.REACT_APP_SERVER}/auth`;
    console.log("Requesting URL:", apiUrl);
    console.log("Request Payload:", { username: userId, password });

    if (!"AEOT".includes(userId.toUpperCase().charAt(0))) {
      toast.error("L'identifiant doit commencer par A, E, O ou T");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(
        apiUrl,
        { username: userId, password },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      console.log("Auth response status:", res.status);
      console.log("Auth response data:", res.data);

      if (res.data.access === "granted") {
        const userData = {
          userType: res.data.user,
          username: userId,
        };
        // If the user is an admin, store the adminId in localStorage
        if (res.data.user === "admin" && res.data.adminId) {
          userData.adminId = res.data.adminId;
        }
        window.localStorage.setItem("whom", JSON.stringify(userData));
        toast.success(`Bienvenue, ${res.data.user} !`);
        // Redirect to user-type-specific route
        nav(`/${res.data.user.toLowerCase()}`, { replace: true });
      } else {
        toast.error("Identifiants incorrects");
      }
    } catch (error) {
      console.error("Auth error:", error);
      console.log("Error response headers:", error.response?.headers);
      let errorMsg = "Erreur réseau";
      if (error.code === "ERR_NETWORK") {
        errorMsg = "Impossible de contacter le serveur. Vérifiez votre connexion ou l'état du serveur.";
      } else if (error.response) {
        errorMsg = error.response.data?.error || error.message;
        console.log("Error response status:", error.response.status);
        console.log("Error response data:", error.response.data);
      }
      toast.error(`Erreur : ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const submitHandler = (e) => {
    e.preventDefault();
    authorize();
  };

  return (
    <div className="backgroundAuth">
      <div className="flex items-center min-h-screen z-50">
        <div className="container mx-auto z-50">
          <div className="max-w-md mx-auto my-10 bg-blue-100 p-2 rounded-md shadow-md">
            <div className="text-center">
              <h1 className="my-3 text-3xl font-semibold text-gray-700">Mittal High</h1>
            </div>
            <div className="m-7">
              <form onSubmit={submitHandler}>
                <div className="relative mb-4">
                  <label htmlFor="user-id" className="block mb-2 text-sm text-gray-600">
                    Identifiant utilisateur
                  </label>
                  <input
                    ref={inputEl}
                    type="text"
                    autoFocus
                    name="user-id"
                    required
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="Identifiant utilisateur"
                    className={`w-full px-3 py-2 placeholder-gray-300 border ${
                      userId.length === 0 || "AEOT".includes(userId.toUpperCase().charAt(0))
                        ? "border-gray-300"
                        : "border-red-500"
                    } rounded-md focus:outline-none focus:ring focus:ring-indigo-100`}
                  />
                  {userId.length > 0 && !"AEOT".includes(userId.toUpperCase().charAt(0)) && (
                    <span className="text-red-500 text-xs absolute left-0 bottom-[-20px]">
                      Doit commencer par A, E, O ou T
                    </span>
                  )}
                </div>
                <div className="relative mb-6">
                  <label htmlFor="password" className="block mb-2 text-sm text-gray-600">
                    Mot de passe
                  </label>
                  <input
                    ref={passEl}
                    type="password"
                    required
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Votre mot de passe"
                    className={`w-full px-3 py-2 placeholder-gray-300 border ${
                      password.length >= 6 || password.length === 0
                        ? "border-gray-300"
                        : "border-red-500"
                    } rounded-md focus:outline-none focus:ring focus:ring-indigo-100`}
                  />
                  {password.length > 0 && password.length < 6 && (
                    <span className="text-red-500 text-xs absolute left-0 bottom-[-20px]">
                      Au moins 6 caractères
                    </span>
                  )}
                </div>
                <div className="mb-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-3 py-3 font-semibold text-white bg-blue-500 rounded-md focus:bg-blue-600 focus:outline-none hover:bg-white hover:text-blue-500 transition-all duration-300 hover:border-blue-500 border-transparent border-2 disabled:opacity-50"
                  >
                    {loading ? "Connexion..." : "Se connecter"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Particle />
    </div>
  );
}

export default Auth;