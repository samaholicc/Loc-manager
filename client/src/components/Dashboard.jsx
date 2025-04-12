import axios from "axios";
import React, { useContext, useState, useEffect, useCallback, useRef } from "react";
import { HamContext } from "../HamContextProvider";
import { useTheme } from "../context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaSyncAlt, FaMoon, FaSun, FaChevronDown, FaChevronUp, FaExclamationCircle,
  FaUser, FaBell, FaCloudSun, FaUsers, FaExclamationTriangle, FaMoneyBillWave,
  FaPlus, FaFileAlt, FaCheck, FaEye, FaCar, FaWrench, FaFilter, FaDownload,
  FaLink, FaBook, FaHeadset, FaUserPlus, FaSignInAlt, FaServer, FaChartLine, FaBriefcase,
  FaEnvelope, FaPaperPlane, FaInfoCircle, FaExclamation, FaDollarSign
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, PieController, ArcElement } from "chart.js";

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, PieController, ArcElement);

function Dashboard({ navItems, basePath }) {
  const { hamActive, hamHandler } = useContext(HamContext);
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [forBox, setForBox] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRules, setShowRules] = useState(false);
  const [userName, setUserName] = useState("Utilisateur");
  const [userDetails, setUserDetails] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(null);
  const [weatherCity, setWeatherCity] = useState("Paris");
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [complaintSummary, setComplaintSummary] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [maintenanceForm, setMaintenanceForm] = useState({
    room_no: "",
    description: "",
  });
  const [maintenanceSubmitting, setMaintenanceSubmitting] = useState(false);
  const [activityFilterDate, setActivityFilterDate] = useState("");
  const chartRef = useRef(null);
  const userDistributionChartRef = useRef(null);
  const canvasRef = useRef(null);

  // Email writer state for employee
  const [emailForm, setEmailForm] = useState({
    recipientType: "",
    recipientId: "",
    subject: "",
    message: "",
  });
  const [users, setUsers] = useState([]);
  const [emailSending, setEmailSending] = useState(false);

  const userType = JSON.parse(window.localStorage.getItem("whom"))?.userType || "";
  const userId = JSON.parse(window.localStorage.getItem("whom"))?.username || "";

  const [systemStatus, setSystemStatus] = useState({
    uptime: "0%",
    activeUsers: 0,
    alerts: 0,
  });
  const [quickStats, setQuickStats] = useState({
    totalLoginsToday: 0,
    totalComplaintsFiled: 0,
    pendingRequests: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  // Tenant-specific state
  const [tenantPaymentStatus, setTenantPaymentStatus] = useState(null);

  // Owner-specific state
  const [tenantOverview, setTenantOverview] = useState({ totalTenants: 0, activeLeases: 0 });

  // Employee-specific state
  const [pendingTasks, setPendingTasks] = useState([]);

  const rules = [
    {
      section: "Introduction",
      content: "Les présentes règles et régulations sont établies pour garantir un environnement de vie harmonieux, sûr et respectueux pour tous les résidents de l'appartement. Elles s'appliquent à tous les locataires, propriétaires, employés et visiteurs. Le non-respect de ces règles peut entraîner des sanctions, y compris des amendes ou la résiliation du bail.",
    },
    {
      section: "1. Règles Générales",
      rules: [
        {
          id: "1.1",
          title: "Respect des Autres Résidents",
          subrules: [
            {
              id: "1.1.1",
              text: "Le respect de l’intimité des voisins et de leur tranquillité est fondamental. Les résidents doivent éviter tout comportement perturbateur, y compris les nuisances sonores excessives (musique forte, cris, etc.), entre 22h00 et 7h00.",
            },
            {
              id: "1.1.2",
              text: "Les disputes ou comportements agressifs envers d'autres résidents ou le personnel sont strictement interdits.",
            },
          ],
        },
        {
          id: "1.2",
          title: "Propreté et Entretien",
          subrules: [
            {
              id: "1.2.1",
              text: "Les résidents sont invités à prendre soin des lieux et à signaler sans délai tout problème ou anomalie via l'application LocManager.",
            },
            {
              id: "1.2.2",
              text: "Les déchets sanitaires doivent être correctement emballés et déposés avec les ordures ménagères dans les poubelles désignées.",
            },
            {
              id: "1.2.3",
              text: "Il est interdit aux résidents d’intervenir sur les systèmes de chauffage, d’éclairage ou autres équipements du bâtiment. Toute intervention doit être effectuée par le personnel autorisé.",
            },
          ],
        },
        {
          id: "1.3",
          title: "Sécurité",
          subrules: [
            {
              id: "1.3.1",
              text: "En cas d’intempéries, les résidents doivent veiller à sécuriser les fenêtres pour leur propre sécurité.",
            },
            {
              id: "1.3.2",
              text: "La sécurité des femmes est une priorité absolue, avec des dispositions spécifiques pour garantir un cadre de vie sûr et agréable pour toutes.",
            },
            {
              id: "1.3.3",
              text: "Les résidents doivent verrouiller les portes et fenêtres lorsqu'ils quittent l'appartement.",
            },
          ],
        },
      ],
    },
    {
      section: "2. Utilisation des Espaces Communs",
      rules: [
        {
          id: "2.1",
          title: "Accès et Utilisation",
          subrules: [
            {
              id: "2.1.1",
              text: "Les espaces communs (couloirs, escaliers, parking, etc.) doivent être utilisés de manière respectueuse et ne pas être encombrés par des objets personnels.",
            },
            {
              id: "2.1.2",
              text: "Les résidents doivent nettoyer après utilisation des espaces communs (par exemple, après avoir utilisé une salle partagée).",
            },
          ],
        },
        {
          id: "2.2",
          title: "Règles de Stationnement",
          subrules: [
            {
              id: "2.2.1",
              text: "Le stationnement est autorisé uniquement dans les espaces réservés, marqués par des lignes jaunes, pour le confort de tous.",
            },
            {
              id: "2.2.2",
              text: "Les véhicules mal garés ou non autorisés seront remorqués aux frais du propriétaire.",
            },
          ],
        },
        {
          id: "2.3",
          title: "Gestion des Déchets",
          subrules: [
            {
              id: "2.3.1",
              text: "Les poubelles doivent être sorties selon le calendrier de collecte affiché dans l'application LocManager.",
            },
            {
              id: "2.3.2",
              text: "Les déchets encombrants doivent être signalés à l'administration pour une collecte spéciale.",
            },
          ],
        },
      ],
    },
    {
      section: "3. Règles de Vie en Communauté",
      rules: [
        {
          id: "3.1",
          title: "Animaux Domestiques",
          subrules: [
            {
              id: "3.1.1",
              text: "Les animaux domestiques sont autorisés uniquement avec l'approbation préalable de l'administration.",
            },
            {
              id: "3.1.2",
              text: "Les animaux doivent être tenus en laisse dans les espaces communs et ne doivent pas causer de nuisances (aboiements, saleté, etc.).",
            },
            {
              id: "3.1.3",
              text: "Les résidents sont responsables de nettoyer les déjections de leurs animaux.",
            },
          ],
        },
        {
          id: "3.2",
          title: "Visiteurs",
          subrules: [
            {
              id: "3.2.1",
              text: "Les visiteurs sont autorisés mais doivent être enregistrés via l'application LocManager si leur séjour dépasse 48 heures.",
            },
            {
              id: "3.2.2",
              text: "Les résidents sont responsables du comportement de leurs visiteurs et doivent s'assurer qu'ils respectent les règles de l'appartement.",
            },
          ],
        },
        {
          id: "3.3",
          title: "Fêtes et Rassemblements",
          subrules: [
            {
              id: "3.3.1",
              text: "Les fêtes ou rassemblements de plus de 10 personnes doivent être signalés à l'administration au moins 48 heures à l'avance.",
            },
            {
              id: "3.3.2",
              text: "Les fêtes bruyantes après 22h00 sont interdites.",
            },
          ],
        },
      ],
    },
    {
      section: "4. Paiements et Obligations Financières",
      rules: [
        {
          id: "4.1",
          title: "Loyer et Charges",
          subrules: [
            {
              id: "4.1.1",
              text: "Les loyers doivent être réglés à la date convenue pour assurer une cohabitation harmonieuse. Le paiement doit être effectué avant le 5 de chaque mois via l'application LocManager.",
            },
            {
              id: "4.1.2",
              text: "Les charges (eau, électricité, entretien des espaces communs) sont incluses dans le loyer et doivent être réglées en même temps.",
            },
            {
              id: "4.1.3",
              text: "Tout retard de paiement entraînera une pénalité de 5 % du montant dû par jour de retard.",
            },
          ],
        },
        {
          id: "4.2",
          title: "Dépôt de Garantie",
          subrules: [
            {
              id: "4.2.1",
              text: "Les dépôts de garantie seront restitués rapidement après inspection, sous réserve que l’appartement soit rendu sans dommages. Le dépôt sera remboursé dans les 30 jours suivant la fin du bail, après déduction des éventuels frais de réparation ou de nettoyage.",
            },
            {
              id: "4.2.2",
              text: "Un dépôt de garantie équivalent à un mois de loyer est requis à la signature du bail.",
            },
          ],
        },
        {
          id: "4.3",
          title: "Assurance",
          subrules: [
            {
              id: "4.3.1",
              text: "Les résidents doivent souscrire une assurance suffisante pour couvrir leurs biens personnels.",
            },
          ],
        },
      ],
    },
    {
      section: "5. Maintenance et Réparations",
      rules: [
        {
          id: "5.1",
          title: "Signalement des Problèmes",
          subrules: [
            {
              id: "5.1.1",
              text: "Les résidents doivent signaler tout problème de maintenance (fuites, pannes, etc.) via l'application LocManager dans les 24 heures.",
            },
            {
              id: "5.1.2",
              text: "Les réparations mineures (ampoules, petits dommages) sont à la charge du résident, sauf accord contraire.",
            },
          ],
        },
        {
          id: "5.2",
          title: "Accès pour Réparations",
          subrules: [
            {
              id: "5.2.1",
              text: "L'administration peut accéder à l'appartement pour des réparations ou inspections avec un préavis de 24 heures, sauf en cas d'urgence.",
            },
            {
              id: "5.2.2",
              text: "Les résidents doivent permettre l'accès au personnel de maintenance pendant les heures de travail (8h00-18h00).",
            },
          ],
        },
        {
          id: "5.3",
          title: "Modifications de l'Appartement",
          subrules: [
            {
              id: "5.3.1",
              text: "Toute modification de l’appartement requiert une autorisation écrite préalable de l’administration.",
            },
          ],
        },
      ],
    },
    {
      section: "6. Sanctions et Résiliation",
      rules: [
        {
          id: "6.1",
          title: "Infractions Mineures",
          subrules: [
            {
              id: "6.1.1",
              text: "Les infractions mineures (bruit, non-respect des règles de propreté) entraîneront un avertissement écrit.",
            },
            {
              id: "6.1.2",
              text: "Une amende de 50 € sera appliquée pour chaque infraction répétée après le premier avertissement.",
            },
          ],
        },
        {
          id: "6.2",
          title: "Infractions Graves",
          subrules: [
            {
              id: "6.2.1",
              text: "Les infractions graves (comportement violent, dommages intentionnels, non-paiement du loyer) peuvent entraîner une résiliation immédiate du bail.",
            },
            {
              id: "6.2.2",
              text: "Les résidents seront tenus responsables des frais de réparation ou de remplacement en cas de dommages.",
            },
          ],
        },
        {
          id: "6.3",
          title: "Procédure de Résiliation",
          subrules: [
            {
              id: "6.3.1",
              text: "Un préavis de 30 jours est requis pour résilier le bail, sauf en cas d'infraction grave.",
            },
            {
              id: "6.3.2",
              text: "L'appartement doit être rendu dans son état initial, sous réserve d'une inspection finale.",
            },
          ],
        },
      ],
    },
    {
      section: "7. Utilisation de l'Application LocManager",
      rules: [
        {
          id: "7.1",
          title: "Gestion des Demandes",
          subrules: [
            {
              id: "7.1.1",
              text: "Toutes les demandes (maintenance, plaintes, paiements) doivent être soumises via l'application LocManager.",
            },
            {
              id: "7.1.2",
              text: "Les résidents doivent vérifier leur adresse e-mail dans l'application pour recevoir les notifications importantes.",
            },
          ],
        },
        {
          id: "7.2",
          title: "Communication",
          subrules: [
            {
              id: "7.2.1",
              text: "Les annonces officielles (calendrier de collecte des déchets, événements communautaires) seront publiées dans l'application.",
            },
            {
              id: "7.2.2",
              text: "Les résidents doivent consulter l'application régulièrement pour rester informés.",
            },
          ],
        },
      ],
    },
    {
      section: "8. Dispositions Finales",
      rules: [
        {
          id: "8.1",
          title: "Modifications des Règles",
          subrules: [
            {
              id: "8.1.1",
              text: "L’administration s’efforce de créer une ambiance chaleureuse, comme un second chez-soi, en plaçant le bien-être et la satisfaction des résidents au cœur de ses priorités.",
            },
            {
              id: "8.1.2",
              text: "L'administration se réserve le droit de modifier ces règles à tout moment. Les résidents seront informés des changements via l'application LocManager.",
            },
            {
              id: "8.1.3",
              text: "Les nouvelles règles entreront en vigueur 7 jours après leur publication.",
            },
          ],
        },
        {
          id: "8.2",
          title: "Acceptation des Règles",
          subrules: [
            {
              id: "8.2.1",
              text: "En signant le bail, les résidents acceptent de se conformer à ces règles et régulations.",
            },
            {
              id: "8.2.2",
              text: "Les visiteurs et employés sont également tenus de respecter ces règles lorsqu'ils se trouvent dans l'appartement.",
            },
          ],
        },
      ],
    },
  ];

  const userStats = {
    totalUsers: forBox.reduce((sum, item) => sum + (item.value || 0), 0),
    averageOwnerAge: 0,
    averageTenantAge: 0,
    averageEmployeeAge: 0,
    activeOwners: 0,
    activeTenants: 0,
    activeEmployees: 0,
    ownerPercentage: 0,
    tenantPercentage: 0,
    employeePercentage: 0,
  };

  const [userStatsData, setUserStatsData] = useState(userStats);

  const quickLinks = [
    { name: "Manuel de l'utilisateur", icon: <FaBook />, url: "/user-manual" },
    { name: "Contacter le support", icon: <FaHeadset />, url: "/support" },
    { name: "Portail de gestion", icon: <FaLink />, url: "/management-portal" },
  ];

  const renderEmptyPlaceholder = (message) => (
    <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-2">
      <FaExclamationCircle className="inline-block mr-1" />
      {message}
    </div>
  );

  const renderSkeletonLoader = () => (
    <div className="animate-pulse space-y-4">
      <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-2/3"></div>
    </div>
  );

  const fetchSystemStatusAndQuickStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const [systemStatusResponse, quickStatsResponse] = await Promise.all([
        axios.get(`${process.env.REACT_APP_SERVER}/systemstatus`),
        axios.get(`${process.env.REACT_APP_SERVER}/quickstats`),
      ]);

      const systemStatusData = {
        uptime: systemStatusResponse.data.uptime || "0%",
        activeUsers: systemStatusResponse.data.activeUsers || 0,
        alerts: systemStatusResponse.data.alerts || 0,
      };

      const quickStatsData = {
        totalLoginsToday: quickStatsResponse.data.totalLoginsToday || 0,
        totalComplaintsFiled: quickStatsResponse.data.totalComplaintsFiled || 0,
        pendingRequests: quickStatsResponse.data.pendingRequests || 0,
      };

      setSystemStatus(systemStatusData);
      setQuickStats(quickStatsData);
    } catch (error) {
      console.error("Error fetching system status or quick stats:", error);
      toast.error("Erreur lors de la récupération des statistiques du système.");
      setStatsError("Impossible de charger les statistiques. Veuillez réessayer.");
      setSystemStatus({ uptime: "0%", activeUsers: 0, alerts: 0 });
      setQuickStats({ totalLoginsToday: 0, totalComplaintsFiled: 0, pendingRequests: 0 });
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchMaintenanceRequests = useCallback(async () => {
    const whom = JSON.parse(window.localStorage.getItem("whom"))?.userType;
    const userId = JSON.parse(window.localStorage.getItem("whom"))?.username;
    if (!whom || !userId) {
      console.error("User not logged in");
      toast.error("Utilisateur non connecté. Veuillez vous connecter.");
      return [];
    }
    try {
      const response = await axios.post(`${process.env.REACT_APP_SERVER}/maintenancerequests`, {
        userId,
        userType: whom,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching maintenance requests:", error.response?.data || error.message);
      toast.error("Erreur lors de la récupération des demandes de maintenance : " + (error.response?.data?.error || error.message));
      return [];
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      const data = await fetchMaintenanceRequests();
      const uniqueRequests = Array.from(new Map(data.map((item) => [item.id, item])).values());
      setMaintenanceRequests(uniqueRequests);
    } catch (error) {
      console.error("Error in fetchRequests:", error);
    }
  }, [fetchMaintenanceRequests]);

  const fetchUsersForMessaging = useCallback(async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_SERVER}/usersformessaging`);
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users for messaging:", error.response?.data || error.message);
      toast.error("Erreur lors de la récupération des utilisateurs pour la messagerie.");
      setUsers([]);
    }
  }, []);

  const fetchTenantPaymentStatus = useCallback(async () => {
    if (userType !== "tenant") return;
    try {
      const response = await axios.post(`${process.env.REACT_APP_SERVER}/paymentstatus`, { userId });
      setTenantPaymentStatus(response.data);
    } catch (error) {
      console.error("Error fetching tenant payment status:", error.response?.data || error.message);
      toast.error("Erreur lors de la récupération du statut de paiement.");
    }
  }, [userType, userId]);

  const fetchTenantOverview = useCallback(async () => {
    if (userType !== "owner") return;
    try {
      const response = await axios.post(`${process.env.REACT_APP_SERVER}/tenantoverview`, { userId });
      setTenantOverview({
        totalTenants: response.data.totalTenants || 0,
        activeLeases: response.data.activeLeases || 0,
      });
    } catch (error) {
      console.error("Error fetching tenant overview:", error.response?.data || error.message);
      toast.error("Erreur lors de la récupération de l'aperçu des locataires.");
    }
  }, [userType, userId]);

  const fetchPendingTasks = useCallback(async () => {
    if (userType !== "employee") return;
    try {
      const response = await axios.post(`${process.env.REACT_APP_SERVER}/pendingtasks`, { userId });
      setPendingTasks(response.data || []);
    } catch (error) {
      console.error("Error fetching pending tasks:", error.response?.data || error.message);
      toast.error("Erreur lors de la récupération des tâches en attente.");
    }
  }, [userType, userId]);

  useEffect(() => {
    fetchRequests();
    if (userType === "employee") {
      fetchUsersForMessaging();
      fetchPendingTasks();
    }
    if (userType === "tenant") {
      fetchTenantPaymentStatus();
    }
    if (userType === "owner") {
      fetchTenantOverview();
    }
  }, [fetchRequests, fetchUsersForMessaging, fetchPendingTasks, fetchTenantPaymentStatus, fetchTenantOverview, userType]);

  const getBoxInfo = async () => {
    setLoading(true);
    setError(null);
    setUserDetails({});
    setUserName("Utilisateur");
    try {
      const whomData = JSON.parse(window.localStorage.getItem("whom"));
      const whom = whomData?.userType;
      const userId = whomData?.username;
      const adminId = whomData?.adminId;
  
      if (!whom || !userId) {
        setError("Utilisateur non connecté. Veuillez vous connecter.");
        return;
      }
  
      const [dashboardRes, activitiesRes, notificationsRes, adminRes, complaintsRes, paymentRes] = await Promise.all([
        axios.post(`${process.env.REACT_APP_SERVER}/dashboard/${whom}`, { userId }),
        ["tenant", "owner", "admin"].includes(whom)
          ? axios.post(`${process.env.REACT_APP_SERVER}/recentactivities`, { userId, userType: whom })
          : Promise.resolve({ data: [] }),
        ["tenant", "owner", "admin"].includes(whom)
          ? axios.post(`${process.env.REACT_APP_SERVER}/notifications`, { userId, userType: whom })
          : Promise.resolve({ data: [] }),
        whom === "admin" && adminId
          ? axios.post(`${process.env.REACT_APP_SERVER}/block_admin`, { admin_id: adminId })
          : Promise.resolve({ data: { admin_name: "Inconnu", block_no: "N/A" } }),
        ["owner", "tenant"].includes(whom)
          ? axios.post(`${process.env.REACT_APP_SERVER}/ownercomplaints`, { userId })
          : Promise.resolve({ data: [] }),
        whom === "tenant"
          ? axios.post(`${process.env.REACT_APP_SERVER}/paymentstatus`, { userId })
          : Promise.resolve({ data: null }),
      ]);
  
      let boxData = [];
      if (whom === "admin") {
        boxData = [
          { label: "Total propriétaires", value: dashboardRes.data.totalowner || 0, icon: <FaUser /> },
          { label: "Total locataires", value: dashboardRes.data.totaltenant || 0, icon: <FaUsers /> },
          { label: "Total employés", value: dashboardRes.data.totalemployee || 0, icon: <FaBriefcase /> },
          { label: "Demandes en attente", value: quickStats.pendingRequests || 0, icon: <FaExclamationTriangle /> },
        ];
        setUserDetails({
          name: adminRes.data.admin_name || "Inconnu",
          block_no: adminRes.data.block_no || "N/A",
        });
        setUserName(adminRes.data.admin_name || "Utilisateur");
  
        const totalUsers = (dashboardRes.data.totalowner || 0) + (dashboardRes.data.totaltenant || 0) + (dashboardRes.data.totalemployee || 0);
        const ownerPercentage = totalUsers > 0 ? ((dashboardRes.data.totalowner / totalUsers) * 100).toFixed(1) : 0;
        const tenantPercentage = totalUsers > 0 ? ((dashboardRes.data.totaltenant / totalUsers) * 100).toFixed(1) : 0;
        const employeePercentage = totalUsers > 0 ? ((dashboardRes.data.totalemployee / totalUsers) * 100).toFixed(1) : 0;
  
        setUserStatsData({
          totalUsers,
          averageOwnerAge: parseFloat(dashboardRes.data.avgOwnerAge || 0).toFixed(1),
          averageTenantAge: parseFloat(dashboardRes.data.avgTenantAge || 0).toFixed(1),
          averageEmployeeAge: parseFloat(dashboardRes.data.avgEmployeeAge || 0).toFixed(1),
          activeOwners: dashboardRes.data.activeOwners || 0,
          activeTenants: dashboardRes.data.activeTenants || 0,
          activeEmployees: dashboardRes.data.activeEmployees || 0,
          ownerPercentage,
          tenantPercentage,
          employeePercentage,
        });
      } else if (whom === "owner") {
        boxData = [
          { label: "Nombre d'employés", value: dashboardRes.data.totalemployee || 0, icon: <FaUsers /> },
          { label: "Nombre total de plaintes", value: dashboardRes.data.totalcomplaint || 0, icon: <FaExclamationTriangle /> },
        ];
        setUserDetails(dashboardRes.data.owner || {});
        setUserName(dashboardRes.data.owner?.name || "Utilisateur");
      } else if (whom === "employee") {
        boxData = [
          { label: "Nombre total de plaintes", value: dashboardRes.data.totalcomplaint || 0, icon: <FaExclamationTriangle /> },
          { label: "Salaire", value: "Euros " + (dashboardRes.data.salary || "0"), icon: <FaMoneyBillWave /> },
        ];
        setUserDetails({
          name: dashboardRes.data.emp_name || "Inconnu",
          block_no: dashboardRes.data.block_no || "N/A",
          block_name: dashboardRes.data.block_name || "Inconnu",
        });
        setUserName(dashboardRes.data.emp_name || "Utilisateur");
      } else if (whom === "tenant") {
        boxData = [
          { label: "ID locataire", value: dashboardRes.data[0]?.tenant_id ? `t-${dashboardRes.data[0].tenant_id}` : "N/A", icon: <FaUser /> },
          { label: "Nom du locataire", value: dashboardRes.data[0]?.name || "Inconnu", icon: <FaUser /> },
          { label: "Âge du locataire", value: dashboardRes.data[0]?.age || "Inconnu", icon: <FaUser /> },
          { label: "Date de naissance", value: dashboardRes.data[0]?.dob || "Inconnu", icon: <FaUser /> },
        ];
        try {
          const blockRes = await axios.post(`${process.env.REACT_APP_SERVER}/block`, { room_no: dashboardRes.data[0]?.room_no });
          setUserDetails({
            name: dashboardRes.data[0]?.name || "Inconnu",
            block_no: blockRes.data.block_no || "N/A",
            block_name: blockRes.data.block_name || "Inconnu",
            room_no: dashboardRes.data[0]?.room_no || "N/A",
          });
          setMaintenanceForm({ ...maintenanceForm, room_no: dashboardRes.data[0]?.room_no || "" });
        } catch (blockError) {
          console.error("Error fetching block data:", blockError.response?.data || blockError.message);
          setUserDetails({
            name: dashboardRes.data[0]?.name || "Inconnu",
            block_no: "N/A",
            block_name: "Inconnu",
            room_no: dashboardRes.data[0]?.room_no || "N/A",
          });
        }
        setUserName(dashboardRes.data[0]?.name || "Utilisateur");
      }
  
      setForBox(boxData);
      setRecentActivities(activitiesRes.data);
      setFilteredActivities(activitiesRes.data);
      setNotifications(notificationsRes.data);
      setComplaintSummary(activitiesRes.data.slice(0, 2));
      setPaymentStatus(paymentRes.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des données du tableau de bord:", error.response?.data || error.message);
      if (error.response?.status === 404) {
        if (error.response?.data?.error === "Owner not found") {
          setError("Propriétaire non trouvé. Veuillez vérifier votre compte.");
        } else if (error.response?.data?.error && error.response.data.error.includes("Employee not found")) {
          setError("Employé non trouvé. Veuillez vérifier votre compte.");
        } else {
          setError("Impossible de charger les données du tableau de bord. L'endpoint est introuvable.");
        }
      } else {
        setError("Une erreur s'est produite lors de la récupération des données. Veuillez réessayer.");
      }
      toast.error("Erreur lors de la récupération des données du tableau de bord.");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setMaintenanceSubmitting(true);
    try {
      const userId = JSON.parse(window.localStorage.getItem("whom"))?.username;
      await axios.post(`${process.env.REACT_APP_SERVER}/submitmaintenancerequest`, {
        userId,
        userType: JSON.parse(window.localStorage.getItem("whom"))?.userType,
        room_no: maintenanceForm.room_no,
        description: maintenanceForm.description,
      });
      toast.success("Demande de maintenance soumise avec succès");
      setMaintenanceForm({ description: "", room_no: userDetails?.room_no || "" });
      fetchRequests();
    } catch (error) {
      toast.error("Erreur lors de la soumission de la demande : " + (error.response?.data?.error || error.message));
    } finally {
      setMaintenanceSubmitting(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setEmailSending(true);
    try {
      const { recipientType, recipientId, subject, message } = emailForm;
      if (!recipientType || !recipientId || !subject || !message) {
        toast.error("Veuillez remplir tous les champs.");
        return;
      }

      await axios.post(`${process.env.REACT_APP_SERVER}/sendmessage`, {
        sender_id: userId.split("-")[1],
        sender_type: userType,
        receiver_id: recipientId,
        receiver_type: recipientType,
        subject,
        message,
      });
      toast.success("Message envoyé avec succès");
      setEmailForm({ recipientType: "", recipientId: "", subject: "", message: "" });
    } catch (error) {
      toast.error("Erreur lors de l'envoi du message : " + (error.response?.data?.error || error.message));
    } finally {
      setEmailSending(false);
    }
  };

  const fetchWeather = useCallback(async () => {
    setWeatherLoading(true);
    setWeatherError(null);
    const url = `${process.env.REACT_APP_SERVER}/weather?city=${weatherCity}`;
    try {
      const res = await axios.get(url);
      if (typeof res.data === "string" || !res.data.main || !res.data.weather) {
        throw new Error("Invalid weather data received from server");
      }
      setWeather(res.data);
    } catch (error) {
      console.error("Erreur lors de la récupération de la météo:", error.response?.data || error.message);
      const errorMessage = error.response?.data?.details || error.response?.data?.error || error.message || "Impossible de récupérer les données météo.";
      setWeatherError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setWeatherLoading(false);
    }
  }, [weatherCity]);

  const handleActivityFilter = (date) => {
    if (!date) {
      setFilteredActivities(recentActivities);
      return;
    }
    const filterDate = new Date(date);
    const filtered = recentActivities.filter((activity) => {
      const activityDate = new Date(activity.date);
      return (
        activityDate.getFullYear() === filterDate.getFullYear() &&
        activityDate.getMonth() === filterDate.getMonth() &&
        activityDate.getDate() === filterDate.getDate()
      );
    });
    setFilteredActivities(filtered);
  };

  const markActivityAsRead = (index) => {
    const updatedActivities = recentActivities.filter((_, i) => i !== index);
    setRecentActivities(updatedActivities);
    setFilteredActivities(updatedActivities);
  };

  const resolveAllComplaints = async () => {
    try {
      const unresolvedComplaints = complaintSummary.filter(complaint => !complaint.resolved);
      await Promise.all(unresolvedComplaints.map(complaint =>
        axios.post(`${process.env.REACT_APP_SERVER}/deletecomplaint`, { room_no: complaint.room_no })
      ));
      toast.success("Toutes les plaintes non résolues ont été résolues avec succès");
      getBoxInfo();
    } catch (error) {
      toast.error("Erreur lors de la résolution des plaintes : " + (error.response?.data?.error || error.message));
    }
  };

  const refreshAdminData = async () => {
    await Promise.all([
      fetchSystemStatusAndQuickStats(),
      getBoxInfo(),
    ]);
    toast.success("Données actualisées avec succès");
  };

  useEffect(() => {
    let isMounted = true;

    const whom = JSON.parse(window.localStorage.getItem("whom"));
    if (!whom || !whom.userType || !whom.username) {
      toast.error("Veuillez vous connecter pour accéder au tableau de bord.");
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      if (!isMounted) return;
      await getBoxInfo();
      await fetchWeather();
      await fetchSystemStatusAndQuickStats();
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [navigate, fetchSystemStatusAndQuickStats]);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    if (["owner", "tenant"].includes(userType) && complaintSummary.length > 0) {
      const ctx = document.getElementById("complaintsChart")?.getContext("2d");
      if (ctx) {
        chartRef.current = new Chart(ctx, {
          type: "line",
          data: {
            labels: complaintSummary.map((_, index) => `Plainte ${index + 1}`),
            datasets: [
              {
                label: "Plaintes",
                data: complaintSummary.map((_, index) => index + 1),
                borderColor: darkMode ? "rgba(255, 99, 132, 1)" : "rgba(54, 162, 235, 1)",
                backgroundColor: darkMode ? "rgba(255, 99, 132, 0.2)" : "rgba(54, 162, 235, 0.2)",
                fill: true,
              },
            ],
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
              },
            },
          },
        });
      }
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [complaintSummary, darkMode, userType]);

  useEffect(() => {
    if (userDistributionChartRef.current) {
      userDistributionChartRef.current.destroy();
      userDistributionChartRef.current = null;
    }

    if (userType === "admin" && forBox.length > 0 && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        const chartData = [
          forBox[0]?.value || 0, // Propriétaires
          forBox[1]?.value || 0, // Locataires
          forBox[2]?.value || 0, // Employés
        ];

        const chartLabels = ["Propriétaires", "Locataires", "Employés"];
        const chartColors = [
          "rgba(34, 197, 94, 0.7)",  // Green for Propriétaires
          "rgba(54, 162, 235, 0.7)", // Blue for Locataires
          "rgba(249, 115, 22, 0.7)", // Orange for Employés
        ];
        const chartBorderColors = [
          "rgba(34, 197, 94, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(249, 115, 22, 1)",
        ];

        const nonZeroData = chartData.filter(value => value > 0);
        const nonZeroLabels = chartLabels.filter((_, i) => chartData[i] > 0);
        const nonZeroColors = chartColors.filter((_, i) => chartData[i] > 0);
        const nonZeroBorderColors = chartBorderColors.filter((_, i) => chartData[i] > 0);

        userDistributionChartRef.current = new Chart(ctx, {
          type: "pie",
          data: {
            labels: nonZeroLabels,
            datasets: [
              {
                label: "Répartition des utilisateurs",
                data: nonZeroData,
                backgroundColor: nonZeroColors,
                borderColor: nonZeroBorderColors,
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "top",
                labels: {
                  color: darkMode ? "#e5e7eb" : "#1f2937",
                  font: {
                    size: 12,
                  },
                  generateLabels: (chart) => {
                    const data = chart.data;
                    if (data.labels.length && data.datasets.length) {
                      return data.labels.map((label, i) => {
                        const value = data.datasets[0].data[i];
                        return {
                          text: `${label}: ${value}`,
                          fillStyle: data.datasets[0].backgroundColor[i],
                          strokeStyle: data.datasets[0].borderColor[i],
                          lineWidth: data.datasets[0].borderWidth,
                          hidden: isNaN(value) || value === 0,
                          index: i,
                        };
                      });
                    }
                    return [];
                  },
                },
              },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const label = context.label || "";
                    const value = context.raw || 0;
                    const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                    const percentage = ((value / total) * 100).toFixed(1);
                    return `${label}: ${value} (${percentage}%)`;
                  },
                },
              },
            },
          },
        });
      }
    }

    return () => {
      if (userDistributionChartRef.current) {
        userDistributionChartRef.current.destroy();
        userDistributionChartRef.current = null;
      }
    };
  }, [forBox, darkMode, userType]);

  const toggleRules = () => {
    setShowRules(!showRules);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const markNotificationAsRead = (id) => {
    setNotifications(notifications.filter((notif) => notif.id !== id));
  };

  const exportUserData = async () => {
    try {
      const whom = JSON.parse(window.localStorage.getItem("whom"))?.userType;
      if (whom !== "admin") {
        toast.error("Seuls les administrateurs peuvent exporter des données.");
        return;
      }

      const ownersRes = await axios.get(`${process.env.REACT_APP_SERVER}/ownerdetails`);
      const tenantsRes = await axios.get(`${process.env.REACT_APP_SERVER}/tenantdetails`);
      const employeesRes = await axios.get(`${process.env.REACT_APP_SERVER}/employee`);

      const owners = ownersRes.data;
      const tenants = tenantsRes.data;
      const employees = employeesRes.data || [];

      const csvData = [
        ["Type", "ID", "Nom", "Âge", "Numéro de chambre"],
        ...owners.map((owner) => [
          "Propriétaire",
          owner.owner_id,
          owner.name,
          owner.age,
          owner.room_no,
        ]),
        ...tenants.map((tenant) => [
          "Locataire",
          tenant.tenant_id,
          tenant.name,
          tenant.age,
          tenant.room_no,
        ]),
        ...employees.map((employee) => [
          "Employé",
          employee.emp_id,
          employee.name,
          employee.age || "N/A",
          "N/A",
        ]),
      ];

      const csvContent = csvData.map(row => row.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "user_data.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast.error("Erreur lors de l'exportation des données : " + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div
      onClick={() => {
        if (hamActive) {
          hamHandler();
        }
      }}
      style={{
        filter: hamActive ? "blur(2px)" : "blur(0px)",
      }}
      className="min-h-screen w-full transition-all duration-300 flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100"
    >
      {/* Main Content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse flex flex-col gap-4 w-full max-w-4xl mx-auto p-4">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 text-lg font-medium p-5 bg-white dark:bg-gray-800 rounded-lg shadow-md max-w-md mx-auto">
          <FaExclamationCircle className="inline-block mr-2" />
          {error}
          <button
            onClick={() => navigate("/login")}
            className="ml-4 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 dark:hover:bg-blue-700"
            aria-label="Se connecter"
          >
            Se connecter
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col p-6 md:p-8 gap-8">
          {/* Top Row: Profile and Weather (Common for All User Types) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-xl shadow-lg p-6 flex items-center gap-4 transition-all duration-300 hover:shadow-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 w-full border border-gray-200 dark:border-gray-700"
            >
              <div className="flex-shrink-0">
                <FaUser className="text-4xl text-blue-500" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-2">Profil</h2>
                <p className="text-base">Nom: {userDetails?.name || "Inconnu"}</p>
                <p className="text-base">Rôle: {userType || "Inconnu"}</p>
                {userType === "admin" ? (
                  <p className="text-base">Numéro du block: {userDetails?.block_no || "N/A"}</p>
                ) : userType === "tenant" ? (
                  <>
                    <p className="text-base">Numéro du block: {userDetails?.block_no || "N/A"}</p>
                    <p className="text-base">Nom du block: {userDetails?.block_name || "Inconnu"}</p>
                  </>
                ) : userType === "employee" ? (
                  <>
                    <p className="text-base">Numéro du block: {userDetails?.block_no || "N/A"}</p>
                    <p className="text-base">Nom du block: {userDetails?.block_name || "Inconnu"}</p>
                  </>
                ) : (
                  <p className="text-base">Numéro de chambre: {userDetails?.room_no || "N/A"}</p>
                )}
              </div>
              <Link
                to={`/profile/edit`}
                className="px-4 py-2 rounded-md text-sm transition-all duration-300 bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                aria-label="Modifier le profil"
              >
                Modifier le profil
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-xl shadow-lg p-6 flex items-center gap-4 transition-all duration-300 hover:shadow-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 w-full border border-gray-200 dark:border-gray-700"
            >
              <FaCloudSun className="text-4xl text-blue-500" />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-xl font-bold">Météo à</h2>
                  <select
                    value={weatherCity}
                    onChange={(e) => setWeatherCity(e.target.value)}
                    className="rounded-md border py-1 px-3 text-base transition-all duration-300 focus:ring-2 focus:ring-blue-500 bg-white text-gray-800 border-gray-300 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                    aria-label="Sélectionner une ville pour la météo"
                  >
                    <option value="Paris">Paris</option>
                    <option value="London">Londres</option>
                    <option value="New York">New York</option>
                    <option value="Tokyo">Tokyo</option>
                  </select>
                  <button
                    onClick={fetchWeather}
                    className="p-2 rounded-full transition-all duration-300 bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 relative group"
                    aria-label="Rafraîchir la météo"
                  >
                    <FaSyncAlt className={weatherLoading ? "animate-spin" : ""} size={16} />
                    <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-10 left-1/2 transform -translate-x-1/2">Rafraîchir</span>
                  </button>
                </div>
                {weatherLoading ? (
                  renderSkeletonLoader()
                ) : weatherError ? (
                  <div className="text-sm text-red-500">
                    <p>{weatherError}</p>
                    <button
                      onClick={fetchWeather}
                      className="mt-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-all duration-300"
                      aria-label="Réessayer de charger la météo"
                    >
                      Réessayer
                    </button>
                  </div>
                ) : weather && weather.main && weather.weather ? (
                  <>
                    <p className="text-base">Température: {weather.main.temp}°C</p>
                    <p className="text-base">Condition: {weather.weather[0].description}</p>
                    <p className="text-base">Humidité: {weather.main.humidity}%</p>
                    <p className="text-base">Vitesse du vent: {weather.wind.speed} m/s</p>
                  </>
                ) : (
                  <p className="text-base">Aucune donnée météo disponible. Veuillez réessayer.</p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Middle Row: Layout Based on User Type */}
          {userType === "tenant" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Dashboard Cards (2x2 Grid) */}
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
                {forBox.map((ele, index) => (
                  <motion.div
                    key={index + 1}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`p-6 rounded-xl shadow-lg transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-l-4 border-purple-500 w-full border border-gray-200 dark:border-gray-700`}
                  >
                    <div className="text-3xl text-blue-500">{ele.icon}</div>
                    <div>
                      <h1 className="font-bold text-2xl">{ele.value}</h1>
                      <p className="font-semibold text-sm uppercase text-gray-500 dark:text-gray-400 mt-2 tracking-wide">
                        {ele.label}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Actions Rapides and Payment Status (Stacked) */}
              <div className="flex flex-col gap-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 w-full border border-gray-200 dark:border-gray-700"
                >
                  <h2 className="text-xl font-bold mb-4 text-center">Actions Rapides</h2>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={async () => {
                        try {
                          const userId = JSON.parse(window.localStorage.getItem("whom")).username;
                          await axios.post(`${process.env.REACT_APP_SERVER}/paymaintanance`, { id: userId });
                          toast.success("Paiement effectué avec succès");
                          getBoxInfo();
                          fetchTenantPaymentStatus();
                        } catch (error) {
                          toast.error("Erreur lors du paiement : " + (error.response?.data?.error || error.message));
                        }
                      }}
                      className="p-3 rounded-lg shadow-md text-center transition-all duration-300 flex items-center justify-center gap-2 text-base bg-green-500 text-white hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
                      aria-label="Payer l'entretien"
                    >
                      <FaMoneyBillWave />
                      Payer l'entretien
                    </button>
                    <Link
                      to="/tenant/filecomplaint"
                      className="p-3 rounded-lg shadow-md text-center transition-all duration-300 flex items-center justify-center gap-2 text-base bg-yellow-500 text-white hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700"
                      aria-label="Déposer une plainte"
                    >
                      <FaExclamationTriangle />
                      Déposer une plainte
                    </Link>
                    <Link
                      to="/tenant/bookslot"
                      className="p-3 rounded-lg shadow-md text-center transition-all duration-300 flex items-center justify-center gap-2 text-base bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                      aria-label="Réserver un emplacement de parking"
                    >
                      <FaCar />
                      Réserver un emplacement de parking
                    </Link>
                    <Link
                      to="/tenant/viewparking"
                      className="p-3 rounded-lg shadow-md text-center transition-all duration-300 flex items-center justify-center gap-2 text-base bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                      aria-label="Voir les emplacements de parking"
                    >
                      <FaEye />
                      Voir les emplacements de parking
                    </Link>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 w-full border border-gray-200 dark:border-gray-700 flex-1"
                >
                  <h2 className="text-xl font-bold mb-4 text-center">Statut de Paiement</h2>
                  {tenantPaymentStatus ? (
                    <div className="space-y-3">
                      <p className="text-base flex items-center gap-2">
                        <FaDollarSign className={`text-2xl ${tenantPaymentStatus.status === "overdue" ? "text-red-500" : "text-green-500"}`} />
                        <span className="font-semibold">Statut:</span>
                        <span className={tenantPaymentStatus.status === "overdue" ? "text-red-500" : "text-green-500"}>
                          {tenantPaymentStatus.status === "overdue" ? "En retard" : "À jour"}
                        </span>
                      </p>
                      {tenantPaymentStatus.status === "overdue" && (
                        <p className="text-base">Montant dû: {tenantPaymentStatus.amountDue} €</p>
                      )}
                      <p className="text-base">Prochain paiement: {tenantPaymentStatus.nextPaymentDate || "N/A"}</p>
                    </div>
                  ) : (
                    renderSkeletonLoader()
                  )}
                </motion.div>
              </div>
            </div>
          )}

          {userType === "owner" && (
            <div className="flex-1 flex flex-col gap-8">
              {/* Middle Row: Dashboard Cards, Actions, and Tenant Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Dashboard Cards (1x2 Grid) */}
                <div className="grid grid-cols-1 gap-8">
                  {forBox.map((ele, index) => (
                    <motion.div
                      key={index + 1}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className={`p-6 rounded-xl shadow-lg transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-l-4 border-green-500 w-full border border-gray-200 dark:border-gray-700`}
                    >
                      <div className="text-3xl text-blue-500">{ele.icon}</div>
                      <div>
                        <h1 className="font-bold text-2xl">{ele.value}</h1>
                        <p className="font-semibold text-sm uppercase text-gray-500 dark:text-gray-400 mt-2 tracking-wide">
                          {ele.label}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Actions Rapides and Tenant Overview (Stacked) */}
                <div className="flex flex-col gap-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 w-full border border-gray-200 dark:border-gray-700"
                  >
                    <h2 className="text-xl font-bold mb-4 text-center">Actions Rapides</h2>
                    <div className="flex flex-col gap-3">
                      <Link
                        to="/owner/createtenant"
                        className="p-3 rounded-lg shadow-md text-center transition-all duration-300 flex items-center justify-center gap-2 text-base bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                        aria-label="Créer un locataire"
                      >
                        <FaPlus />
                        Créer un locataire
                      </Link>
                      <Link
                        to="/owner/tenantdetails"
                        className="p-3 rounded-lg shadow-md text-center transition-all duration-300 flex items-center justify-center gap-2 text-base bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                        aria-label="Voir les locataires"
                      >
                        <FaUsers />
                        Voir les locataires
                      </Link>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 w-full border border-gray-200 dark:border-gray-700"
                  >
                    <h2 className="text-xl font-bold mb-4 text-center">Aperçu des Locataires</h2>
                    {tenantOverview.totalTenants > 0 ? (
                      <div className="space-y-3">
                        <p className="text-base flex items-center gap-2">
                          <FaUsers className="text-blue-500 text-2xl" />
                          <span className="font-semibold">Total Locataires:</span> {tenantOverview.totalTenants}
                        </p>
                        <p className="text-base flex items-center gap-2">
                          <FaFileAlt className="text-green-500 text-2xl" />
                          <span className="font-semibold">Baux Actifs:</span> {tenantOverview.activeLeases}
                        </p>
                      </div>
                    ) : (
                      renderSkeletonLoader()
                    )}
                  </motion.div>
                </div>
              </div>

              {/* Bottom Row: Recent Activities, Maintenance Requests, Complaint Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activities */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 w-full border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Activités Récentes</h2>
                    <div className="flex items-center gap-2">
                      <div className="relative group">
                        <input
                          type="date"
                          value={activityFilterDate}
                          onChange={(e) => {
                            setActivityFilterDate(e.target.value);
                            handleActivityFilter(e.target.value);
                          }}
                          className="p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 transition-all duration-300 bg-white text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                          aria-label="Filtrer les activités par date"
                        />
                        <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-10 left-1/2 transform -translate-x-1/2">Filtrer par date</span>
                      </div>
                      <button
                        onClick={() => {
                          setActivityFilterDate("");
                          handleActivityFilter("");
                        }}
                        className="p-2 rounded-full transition-all duration-300 bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 relative group"
                        aria-label="Effacer le filtre"
                      >
                        <FaFilter size={16} />
                        <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-10 left-1/2 transform -translate-x-1/2">Effacer le filtre</span>
                      </button>
                    </div>
                  </div>
                  {filteredActivities.length === 0 ? (
                    renderEmptyPlaceholder("Aucune activité récente.")
                  ) : (
                    <>
                      <ul className="space-y-2">
                        {(showAllActivities ? filteredActivities : filteredActivities.slice(0, 4)).map((activity, index) => (
                          <li key={index} className="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded-md">
                            <span>{activity.action}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                {new Date(activity.date).toLocaleString()}
                              </span>
                              <button
                                onClick={() => markActivityAsRead(index)}
                                className="text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-all duration-300 text-sm relative group"
                                aria-label="Marquer comme lu"
                              >
                                <FaCheck />
                                <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">Marquer comme lu</span>
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                      {filteredActivities.length > 4 && (
                        <button
                          onClick={() => setShowAllActivities(!showAllActivities)}
                          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-all duration-300 text-sm mt-3"
                          aria-label={showAllActivities ? "Afficher moins d'activités" : "Afficher plus d'activités"}
                        >
                          {showAllActivities ? "Afficher moins" : "Afficher plus"}
                        </button>
                      )}
                    </>
                  )}
                </motion.div>

                {/* Maintenance Requests */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 w-full border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Demandes de Maintenance Récentes</h2>
                    <Link
                      to={`/${userType}/maintenancerequests`}
                      className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-all duration-300 text-sm flex items-center gap-1 relative group"
                      aria-label="Voir toutes les demandes de maintenance"
                    >
                      <FaWrench />
                      Voir toutes les demandes
                      <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">Voir toutes les demandes</span>
                    </Link>
                  </div>
                  {maintenanceRequests.length === 0 ? (
                    renderEmptyPlaceholder("Aucune demande de maintenance récente.")
                  ) : (
                    <ul className="space-y-2">
                      {maintenanceRequests.map((request) => (
                        <li key={request.id} className="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded-md">
                          <span>Chambre {request.room_no}: {request.description}</span>
                          <span
                            className={`text-xs font-semibold ${
                              request.status?.toLowerCase() === "pending"
                                ? "text-red-500"
                                : request.status?.toLowerCase() === "in_progress"
                                ? "text-blue-500"
                                : request.status?.toLowerCase() === "resolved"
                                ? "text-green-500"
                                : "text-gray-400 dark:text-gray-500"
                            }`}
                          >
                            {request.status?.toLowerCase() === "pending"
                              ? "En attente"
                              : request.status?.toLowerCase() === "in_progress"
                              ? "En cours"
                              : request.status?.toLowerCase() === "resolved"
                              ? "Résolu"
                              : "Inconnu"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>

                {/* Complaint Summary */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 w-full border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Résumé des Plaintes Récentes</h2>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/${userType}/complaint`}
                        className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-all duration-300 text-sm flex items-center gap-1 relative group"
                        aria-label="Voir toutes les plaintes"
                      >
                        Voir toutes les plaintes
                        <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">Voir toutes les plaintes</span>
                      </Link>
                      {complaintSummary.some(complaint => !complaint.resolved) && (
                        <button
                          onClick={resolveAllComplaints}
                          className="text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-all duration-300 text-sm flex items-center gap-1 relative group"
                          aria-label="Résoudre toutes les plaintes"
                        >
                          Résoudre tout
                          <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">Résoudre toutes les plaintes</span>
                        </button>
                      )}
                    </div>
                  </div>
                  {complaintSummary.length === 0 ? (
                    renderEmptyPlaceholder("Aucune plainte récente.")
                  ) : (
                    <>
                      <ul className="space-y-2">
                        {complaintSummary.map((complaint) => (
                          <li key={complaint.room_no} className="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded-md">
                            <span>Chambre {complaint.room_no}: {complaint.complaints}</span>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-semibold ${complaint.resolved ? "text-green-500" : "text-red-500"}`}
                              >
                                {complaint.resolved ? "Résolu" : "Non résolu"}
                              </span>
                              {!complaint.resolved && userType === "owner" && (
                                <button
                                  onClick={async () => {
                                    try {
                                      await axios.post(`${process.env.REACT_APP_SERVER}/deletecomplaint`, { room_no: complaint.room_no });
                                      toast.success("Plainte résolue avec succès");
                                      getBoxInfo();
                                    } catch (error) {
                                      toast.error("Erreur lors de la résolution de la plainte : " + (error.response?.data?.error || error.message));
                                    }
                                  }}
                                  className="text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-all duration-300 text-sm relative group"
                                  aria-label="Résoudre la plainte"
                                >
                                  Résoudre
                                  <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">Résoudre</span>
                                </button>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4">
                        <canvas id="complaintsChart" height="150"></canvas>
                      </div>
                    </>
                  )}
                </motion.div>
              </div>
            </div>
          )}

          {userType === "employee" && (
            <div className="flex-1 flex flex-col gap-8">
              {/* Middle Row: Dashboard Cards, Actions, and Pending Tasks */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Dashboard Cards (1x2 Grid) */}
                <div className="lg:col-span-1 grid grid-cols-1 gap-8">
                  {forBox.map((ele, index) => (
                    <motion.div
                      key={index + 1}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className={`p-6 rounded-xl shadow-lg transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-l-4 border-yellow-500 w-full border border-gray-200 dark:border-gray-700`}
                    >
                      <div className="text-3xl text-blue-500">{ele.icon}</div>
                      <div>
                        <h1 className="font-bold text-2xl">{ele.value}</h1>
                        <p className="font-semibold text-sm uppercase text-gray-500 dark:text-gray-400 mt-2 tracking-wide">
                          {ele.label}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Actions Rapides and Pending Tasks (Stacked) */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 w-full border border-gray-200 dark:border-gray-700"
                  >
                    <h2 className="text-xl font-bold mb-4 text-center">Actions Rapides</h2>
                    <div className="flex flex-col gap-3">
                      <Link
                        to="/employee/viewcomplaints"
                        className="p-3 rounded-lg shadow-md text-center transition-all duration-300 flex items-center justify-center gap-2 text-base bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                        aria-label="Voir les plaintes"
                      >
                        <FaFileAlt />
                        Voir les plaintes
                      </Link>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 w-full border border-gray-200 dark:border-gray-700 flex-1"
                  >
                    <h2 className="text-xl font-bold mb-4 text-center">Tâches en Attente</h2>
                    {pendingTasks.length === 0 ? (
                      renderEmptyPlaceholder("Aucune tâche en attente.")
                    ) : (
                      <ul className="space-y-2">
                        {pendingTasks.slice(0, 3).map((task, index) => (
                          <li key={index} className="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded-md">
                            <span>{task.description}</span>
                            <span
                              className={`text-xs font-semibold ${
                                task.status?.toLowerCase() === "pending"
                                  ? "text-red-500"
                                  : task.status?.toLowerCase() === "in_progress"
                                  ? "text-blue-500"
                                  : "text-green-500"
                              }`}
                            >
                              {task.status?.toLowerCase() === "pending"
                                ? "En attente"
                                : task.status?.toLowerCase() === "in_progress"
                                ? "En cours"
                                : "Résolu"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                </div>
              </div>

              {/* Bottom Row: Email Writer and Maintenance Requests */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Email Writer */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 w-full border border-gray-200 dark:border-gray-700"
                >
                  <h2 className="text-xl font-bold mb-4 text-center flex items-center justify-center gap-2">
                    <FaEnvelope className="text-blue-500 text-2xl" />
                    Envoyer un Message
                  </h2>
                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">Type de destinataire</label>
                        <select
                          value={emailForm.recipientType}
                          onChange={(e) => {
                            setEmailForm({ ...emailForm, recipientType: e.target.value, recipientId: "" });
                          }}
                          className={`w-full p-2 border rounded text-sm transition-all duration-300 focus:ring-2 focus:ring-blue-500 ${
                            darkMode ? "bg-gray-700 text-gray-200 border-gray-600" : "bg-white text-gray-800 border-gray-300"
                          }`}
                          required
                        >
                          <option value="">Sélectionnez un type</option>
                          <option value="admin">Administrateur</option>
                          <option value="owner">Propriétaire</option>
                        </select>
                      </div>
                      {emailForm.recipientType && (
                        <div className="flex-1">
                          <label className="block text-sm font-medium mb-1">Destinataire</label>
                          <select
                            value={emailForm.recipientId}
                            onChange={(e) => setEmailForm({ ...emailForm, recipientId: e.target.value })}
                            className={`w-full p-2 border rounded text-sm transition-all duration-300 focus:ring-2 focus:ring-blue-500 ${
                              darkMode ? "bg-gray-700 text-gray-200 border-gray-600" : "bg-white text-gray-800 border-gray-300"
                            }`}
                            required
                          >
                            <option value="">Sélectionnez un destinataire</option>
                            {users
                              .filter((u) => u.type === emailForm.recipientType)
                              .map((u) => (
                                <option key={`${u.type}-${u.id}`} value={u.id}>
                                  {u.name} ({u.type === "admin" ? "Administrateur" : "Propriétaire"})
                                </option>
                              ))}
                          </select>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Sujet</label>
                      <input
                        type="text"
                        value={emailForm.subject}
                        onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                        className={`w-full p-2 border rounded text-sm transition-all duration-300 focus:ring-2 focus:ring-blue-500 ${
                          darkMode ? "bg-gray-700 text-gray-200 border-gray-600" : "bg-white text-gray-800 border-gray-300"
                        }`}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Message</label>
                      <textarea
                        value={emailForm.message}
                        onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                        className={`w-full p-2 border rounded text-sm transition-all duration-300 h-24 resize-none focus:ring-2 focus:ring-blue-500 ${
                          darkMode ? "bg-gray-700 text-gray-200 border-gray-600" : "bg-white text-gray-800 border-gray-300"
                        }`}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={emailSending}
                      className={`w-full p-3 rounded-lg text-base transition-all duration-300 flex items-center justify-center gap-2 ${
                        emailSending
                          ? "bg-gray-500 cursor-not-allowed"
                          : darkMode
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-blue-500 text-white hover:bg-blue-600"
                      }`}
                    >
                      <FaPaperPlane />
                      {emailSending ? "Envoi en cours..." : "Envoyer le message"}
                    </button>
                  </form>
                </motion.div>

                {/* Maintenance Requests */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 w-full border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Demandes de Maintenance Récentes</h2>
                    <Link
                      to={`/${userType}/maintenancerequests`}
                      className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-all duration-300 text-sm flex items-center gap-1 relative group"
                      aria-label="Voir toutes les demandes de maintenance"
                    >
                      <FaWrench />
                      Voir toutes les demandes
                      <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
                        Voir toutes les demandes
                      </span>
                    </Link>
                  </div>
                  {maintenanceRequests.length === 0 ? (
                    renderEmptyPlaceholder("Aucune demande de maintenance récente.")
                  ) : (
                    <ul className="space-y-2">
                      {maintenanceRequests.map((request) => (
                        <li key={request.id} className="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded-md">
                          <span>Chambre {request.room_no}: {request.description}</span>
                          <span
                            className={`text-xs font-semibold ${
                              request.status?.toLowerCase() === "pending"
                                ? "text-red-500"
                                : request.status?.toLowerCase() === "in_progress"
                                ? "text-blue-500"
                                : request.status?.toLowerCase() === "resolved"
                                ? "text-green-500"
                                : "text-gray-400 dark:text-gray-500"
                            }`}
                          >
                            {request.status?.toLowerCase() === "pending"
                              ? "En attente"
                              : request.status?.toLowerCase() === "in_progress"
                              ? "En cours"
                              : request.status?.toLowerCase() === "resolved"
                              ? "Résolu"
                              : "Inconnu"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              </div>
            </div>
          )}

          {userType === "admin" && (
            <div className="flex-1 flex flex-col gap-8">
              {/* Middle Row: Dashboard Cards, Actions/System Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Dashboard Cards and User Distribution Chart */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    {forBox.map((ele, index) => (
                      <motion.div
                        key={index + 1}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className={`p-6 rounded-xl shadow-lg transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-l-4 border-blue-500 w-full border border-gray-200 dark:border-gray-700`}
                      >
                        <div className="text-3xl text-blue-500">{ele.icon}</div>
                        <div>
                          <h1 className="font-bold text-2xl">{ele.value}</h1>
                          <p className="font-semibold text-sm uppercase text-gray-500 dark:text-gray-400 mt-2 tracking-wide">
                            {ele.label}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 w-full border border-gray-200 dark:border-gray-700"
                  >
                    <h2 className="text-xl font-bold mb-4 text-center">Répartition des Utilisateurs</h2>
                    <div className="h-64">
                      <canvas ref={canvasRef} height="200"></canvas>
                    </div>
                    {/* Color Index for the Pie Chart */}
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold mb-2">Légende :</h3>
                      <ul className="text-sm space-y-1">
                        <li className="flex items-center">
                          <span className="inline-block w-4 h-4 mr-2 rounded-full" style={{ backgroundColor: "rgba(34, 197, 94, 0.7)" }}></span>
                          Propriétaires
                        </li>
                        <li className="flex items-center">
                          <span className="inline-block w-4 h-4 mr-2 rounded-full" style={{ backgroundColor: "rgba(54, 162, 235, 0.7)" }}></span>
                          Locataires
                        </li>
                        <li className="flex items-center">
                          <span className="inline-block w-4 h-4 mr-2 rounded-full" style={{ backgroundColor: "rgba(249, 115, 22, 0.7)" }}></span>
                          Employés
                        </li>
                      </ul>
                    </div>
                  </motion.div>
                </div>

                {/* Actions Rapides, État du Système, Aperçu des Statistiques Rapides */}
                <div className="lg:col-span-1 flex flex-col gap-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 w-full border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold">Actions Rapides</h2>
                      <button
                        onClick={refreshAdminData}
                        className="p-2 rounded-full transition-all duration-300 bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 relative group"
                        aria-label="Actualiser les données"
                      >
                        <FaSyncAlt className={statsLoading ? "animate-spin" : ""} size={16} />
                        <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-10 left-1/2 transform -translate-x-1/2">Actualiser</span>
                      </button>
                    </div>
                    <div className="flex flex-col gap-3">
                      <Link
                        to="/admin/tenantdetails"
                        className="p-3 rounded-lg shadow-md text-center transition-all duration-300 flex items-center justify-center gap-2 text-base bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                        aria-label="Voir les locataires"
                      >
                        <FaUsers />
                        Voir les locataires
                      </Link>
                      <Link
                        to="/admin/createowner"
                        className="p-3 rounded-lg shadow-md text-center transition-all duration-300 flex items-center justify-center gap-2 text-base bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                        aria-label="Créer un propriétaire"
                      >
                        <FaPlus />
                        Créer un propriétaire
                      </Link>
                      <button
                        onClick={exportUserData}
                        className="p-3 rounded-lg shadow-md text-center transition-all duration-300 flex items-center justify-center gap-2 text-base bg-green-500 text-white hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
                        aria-label="Exporter les données"
                      >
                        <FaDownload />
                        Exporter les données
                      </button>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 w-full border border-gray-200 dark:border-gray-700"
                  >
                    <h2 className="text-xl font-bold mb-4 text-center">État du Système</h2>
                    {statsLoading ? (
                      renderSkeletonLoader()
                    ) : statsError ? (
                      <div className="text-sm text-red-500">
                        <p>{statsError}</p>
                        <button
                          onClick={fetchSystemStatusAndQuickStats}
                          className="mt-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-all duration-300"
                          aria-label="Réessayer de charger les statistiques"
                        >
                          Réessayer
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="text-base flex items-center gap-2">
                          <FaServer className="text-blue-500 text-2xl" />
                          <span className="font-semibold">Temps de disponibilité:</span>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                            <div
                              className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                              style={{ width: systemStatus.uptime }}
                            ></div>
                          </div>
                          <span>{systemStatus.uptime}</span>
                        </div>
                        <p className="text-base flex items-center gap-2">
                          <FaUsers className="text-blue-500 text-2xl" />
                          <span className="font-semibold">Utilisateurs actifs:</span> {systemStatus.activeUsers}
                        </p>
                        <p className="text-base flex items-center gap-2">
                          <FaExclamationCircle className={systemStatus.alerts > 0 ? "text-red-500 text-2xl" : "text-green-500 text-2xl"} />
                          <span className="font-semibold">Alertes récentes:</span>
                          <span className={systemStatus.alerts > 0 ? "text-red-500" : "text-green-500"}>
                            {systemStatus.alerts}
                          </span>
                        </p>
                      </div>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 w-full border border-gray-200 dark:border-gray-700"
                  >
                    <h2 className="text-xl font-bold mb-4 text-center">Aperçu des Statistiques Rapides</h2>
                    {statsLoading ? (
                      renderSkeletonLoader()
                    ) : statsError ? (
                      <div className="text-sm text-red-500">
                        <p>{statsError}</p>
                        <button
                          onClick={fetchSystemStatusAndQuickStats}
                          className="mt-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-all duration-300"
                          aria-label="Réessayer de charger les statistiques"
                        >
                          Réessayer
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-base flex items-center gap-2">
                          <FaUsers className="text-blue-500 text-2xl" />
                          <span className="font-semibold">Connexions aujourd'hui:</span> {quickStats.totalLoginsToday}
                        </p>
                        <p className="text-base flex items-center gap-2">
                          <FaExclamationTriangle className="text-yellow-500 text-2xl" />
                          <span className="font-semibold">Plaintes déposées:</span> {quickStats.totalComplaintsFiled}
                        </p>
                        <p className="text-base flex items-center gap-2">
                          <FaExclamationCircle className="text-red-500 text-2xl" />
                          <span className="font-semibold">Demandes en attente:</span> {quickStats.pendingRequests}
                        </p>
                      </div>
                    )}
                  </motion.div>
                </div>
              </div>

              {/* Bottom Row: Recent Activities, Quick Links, Maintenance Requests */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activities */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 w-full border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Activités Récentes</h2>
                    <div className="flex items-center gap-2">
                      <div className="relative group">
                        <input
                          type="date"
                          value={activityFilterDate}
                          onChange={(e) => {
                            setActivityFilterDate(e.target.value);
                            handleActivityFilter(e.target.value);
                          }}
                          className="p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 transition-all duration-300 bg-white text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                          aria-label="Filtrer les activités par date"
                        />
                        <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-10 left-1/2 transform -translate-x-1/2">Filtrer par date</span>
                      </div>
                      <button
                        onClick={() => {
                          setActivityFilterDate("");
                          handleActivityFilter("");
                        }}
                        className="p-2 rounded-full transition-all duration-300 bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 relative group"
                        aria-label="Effacer le filtre"
                      >
                        <FaFilter size={16} />
                        <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-10 left-1/2 transform -translate-x-1/2">Effacer le filtre</span>
                      </button>
                    </div>
                  </div>
                  {filteredActivities.length === 0 ? (
                    renderEmptyPlaceholder("Aucune activité récente.")
                  ) : (
                    <>
                      <ul className="space-y-2">
                        {(showAllActivities ? filteredActivities : filteredActivities.slice(0, 4)).map((activity, index) => (
                          <li key={index} className="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded-md">
                            <span>{activity.action}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                {new Date(activity.date).toLocaleString()}
                              </span>
                              <button
                                onClick={() => markActivityAsRead(index)}
                                className="text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-all duration-300 text-sm relative group"
                                aria-label="Marquer comme lu"
                              >
                                <FaCheck />
                                <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">Marquer comme lu</span>
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                      {filteredActivities.length > 4 && (
                        <button
                          onClick={() => setShowAllActivities(!showAllActivities)}
                          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-all duration-300 text-sm mt-3"
                          aria-label={showAllActivities ? "Afficher moins d'activités" : "Afficher plus d'activités"}
                        >
                          {showAllActivities ? "Afficher moins" : "Afficher plus"}
                        </button>
                      )}
                    </>
                  )}
                </motion.div>

                {/* Quick Links */}
                <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 w-full border border-gray-200 dark:border-gray-700"
              >
                <h2 className="text-xl font-bold mb-4 text-center">Liens Rapides</h2>
                <div className="flex flex-col gap-3">
                  {quickLinks.map((link, index) => (
                    <Link
                      key={index}
                      to={link.url}
                      className="p-3 rounded-lg shadow-md text-center transition-all duration-300 flex items-center justify-center gap-2 text-base w-full bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                      aria-label={link.name}
                    >
                      {link.icon}
                      {link.name}
                    </Link>
                  ))}
                </div>
              </motion.div>

                {/* Maintenance Requests */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 w-full border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Demandes de Maintenance Récentes</h2>
                    <Link
                      to={`/${userType}/maintenancerequests`}
                      className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-all duration-300 text-sm flex items-center gap-1 relative group"
                      aria-label="Voir toutes les demandes de maintenance"
                    >
                      <FaWrench />
                      Voir toutes les demandes
                      <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">Voir toutes les demandes</span>
                    </Link>
                  </div>
                  {maintenanceRequests.length === 0 ? (
                    renderEmptyPlaceholder("Aucune demande de maintenance récente.")
                  ) : (
                    <ul className="space-y-2">
                      {maintenanceRequests.map((request) => (
                        <li key={request.id} className="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded-md">
                          <span>Chambre {request.room_no}: {request.description}</span>
                          <span
                            className={`text-xs font-semibold ${
                              request.status?.toLowerCase() === "pending"
                                ? "text-red-500"
                                : request.status?.toLowerCase() === "in_progress"
                                ? "text-blue-500"
                                : request.status?.toLowerCase() === "resolved"
                                ? "text-green-500"
                                : "text-gray-400 dark:text-gray-500"
                            }`}
                          >
                            {request.status?.toLowerCase() === "pending"
                              ? "En attente"
                              : request.status?.toLowerCase() === "in_progress"
                              ? "En cours"
                              : request.status?.toLowerCase() === "resolved"
                              ? "Résolu"
                              : "Inconnu"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              </div>
            </div>
          )}

          {/* Footer Row: Apartment Rules (Common for All User Types) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl max-h-96 overflow-y-auto bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 w-full border border-gray-200 dark:border-gray-700"
          >
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-xl font-bold">Règles et Régulations de l'Appartement</h1>
              <button
                onClick={toggleRules}
                className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-all duration-300 relative group"
                aria-label={showRules ? "Masquer les règles" : "Afficher les règles"}
              >
                {showRules ? <FaChevronUp size={16} /> : <FaChevronDown size={16} />}
                <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
                  {showRules ? "Masquer" : "Afficher"}
                </span>
              </button>
            </div>
            <AnimatePresence>
              {showRules && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-gray-600 dark:text-gray-400 space-y-4 text-base"
                >
                  {rules.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="space-y-2">
                      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        {section.section}
                      </h2>
                      {section.content && (
                        <p className="text-base">{section.content}</p>
                      )}
                      {section.rules && (
                        <ul className="space-y-2">
                          {section.rules.map((rule) => (
                            <li key={rule.id}>
                              <span className="font-medium text-gray-800 dark:text-gray-100">
                                {rule.id} {rule.title}
                              </span>
                              <ul className="list-disc pl-6 mt-1 space-y-1">
                                {rule.subrules.map((subrule) => (
                                  <li key={subrule.id} className="text-base">
                                    <span className="font-medium">{subrule.id}</span> {subrule.text}
                                  </li>
                                ))}
                              </ul>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;