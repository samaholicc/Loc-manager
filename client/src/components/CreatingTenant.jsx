import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

function CreatingTenant() {
  const nameEl = useRef(null);
  const ageEl = useRef(null);
  const dobEl = useRef(null);
  const roomEl = useRef(null);
  const passEl = useRef(null);
  const IDEl = useRef(null);
  const statEl = useRef(null);
  const leaveDateEl = useRef(null);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [dob, setDob] = useState("");
  const [roomno, setRoomno] = useState("");
  const [pass, setPass] = useState("");
  const [ID, setID] = useState("");
  const [stat, setStat] = useState("");
  const [leaveDate, setLeaveDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Validate form fields in real-time
  useEffect(() => {
    const newErrors = {};
    if (name && !/^[a-zA-Z\s]+$/.test(name)) {
      newErrors.name = "Le nom doit contenir uniquement des lettres et des espaces";
    }
    if (roomno && (!/^\d+$/.test(roomno) || parseInt(roomno) <= 0)) {
      newErrors.roomno = "Le numéro de chambre doit être un entier positif";
    }
    if (age && (parseInt(age) < 0 || parseInt(age) > 120)) {
      newErrors.age = "L'âge doit être entre 0 et 120 ans";
    }
    if (dob) {
      const dobDate = new Date(dob);
      const today = new Date();
      if (dobDate > today) {
        newErrors.dob = "La date de naissance ne peut pas être dans le futur";
      }
    }
    if (leaveDate) {
      const leaveDateValue = new Date(leaveDate);
      const today = new Date();
      if (leaveDateValue < today) {
        newErrors.leaveDate = "La date de sortie ne peut pas être dans le passé";
      }
    }
    if (ID && (!/^\d{9}$/.test(ID))) {
      newErrors.ID = "Le numéro de carte d'identité doit contenir exactement 9 chiffres";
    }
    if (pass && pass.length < 6) {
      newErrors.pass = "Le mot de passe doit contenir au moins 6 caractères";
    }
    setErrors(newErrors);
  }, [name, roomno, age, dob, leaveDate, ID, pass]);

  // Calculate age from DOB
  useEffect(() => {
    if (dob) {
      const dobDate = new Date(dob);
      const today = new Date();
      let calculatedAge = today.getFullYear() - dobDate.getFullYear();
      const monthDiff = today.getMonth() - dobDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
        calculatedAge--;
      }
      setAge(calculatedAge.toString());
    }
  }, [dob]); // Added 'dob' to the dependency array

  // Calculate DOB from age
  useEffect(() => {
    if (age && !dob) {
      const parsedAge = parseInt(age);
      if (parsedAge >= 0 && parsedAge <= 120) {
        const today = new Date();
        const birthYear = today.getFullYear() - parsedAge;
        const calculatedDob = `${birthYear}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        setDob(calculatedDob);
      }
    }
  }, [age, dob]);

  const createTenant = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${process.env.REACT_APP_SERVER}/createtenant`, {
        name,
        age,
        roomno,
        password: pass,
        ID,
        dob,
        stat,
        leaveDate,
      });
      if (res.status === 200) {
        toast.success("Locataire créé");
        resetForm();
      } else {
        toast.error("Erreur : " + res.data);
      }
    } catch (error) {
      console.log(error);
      toast.error("Erreur : " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setAge("");
    setDob("");
    setRoomno("");
    setPass("");
    setID("");
    setStat("");
    setLeaveDate("");
    nameEl.current.value = "";
    ageEl.current.value = "";
    roomEl.current.value = "";
    passEl.current.value = "";
    IDEl.current.value = "";
    dobEl.current.value = "";
    statEl.current.value = "";
    leaveDateEl.current.value = "";
    setErrors({});
  };

  const submitHandler = (e) => {
    e.preventDefault();
    if (Object.keys(errors).length > 0) {
      toast.error("Veuillez corriger les erreurs dans le formulaire");
      return;
    }
    if (!name || !roomno || !pass || !dob || !ID || !age || !stat) {
      toast.error("Veuillez remplir tous les champs requis");
      return;
    }
    createTenant();
  };

  const handleReset = () => {
    resetForm();
  };

  return (
    <div className="mx-auto w-full max-w-[550px] my-5 p-5 bg-white rounded-lg shadow-md">
      <form onSubmit={submitHandler} action="" method="POST">
        <div className="mb-5">
          <label
            htmlFor="name"
            className="mb-1 block text-base font-medium text-[#07074D]"
          >
            Nom complet
          </label>
          <input
            type="text"
            ref={nameEl}
            name="name"
            id="name"
            value={name}
            placeholder="Nom complet"
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-md border border-[#e0e0e0] bg-white py-3 px-6 text-base font-medium text-[#6B7280] outline-none focus:border-[#6A64F1] focus:shadow-md"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>
        <div className="mb-5">
          <label
            htmlFor="room-no"
            className="mb-1 block text-base font-medium text-[#07074D]"
          >
            Numéro de chambre
          </label>
          <input
            type="text"
            ref={roomEl}
            name="room-no"
            id="room-no"
            value={roomno}
            placeholder="Numéro de chambre"
            onChange={(e) => setRoomno(e.target.value)}
            required
            className="w-full rounded-md border border-[#e0e0e0] bg-white py-3 px-6 text-base font-medium text-[#6B7280] outline-none focus:border-[#6A64F1] focus:shadow-md"
          />
          {errors.roomno && <p className="text-red-500 text-sm mt-1">{errors.roomno}</p>}
        </div>
        <div className="mb-5 flex gap-5 flex-wrap">
          <div>
            <label
              htmlFor="dob"
              className="mb-1 block text-base font-medium text-[#07074D]"
            >
              Date de naissance
            </label>
            <input
              type="date"
              name="dob"
              ref={dobEl}
              value={dob}
              onChange={(e) => {
                setDob(e.target.value);
                setAge("");
              }}
              id="dob"
              required
              className="w-60 rounded-md border border-[#e0e0e0] bg-white py-3 px-6 text-base font-medium text-[#6B7280] outline-none focus:border-[#6A64F1] focus:shadow-md"
            />
            {errors.dob && <p className="text-red-500 text-sm mt-1">{errors.dob}</p>}
          </div>
          <div>
            <label
              htmlFor="age"
              className="mb-1 block text-base font-medium text-[#07074D]"
            >
              Âge
            </label>
            <input
              type="number"
              name="age"
              ref={ageEl}
              id="age"
              value={age}
              onChange={(e) => {
                setAge(e.target.value);
                setDob("");
              }}
              placeholder="Âge"
              required
              className="w-20 rounded-md border border-[#e0e0e0] bg-white py-3 px-6 text-base font-medium text-[#6B7280] outline-none focus:border-[#6A64F1] focus:shadow-md"
            />
            {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
          </div>
        </div>
        <div className="mb-5 flex gap-5 flex-wrap">
          <div>
            <label
              htmlFor="stat"
              className="mb-1 block text-base font-medium text-[#07074D]"
            >
              Statut
            </label>
            <select
              name="stat"
              ref={statEl}
              id="stat"
              value={stat}
              onChange={(e) => setStat(e.target.value)}
              required
              className="w-60 rounded-md border border-[#e0e0e0] bg-white py-3 px-6 text-base font-medium text-[#6B7280] outline-none focus:border-[#6A64F1] focus:shadow-md"
            >
              <option value="">Sélectionnez le statut</option>
              <option value="Non payé">Non payé</option>
              <option value="Payé">Payé</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="leaveDate"
              className="mb-1 block text-base font-medium text-[#07074D]"
            >
              Date de sortie
            </label>
            <input
              type="date"
              name="leaveDate"
              ref={leaveDateEl}
              value={leaveDate}
              onChange={(e) => setLeaveDate(e.target.value)}
              id="leaveDate"
              className="w-60 rounded-md border border-[#e0e0e0] bg-white py-3 px-6 text-base font-medium text-[#6B7280] outline-none focus:border-[#6A64F1] focus:shadow-md"
            />
            {errors.leaveDate && <p className="text-red-500 text-sm mt-1">{errors.leaveDate}</p>}
          </div>
        </div>
        <div className="mb-5">
          <label
            htmlFor="ID"
            className="mb-1 block text-base font-medium text-[#07074D]"
          >
            Numéro carte identité
          </label>
          <input
            type="text"
            name="ID"
            ref={IDEl}
            id="ID"
            value={ID}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, ""); // Allow only digits
              if (value.length <= 9) {
                setID(value);
              }
            }}
            placeholder="Numéro carte identité (9 chiffres)"
            required
            className="w-full rounded-md border border-[#e0e0e0] bg-white py-3 px-6 text-base font-medium text-[#6B7280] outline-none focus:border-[#6A64F1] focus:shadow-md"
          />
          {errors.ID && <p className="text-red-500 text-sm mt-1">{errors.ID}</p>}
        </div>
        <div className="mb-5">
          <label
            htmlFor="pass"
            className="mb-1 block text-base font-medium text-[#07074D]"
          >
            Mot de passe
          </label>
          <input
            type="password"
            name="pass"
            ref={passEl}
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            id="pass"
            placeholder="Entrez votre mot de passe (min 6 caractères)"
            required
            className="w-full rounded-md border border-[#e0e0e0] bg-white py-3 px-6 text-base font-medium text-[#6B7280] outline-none focus:border-[#6A64F1] focus:shadow-md"
          />
          {errors.pass && <p className="text-red-500 text-sm mt-1">{errors.pass}</p>}
        </div>
        <div className="flex w-full gap-4 justify-center">
          <button
            type="submit"
            disabled={loading}
            className={`py-3 px-8 text-white bg-blue-500 rounded-md focus:bg-blue-600 focus:outline-none hover:bg-white hover:text-blue-500 transition-all duration-300 hover:border-blue-500 border-transparent border-2 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {loading ? "Création..." : "Soumettre"}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="py-3 px-8 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none transition-all duration-300"
          >
            Réinitialiser
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreatingTenant;