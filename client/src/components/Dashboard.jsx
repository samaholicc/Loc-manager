import axios from "axios";
import React, { useContext, useState, useEffect, useCallback, useRef } from "react";
import { HamContext } from "../HamContextProvider";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaSyncAlt, FaMoon, FaSun, FaChevronDown, FaChevronUp, FaExclamationCircle,
  FaUser, FaBell, FaCloudSun, FaUsers, FaExclamationTriangle, FaMoneyBillWave,
  FaPlus, FaFileAlt, FaCheck, FaEye, FaCar, FaWrench, FaFilter, FaDownload,
  FaLink, FaBook, FaHeadset, FaUserPlus, FaSignInAlt, FaServer, FaChartLine, FaBriefcase
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, PieController, ArcElement } from "chart.js";

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, PieController, ArcElement);

function Dashboard(props) {
  const { hamActive, hamHandler } = useContext(HamContext);
  const navigate = useNavigate();
  const [forBox, setForBox] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRules, setShowRules] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
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

  // Initialize with default objects to prevent undefined errors
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

  const rules = [
    "Les résidents sont invités à prendre soin des lieux et à signaler sans délai tout problème ou anomalie.",
    "Le respect de l’intimité des voisins et de leur tranquillité est fondamental.",
    "Les loyers doivent être réglés à la date convenue pour assurer une cohabitation harmonieuse.",
    "Toute modification de l’appartement requiert une autorisation écrite préalable de l’administration.",
    "Les résidents doivent souscrire une assurance suffisante pour couvrir leurs biens personnels.",
    "Les dépôts de garantie seront restitués rapidement après inspection, sous réserve que l’appartement soit rendu sans dommages.",
    "Il est interdit aux résidents d’intervenir sur les systèmes de chauffage, d’éclairage ou autres équipements du bâtiment.",
    "Le stationnement est autorisé uniquement dans les espaces réservés, marqués par des lignes jaunes, pour le confort de tous.",
    "Les déchets sanitaires doivent être correctement emballés et déposés avec les ordures ménagères.",
    "En cas de intempéries, les résidents doivent veiller à sécuriser les fenêtres pour leur propre sécurité.",
    "La sécurité des femmes est une priorité absolue, avec des dispositions spécifiques pour garantir un cadre de vie sûr et agréable pour toutes.",
    "L’administration s’efforce de créer une ambiance chaleureuse, comme un second chez-soi, en plaçant le bien-être et la satisfaction des résidents au cœur de ses priorités.",
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
    { name: "Portail de gestion", icon: <FaLink />, url: "https://example.com" },
  ];

  // Helper function to render a compact placeholder for empty sections
  const renderEmptyPlaceholder = (message) => (
    <div className="text-center text-gray-500 text-sm py-2">
      <FaExclamationCircle className="inline-block mr-1" />
      {message}
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
      setSystemStatus({
        uptime: "0%",
        activeUsers: 0,
        alerts: 0,
      });
      setQuickStats({
        totalLoginsToday: 0,
        totalComplaintsFiled: 0,
        pendingRequests: 0,
      });
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
      const uniqueRequests = Array.from(
        new Map(data.map((item) => [item.id, item])).values()
      );
      setMaintenanceRequests(uniqueRequests);
    } catch (error) {
      console.error("Error in fetchRequests:", error);
    }
  }, [fetchMaintenanceRequests]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

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
        whom === "owner"
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
      setComplaintSummary(complaintsRes.data.slice(0, 2));
      setPaymentStatus(paymentRes.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des données du tableau de bord:", error.response?.data || error.message);
      if (error.response?.status === 404 && error.response?.data?.error === "Owner not found") {
        setError("Propriétaire non trouvé. Veuillez vérifier votre compte.");
      } else {
        setError(error.response?.data?.error || error.message || "Une erreur s'est produite lors de la récupération des données.");
      }
      toast.error(error.response?.data?.error || error.message || "Erreur lors de la récupération des données.");
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

    if (JSON.parse(window.localStorage.getItem("whom"))?.userType === "owner" && complaintSummary.length > 0) {
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
  }, [complaintSummary, darkMode]);

  useEffect(() => {
    if (userDistributionChartRef.current) {
      userDistributionChartRef.current.destroy();
      userDistributionChartRef.current = null;
    }

    if (JSON.parse(window.localStorage.getItem("whom"))?.userType === "admin" && forBox.length > 0 && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        const chartData = [
          forBox[0]?.value || 0,
          forBox[1]?.value || 0,
          forBox[2]?.value || 0,
        ];

        const chartLabels = ["Propriétaires", "Locataires", "Employés"];
        const chartColors = [
          "rgba(34, 197, 94, 0.7)",
          "rgba(54, 162, 235, 0.7)",
          "rgba(249, 115, 22, 0.7)",
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
  }, [forBox, darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

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
      className={`min-h-screen w-full transition-all duration-300 flex flex-col ${
        darkMode ? "bg-gray-900 text-gray-200" : "bg-gradient-to-br from-blue-50 to-gray-100 text-gray-800"
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-4 md:p-6">
        <h1 className="text-2xl font-bold">Bienvenue, {userName} !</h1>
        <div className="flex gap-2 items-center">
          <button
            onClick={getBoxInfo}
            className={`flex items-center gap-1 px-3 py-1 rounded-md transition-all duration-300 text-sm ${
              darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
            aria-label="Rafraîchir les données"
          >
            <FaSyncAlt className={loading ? "animate-spin" : ""} />
            Rafraîchir
          </button>
          {["tenant", "owner", "admin"].includes(JSON.parse(window.localStorage.getItem("whom"))?.userType) && (
            <div className="relative">
              <button
                onClick={toggleNotifications}
                className={`p-1 rounded-full transition-all duration-300 relative ${
                  darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                }`}
                aria-label="Notifications"
              >
                <FaBell size={16} />
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg p-3 z-10 ${
                    darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"
                  }`}
                >
                  <h3 className="text-sm font-semibold mb-1">Notifications</h3>
                  {notifications.length === 0 ? (
                    <p className="text-xs text-gray-500">Aucune notification.</p>
                  ) : (
                    notifications.map((notif, index) => (
                      <div key={index} className="text-xs mb-1 flex justify-between items-center">
                        <div>
                          <p>{notif.message}</p>
                          <p className="text-xs text-gray-400">{new Date(notif.date).toLocaleString()}</p>
                        </div>
                        <button
                          onClick={() => markNotificationAsRead(index)}
                          className="text-green-500 hover:text-green-700"
                          aria-label="Marquer comme lu"
                        >
                          <FaCheck size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </motion.div>
              )}
            </div>
          )}
          <button
            onClick={toggleDarkMode}
            className={`p-1 rounded-full transition-all duration-300 ${
              darkMode ? "bg-yellow-400 text-gray-900 hover:bg-yellow-500" : "bg-gray-300 text-gray-700 hover:bg-gray-400"
            }`}
            aria-label={darkMode ? "Passer au mode clair" : "Passer au mode sombre"}
          >
            {darkMode ? <FaSun size={16} /> : <FaMoon size={16} />}
          </button>
          <button
            onClick={() => {
              window.localStorage.removeItem("whom");
              navigate("/login");
              toast.success("Déconnexion réussie.");
            }}
            className={`px-3 py-1 rounded-md text-sm transition-all duration-300 ${
              darkMode ? "bg-red-600 text-white hover:bg-red-700" : "bg-red-500 text-white hover:bg-red-600"
            }`}
            aria-label="Déconnexion"
          >
            Déconnexion
          </button>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse flex flex-col gap-4 w-full max-w-4xl mx-auto p-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-32 bg-gray-200 rounded-lg"></div>
              <div className="h-32 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-24 bg-gray-200 rounded-lg"></div>
              <div className="h-24 bg-gray-200 rounded-lg"></div>
              <div className="h-24 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 text-lg font-medium p-5 bg-white rounded-lg shadow-md max-w-md mx-auto">
          <FaExclamationCircle className="inline-block mr-2" />
          {error}
          <button
            onClick={() => navigate("/login")}
            className="ml-4 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            aria-label="Se connecter"
          >
            Se connecter
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col p-4 md:p-6 gap-6">
          {/* Top Row: Profile and Weather */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className={`rounded-lg shadow-lg p-4 flex items-center gap-3 transition-all duration-300 hover:shadow-xl ${
                darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"
              }`}
            >
              <div className="flex-shrink-0">
                <FaUser className="text-3xl text-blue-500" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold">Profil</h2>
                <p className="text-sm">Nom: {userDetails?.name || "Inconnu"}</p>
                <p className="text-sm">Rôle: {JSON.parse(window.localStorage.getItem("whom"))?.userType || "Inconnu"}</p>
                {JSON.parse(window.localStorage.getItem("whom"))?.userType === "admin" ? (
                  <p className="text-sm">Numéro du block: {userDetails?.block_no || "N/A"}</p>
                ) : JSON.parse(window.localStorage.getItem("whom"))?.userType === "tenant" ? (
                  <>
                    <p className="text-sm">Numéro du block: {userDetails?.block_no || "N/A"}</p>
                    <p className="text-sm">Nom du block: {userDetails?.block_name || "Inconnu"}</p>
                  </>
                ) : (
                  <p className="text-sm">Numéro de chambre: {userDetails?.room_no || "N/A"}</p>
                )}
              </div>
              <Link
                to="/edit-profile"
                className={`px-3 py-1 rounded-md text-sm transition-all duration-300 ${
                  darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
                aria-label="Modifier le profil"
              >
                Modifier le profil
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className={`rounded-lg shadow-lg p-4 flex items-center gap-3 transition-all duration-300 hover:shadow-xl ${
                darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"
              }`}
            >
              <FaCloudSun className="text-3xl text-blue-500" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold">Météo à</h2>
                  <select
                    value={weatherCity}
                    onChange={(e) => setWeatherCity(e.target.value)}
                    className={`rounded-md border py-1 px-2 text-sm transition-all duration-300 focus:ring-2 focus:ring-blue-500 ${
                      darkMode ? "bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600" : "bg-white text-gray-800 border-gray-300 hover:bg-gray-100"
                    }`}
                    aria-label="Sélectionner une ville pour la météo"
                  >
                    <option value="Paris">Paris</option>
                    <option value="London">Londres</option>
                    <option value="New York">New York</option>
                    <option value="Tokyo">Tokyo</option>
                  </select>
                  <button
                    onClick={fetchWeather}
                    className={`p-1 rounded-full transition-all duration-300 ${
                      darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                    }`}
                    aria-label="Rafraîchir la météo"
                  >
                    <FaSyncAlt className={weatherLoading ? "animate-spin" : ""} size={16} />
                  </button>
                </div>
                {weatherLoading ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                  </div>
                ) : weatherError ? (
                  <div className="text-sm text-red-500">
                    <p>{weatherError}</p>
                    <button
                      onClick={fetchWeather}
                      className="mt-2 text-blue-500 hover:text-blue-700 transition-all duration-300"
                      aria-label="Réessayer de charger la météo"
                    >
                      Réessayer
                    </button>
                  </div>
                ) : weather && weather.main && weather.weather ? (
                  <>
                    <p className="text-sm">Température: {weather.main.temp}°C</p>
                    <p className="text-sm">Condition: {weather.weather[0].description}</p>
                    <p className="text-sm">Humidité: {weather.main.humidity}%</p>
                    <p className="text-sm">Vitesse du vent: {weather.wind.speed} m/s</p>
                  </>
                ) : (
                  <p className="text-sm">Aucune donnée météo disponible. Veuillez réessayer.</p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Middle Row: Dashboard Cards, User Distribution Chart, User Statistics Summary, Quick Actions, System Status, Quick Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Section: Dashboard Cards, User Distribution Chart, User Statistics Summary */}
            <div className="md:col-span-2 flex flex-col gap-6">
              {/* Dashboard Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {forBox.map((ele, index) => (
                  <motion.div
                    key={index + 1}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`p-4 rounded-lg shadow-lg transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 ${
                      darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"
                    } ${
                      JSON.parse(window.localStorage.getItem("whom"))?.userType === "admin"
                        ? "border-l-4 border-blue-500"
                        : JSON.parse(window.localStorage.getItem("whom"))?.userType === "owner"
                        ? "border-l-4 border-green-500"
                        : JSON.parse(window.localStorage.getItem("whom"))?.userType === "employee"
                        ? "border-l-4 border-yellow-500"
                        : "border-l-4 border-purple-500"
                    }`}
                  >
                    <div className="text-2xl text-blue-500">{ele.icon}</div>
                    <div>
                      <h1 className="font-bold text-xl">{ele.value}</h1>
                      <p className="font-semibold text-xs uppercase text-gray-500 mt-1 tracking-wide">
                        {ele.label}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* User Distribution Chart and User Statistics Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {JSON.parse(window.localStorage.getItem("whom"))?.userType === "admin" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className={`rounded-lg shadow-lg p-4 transition-all duration-300 hover:shadow-xl ${
                      darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"
                    } ${forBox.length === 0 ? "h-32" : "h-auto"}`}
                  >
                    <h2 className="text-lg font-bold mb-2">Répartition des Utilisateurs</h2>
                    {forBox.length === 0 ? (
                      renderEmptyPlaceholder("Aucune donnée d'utilisateur disponible.")
                    ) : (
                      <>
                        <div className="flex justify-center">
                          <div className="w-full h-64">
                            <canvas ref={canvasRef} id="userDistributionChart"></canvas>
                          </div>
                        </div>
                      

                          <div className="mt-4">
                          <table className="w-full text-sm border-separate border-spacing-y-1">
                            <thead>
                              <tr>
                                <th className="text-left font-semibold">Type</th>
                                <th className="text-right font-semibold">Nombre</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td>Propriétaires</td>
                                <td className="text-right">{forBox[0].value}</td>
                              </tr>
                              <tr>
                                <td>Locataires</td>
                                <td className="text-right">{forBox[1].value}</td>
                              </tr>
                              <tr>
                                <td>Employés</td>
                                <td className="text-right">{forBox[2].value}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}

                {JSON.parse(window.localStorage.getItem("whom"))?.userType === "admin" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className={`rounded-lg shadow-lg p-4 transition-all duration-300 hover:shadow-xl border-l-4 border-blue-500 ${
                      darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"
                    } ${userStatsData.totalUsers === 0 ? "h-32" : "max-h-[440px] overflow-y-auto"}`}
                  >
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <FaChartLine className="text-blue-500" />
                      Résumé des Statistiques Utilisateurs
                    </h2>
                    {userStatsData.totalUsers === 0 ? (
                      renderEmptyPlaceholder("Aucune statistique utilisateur disponible.")
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300">
                          <FaUsers className="text-blue-500 text-xl" />
                          <div>
                            <p className="text-sm font-semibold">Nombre total d'utilisateurs</p>
                            <p className="text-lg font-bold">{userStatsData.totalUsers}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300">
                          <FaUser className="text-green-500 text-xl" />
                          <div>
                            <p className="text-sm font-semibold">Âge moyen des propriétaires</p>
                            <p className="text-lg font-bold">{userStatsData.averageOwnerAge} ans</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300">
                          <FaUser className="text-blue-500 text-xl" />
                          <div>
                            <p className="text-sm font-semibold">Âge moyen des locataires</p>
                            <p className="text-lg font-bold">{userStatsData.averageTenantAge} ans</p>
                          </div>
                        </div>

                        {userStatsData.averageEmployeeAge > 0 && (
                          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300">
                            <FaUser className="text-orange-500 text-xl" />
                            <div>
                              <p className="text-sm font-semibold">Âge moyen des employés</p>
                              <p className="text-lg font-bold">{userStatsData.averageEmployeeAge} ans</p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300">
                          <FaUsers className="text-green-500 text-xl" />
                          <div>
                            <p className="text-sm font-semibold">Propriétaires actifs</p>
                            <p className="text-lg font-bold">{userStatsData.activeOwners}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300">
                          <FaUsers className="text-blue-500 text-xl" />
                          <div>
                            <p className="text-sm font-semibold">Locataires actifs</p>
                            <p className="text-lg font-bold">{userStatsData.activeTenants}</p>
                          </div>
                        </div>

                        {userStatsData.activeEmployees > 0 && (
                          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300">
                            <FaUsers className="text-orange-500 text-xl" />
                            <div>
                              <p className="text-sm font-semibold">Employés actifs</p>
                              <p className="text-lg font-bold">{userStatsData.activeEmployees}</p>
                            </div>
                          </div>
                        )}

                        <div className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300">
                          <p className="text-sm font-semibold mb-2">Répartition des utilisateurs</p>
                          <div className="flex items-center gap-3">
                            <FaUser className="text-green-500 text-xl" />
                            <p className="text-sm">Propriétaires: {userStatsData.ownerPercentage}%</p>
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            <FaUser className="text-blue-500 text-xl" />
                            <p className="text-sm">Locataires: {userStatsData.tenantPercentage}%</p>
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            <FaUser className="text-orange-500 text-xl" />
                            <p className="text-sm">Employés: {userStatsData.employeePercentage}%</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Right Section: Quick Actions, System Status, Quick Stats Overview */}
            <div className="flex flex-col gap-6">
              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={`rounded-lg shadow-lg p-4 transition-all duration-300 hover:shadow-xl h-fit ${
                  darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"
                }`}
              >
                <h2 className="text-lg font-bold mb-2 text-center">Actions Rapides</h2>
                <div className="flex flex-col gap-2">
                  {JSON.parse(window.localStorage.getItem("whom"))?.userType === "admin" && (
                    <>
                      <Link
                        to="/admin/tenantdetails"
                        className={`p-2 h-10 rounded-lg shadow-md text-center transition-all duration-300 flex items-center justify-center gap-2 text-sm ${
                          darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-blue-500 text-white hover:bg-blue-600"
                        }`}
                        aria-label="Voir les locataires"
                      >
                        <FaUsers />
                        Voir les locataires
                      </Link>
                      <Link
                        to="/admin/createowner"
                        className={`p-2 h-10 rounded-lg shadow-md text-center transition-all duration-300 flex items-center justify-center gap-2 text-sm ${
                          darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-blue-500 text-white hover:bg-blue-600"
                        }`}
                        aria-label="Créer un propriétaire"
                      >
                        <FaPlus />
                        Créer un propriétaire
                      </Link>
                      <button
                        onClick={exportUserData}
                        className={`p-2 h-10 rounded-lg shadow-md text-center transition-all duration-300 flex items-center justify-center gap-2 text-sm ${
                          darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-green-500 text-white hover:bg-green-600"
                        }`}
                        aria-label="Exporter les données"
                      >
                        <FaDownload />
                        Exporter les données
                      </button>
                    </>
                  )}
                  {JSON.parse(window.localStorage.getItem("whom"))?.userType === "owner" && (
                    <>
                      <Link
                        to="/owner/complaint"
                        className={`p-2 h-10 rounded-lg shadow-md text-center transition-all duration-300 flex items-center justify-center gap-2 text-sm ${
                          darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-blue-500 text-white hover:bg-blue-600"
                        }`}
                        aria-label="Voir les plaintes"
                      >
                        <FaFileAlt />
                        Voir les plaintes
                      </Link>
                      <Link
                        to="/owner/createtenant"
                        className={`p-2 h-10 rounded-lg shadow-md text-center transition-all duration-300 flex items-center justify-center gap-2 text-sm ${
                          darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-blue-500 text-white hover:bg-blue-600"
                        }`}
                        aria-label="Créer un locataire"
                      >
                        <FaPlus />
                        Créer un locataire
                      </Link>
                      <Link
                        to="/owner/tenantdetails"
                        className={`p-2 h-10 rounded-lg shadow-md text-center transition-all duration-300 flex items-center justify-center gap-2 text-sm ${
                          darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-blue-500 text-white hover:bg-blue-600"
                        }`}
                        aria-label="Voir les locataires"
                      >
                        <FaUsers />
                        Voir les locataires
                      </Link>
                    </>
                  )}
                  {JSON.parse(window.localStorage.getItem("whom"))?.userType === "tenant" && (
                    <>
                      <button
                        onClick={async () => {
                          try {
                            const userId = JSON.parse(window.localStorage.getItem("whom")).username;
                            await axios.post(`${process.env.REACT_APP_SERVER}/paymaintanance`, { id: userId });
                            toast.success("Paiement effectué avec succès");
                            getBoxInfo();
                          } catch (error) {
                            toast.error("Erreur lors du paiement : " + (error.response?.data?.error || error.message));
                          }
                        }}
                        className={`p-2 h-10 rounded-lg shadow-md text-center transition-all duration-300 flex items-center justify-center gap-2 text-sm ${
                          darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-green-500 text-white hover:bg-green-600"
                        }`}
                        aria-label="Payer l'entretien"
                      >
                        <FaMoneyBillWave />
                        Payer l'entretien
                      </button>
                      <Link
                        to="/tenant/filecomplaint"
                        className={`p-2 h-10 rounded-lg shadow-md text-center transition-all duration-300 flex items-center justify-center gap-2 text-sm ${
                          darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-yellow-500 text-white hover:bg-yellow-600"
                        }`}
                        aria-label="Déposer une plainte"
                      >
                        <FaExclamationTriangle />
                        Déposer une plainte
                      </Link>
                      <Link
                        to="/tenant/bookslot"
                        className={`p-2 h-10 rounded-lg shadow-md text-center transition-all duration-300 flex items-center justify-center gap-2 text-sm ${
                          darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-blue-500 text-white hover:bg-blue-600"
                        }`}
                        aria-label="Réserver un emplacement de parking"
                      >
                        <FaCar />
                        Réserver un emplacement de parking
                      </Link>
                      <Link
                        to="/tenant/viewparking"
                        className={`p-2 h-10 rounded-lg shadow-md text-center transition-all duration-300 flex items-center justify-center gap-2 text-sm ${
                          darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-blue-500 text-white hover:bg-blue-600"
                        }`}
                        aria-label="Voir les emplacements de parking"
                      >
                        <FaEye />
                        Voir les emplacements de parking
                      </Link>
                    </>
                  )}
                  {JSON.parse(window.localStorage.getItem("whom"))?.userType === "employee" && (
                    <>
                      <Link
                        to="/employee/viewcomplaints"
                        className={`p-2 h-10 rounded-lg shadow-md text-center transition-all duration-300 flex items-center justify-center gap-2 text-sm ${
                          darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-blue-500 text-white hover:bg-blue-600"
                        }`}
                        aria-label="Voir les plaintes"
                      >
                        <FaFileAlt />
                        Voir les plaintes
                      </Link>
                    </>
                  )}
                </div>
              </motion.div>

              {/* System Status Card */}
              {JSON.parse(window.localStorage.getItem("whom"))?.userType === "admin" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className={`rounded-lg shadow-lg p-4 transition-all duration-300 hover:shadow-xl h-fit ${
                    darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"
                  }`}
                >
                  <h2 className="text-lg font-bold mb-2 text-center">État du Système</h2>
                  {statsLoading ? (
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                    </div>
                  ) : statsError ? (
                    <div className="text-sm text-red-500">
                      <p>{statsError}</p>
                      <button
                        onClick={fetchSystemStatusAndQuickStats}
                        className="mt-2 text-blue-500 hover:text-blue-700 transition-all duration-300"
                        aria-label="Réessayer de charger les statistiques"
                      >
                        Réessayer
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-sm flex items-center gap-2">
                        <FaServer className="text-blue-500" />
                        <span className="font-semibold">Temps de disponibilité :</span> {systemStatus.uptime}
                        <div className="w-full bg-gray-200 rounded-full h-2.5 ml-2">
                          <div
                            className="bg-blue-500 h-2.5 rounded-full"
                            style={{ width: systemStatus.uptime }}
                          ></div>
                        </div>
                      </div>
                      <p className="text-sm flex items-center gap-2">
                        <FaUsers className="text-blue-500" />
                        <span className="font-semibold">Utilisateurs actifs :</span> {systemStatus.activeUsers}
                      </p>
                      <p className="text-sm flex items-center gap-2">
                        <FaExclamationCircle className={systemStatus.alerts > 0 ? "text-red-500" : "text-green-500"} />
                        <span className="font-semibold">Alertes récentes :</span>
                        <span className={systemStatus.alerts > 0 ? "text-red-500" : "text-green-500"}>
                          {systemStatus.alerts}
                        </span>
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Quick Stats Overview */}
              {JSON.parse(window.localStorage.getItem("whom"))?.userType === "admin" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className={`rounded-lg shadow-lg p-4 transition-all duration-300 hover:shadow-xl h-fit ${
                    darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"
                  }`}
                >
                  <h2 className="text-lg font-bold mb-2 text-center">Aperçu des Statistiques Rapides</h2>
                  {statsLoading ? (
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                    </div>
                  ) : statsError ? (
                    <div className="text-sm text-red-500">
                      <p>{statsError}</p>
                      <button
                        onClick={fetchSystemStatusAndQuickStats}
                        className="mt-2 text-blue-500 hover:text-blue-700 transition-all duration-300"
                        aria-label="Réessayer de charger les statistiques"
                      >
                        Réessayer
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm flex items-center gap-2">
                        <FaUsers className="text-blue-500" />
                        <span className="font-semibold">Connexions aujourd'hui :</span> {quickStats.totalLoginsToday}
                      </p>
                      <p className="text-sm flex items-center gap-2">
                        <FaExclamationTriangle className="text-yellow-500" />
                        <span className="font-semibold">Plaintes déposées :</span> {quickStats.totalComplaintsFiled}
                      </p>
                      <p className="text-sm flex items-center gap-2">
                        <FaExclamationCircle className="text-red-500" />
                        <span className="font-semibold">Demandes en attente :</span> {quickStats.pendingRequests}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>

          {/* Bottom Row: Complaint Summary, Payment Status, Recent Activity, Maintenance Requests, Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {JSON.parse(window.localStorage.getItem("whom"))?.userType === "owner" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={`rounded-lg shadow-lg p-4 transition-all duration-300 hover:shadow-xl ${
                  darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"
                } ${complaintSummary.length === 0 ? "h-32" : "min-h-[300px]"}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-bold">Résumé des Plaintes Récentes</h2>
                  <Link
                    to="/owner/complaint"
                    className={`text-blue-500 hover:text-blue-700 transition-all duration-300 text-sm ${
                      darkMode ? "text-blue-400 hover:text-blue-300" : ""
                    }`}
                    aria-label="Voir toutes les plaintes"
                  >
                    Voir toutes les plaintes
                  </Link>
                </div>
                {complaintSummary.length === 0 ? (
                  renderEmptyPlaceholder("Aucune plainte récente.")
                ) : (
                  <>
                    <ul className="space-y-1">
                      {complaintSummary.map((complaint) => (
                        <li key={complaint.room_no} className="flex justify-between items-center text-sm">
                          <span>Chambre {complaint.room_no}: {complaint.complaints}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{complaint.resolved ? "Résolu" : "Non résolu"}</span>
                            {!complaint.resolved && (
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
                                className="text-green-500 hover:text-green-700 transition-all duration-300 text-sm"
                                aria-label="Résoudre la plainte"
                              >
                                Résoudre
                              </button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2">
                      <canvas id="complaintsChart" height="150"></canvas>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {JSON.parse(window.localStorage.getItem("whom"))?.userType === "tenant" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={`rounded-lg shadow-lg p-4 transition-all duration-300 hover:shadow-xl min-h-[300px] ${
                  darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"
                }`}
              >
                <h2 className="text-lg font-bold mb-2">Statut de Paiement</h2>
                {paymentStatus ? (
                  <>
                    <p className="text-sm">Statut: {paymentStatus.status === "Payé" ? "Payé" : "Dû"}</p>
                    {paymentStatus.status !== "Payé" && (
                      <p className="text-sm">Échéance: {paymentStatus.dueDate || "N/A"}</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm">Chargement du statut de paiement...</p>
                )}
              </motion.div>
            )}

            {["tenant", "owner", "admin"].includes(JSON.parse(window.localStorage.getItem("whom"))?.userType) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={`rounded-lg shadow-lg p-4 transition-all duration-300 hover:shadow-xl ${
                  darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"
                } ${filteredActivities.length === 0 ? "h-32" : "min-h-[300px]"}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-bold">Activités Récentes</h2>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={activityFilterDate}
                      onChange={(e) => {
                        setActivityFilterDate(e.target.value);
                        handleActivityFilter(e.target.value);
                      }}
                      className={`p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                        darkMode ? "bg-gray-700 text-gray-200 border-gray-600" : "bg-white text-gray-800 border-gray-300"
                      }`}
                      aria-label="Filtrer les activités par date"
                    />
                    <button
                      onClick={() => {
                        setActivityFilterDate("");
                        handleActivityFilter("");
                      }}
                      className={`p-2 rounded-full transition-all duration-300 ${
                        darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                      }`}
                      aria-label="Effacer le filtre"
                    >
                      <FaFilter size={16} />
                    </button>
                  </div>
                </div>
                {filteredActivities.length === 0 ? (
                  renderEmptyPlaceholder("Aucune activité récente.")
                ) : (
                  <>
                    <ul className="space-y-1">
                      {(showAllActivities ? filteredActivities : filteredActivities.slice(0, 4)).map((activity, index) => (
                        <li key={index} className="flex justify-between items-center text-sm">
                          <span>{activity.action}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(activity.date).toLocaleString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {filteredActivities.length > 4 && (
                      <button
                        onClick={() => setShowAllActivities(!showAllActivities)}
                        className="text-blue-500 hover:text-blue-700 transition-all duration-300 text-sm mt-2"
                        aria-label={showAllActivities ? "Afficher moins d'activités" : "Afficher plus d'activités"}
                      >
                        {showAllActivities ? "Afficher moins" : "Afficher plus"}
                      </button>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {["owner", "admin", "employee"].includes(JSON.parse(window.localStorage.getItem("whom"))?.userType) ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={`rounded-lg shadow-lg p-4 transition-all duration-300 hover:shadow-xl ${
                  darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"
                } ${maintenanceRequests.length === 0 ? "h-32" : "min-h-[300px]"}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-bold">Demandes de Maintenance Récentes</h2>
                  <Link
                    to={`/${JSON.parse(window.localStorage.getItem("whom"))?.userType}/maintenancerequests`}
                    className={`text-blue-500 hover:text-blue-700 transition-all duration-300 text-sm ${
                      darkMode ? "text-blue-400 hover:text-blue-300" : ""
                    }`}
                    aria-label="Voir toutes les demandes de maintenance"
                  >
                    <FaWrench /> Voir toutes les demandes
                  </Link>
                </div>
                {maintenanceRequests.length === 0 ? (
                  renderEmptyPlaceholder("Aucune demande de maintenance récente.")
                ) : (
                  <ul className="space-y-1">
                    {maintenanceRequests.map((request) => (
                      <li key={request.id} className="flex justify-between items-center text-sm">
                        <span>Chambre {request.room_no}: {request.description}</span>
                        <span className={`text-xs ${
                          request.status?.toLowerCase() === "pending" ? "text-yellow-500" :
                          request.status?.toLowerCase() === "in_progress" ? "text-blue-500" :
                          request.status?.toLowerCase() === "resolved" ? "text-green-500" :
                          "text-gray-400"
                        }`}>
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
            ) : JSON.parse(window.localStorage.getItem("whom"))?.userType === "tenant" ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={`rounded-lg shadow-lg p-4 transition-all duration-300 hover:shadow-xl min-h-[300px] ${
                  darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"
                }`}
              >
                <h2 className="text-lg font-bold mb-2">Soumettre une Demande de Maintenance</h2>
                <form onSubmit={handleFormSubmit} className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium">Numéro de chambre</label>
                    <input
                      type="text"
                      value={maintenanceForm.room_no}
                      onChange={(e) => setMaintenanceForm({ ...maintenanceForm, room_no: e.target.value })}
                      className={`w-full p-2 border rounded text-sm ${
                        darkMode ? "bg-gray-700 text-gray-200 border-gray-600" : "bg-white text-gray-800 border-gray-300"
                      }`}
                      required
                      disabled
                      aria-label="Numéro de chambre"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Description</label>
                    <textarea
                      value={maintenanceForm.description}
                      onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                      className={`w-full p-2 border rounded text-sm ${
                        darkMode ? "bg-gray-700 text-gray-200 border-gray-600" : "bg-white text-gray-800 border-gray-300"
                      }`}
                      rows="3"
                      required
                      aria-label="Description de la demande de maintenance"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={maintenanceSubmitting}
                    className={`w-full p-2 rounded text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                      maintenanceSubmitting
                        ? "bg-gray-500 cursor-not-allowed"
                        : darkMode
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                    aria-label="Soumettre la demande de maintenance"
                  >
                    {maintenanceSubmitting ? (
                      <FaSyncAlt className="animate-spin" />
                    ) : (
                      <FaPlus />
                    )}
                    Soumettre
                  </button>
                </form>
              </motion.div>
            ) : null}

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className={`rounded-lg shadow-lg p-4 transition-all duration-300 hover:shadow-xl min-h-[300px] ${
                darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"
              }`}
            >
              <h2 className="text-lg font-bold mb-12 text-center">Liens Rapides</h2>
              <div className="flex flex-col gap-2 px-4">
                {quickLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-2 h-10 rounded-lg shadow-md text-center transition-all duration-300 flex items-center justify-center gap-2 text-sm w-full ${
                      darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                    aria-label={link.name}
                  >
                    {link.icon}
                    {link.name}
                  </a>
                ))}
              </div>
            </motion.div>
          </div>

                    {/* Apartment Rules */}
                    <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`rounded-lg shadow-md p-4 transition-all duration-300 hover:shadow-xl max-h-96 overflow-y-auto ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-lg font-bold">Règles et Régulations de l'Appartement</h1>
              <button
                onClick={toggleRules}
                className="text-blue-500 hover:text-blue-700 transition-all duration-300"
                aria-label={showRules ? "Masquer les règles" : "Afficher les règles"}
              >
                {showRules ? <FaChevronUp size={16} /> : <FaChevronDown size={16} />}
              </button>
            </div>
            <AnimatePresence>
              {showRules && (
                <motion.ol
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="list-decimal px-4 py-1 text-gray-600 space-y-1 text-sm"
                >
                  {rules.map((rule, index) => (
                    <li key={index}>{rule}</li>
                  ))}
                </motion.ol>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;