import React from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import Aside from "./components/Aside";
import Auth from "./components/Auth";
import OwnerDetails from "./components/OwnerDetails";
import TenantDetails from "./components/TenantDetails";
import CreatingOwner from "./components/CreatingOwner";
import CreatingParkingSlot from "./components/CreatingParkingSlot";
import ComplaintsViewer from "./components/ComplaintsViewer";
import RaisingComplaints from "./components/RaisingComplaints";
import ParkingSlot from "./components/ParkingSlot";
import PayMaintenance from "./components/PayMaintenance";
import CreatingTenant from "./components/CreatingTenant";
import RoomDetails from "./components/RoomDetails";
import ErrorPage from "./ErrorPage";
import ComplaintsViewerOwner from "./components/ComplaintsViewerOwner";
import RoomDetailsOwner from "./components/RoomDetailsOwner";
import MaintenanceRequests from "./components/MaintenanceRequests";
import EditProfile from "./components/EditProfile";

function App() {
  const forAdmin = [
    { label: "Accueil", path: "home" },
    { label: "Détails des locataires", path: "tenantdetails" },
    { label: "Détails des propriétaires", path: "ownerdetails" },
    { label: "Créer un propriétaire", path: "createowner" },
    { label: "Attribution d'une place de parking", path: "allottingparkingslot" },
    { label: "Plaintes", path: "complaints" },
    { label: "Demandes de maintenance", path: "maintenancerequests" },
    { label: "Modifier le profil", path: "edit-profile" },
  ];
  const forEmployee = [
    { label: "Accueil", path: "home" },
    { label: "Plaintes", path: "complaints" },
    { label: "Demandes de maintenance", path: "maintenancerequests" },
    { label: "Modifier le profil", path: "edit-profile" },
  ];
  const forTenant = [
    { label: "Accueil", path: "home" },
    { label: "Déposer une plainte", path: "raisingcomplaints" },
    { label: "Place de parking attribuée", path: "allotedparkingslot" },
    { label: "Payer l'entretien", path: "paymaintenance" },
    { label: "Modifier le profil", path: "edit-profile" },
  ];
  const forOwner = [
    { label: "Accueil", path: "home" },
    { label: "Détails des locataires", path: "tenantdetails" },
    { label: "Plainte", path: "complaint" },
    { label: "Créer un locataire", path: "createtenant" },
    { label: "Détails des chambres", path: "roomdetails" },
    { label: "Demandes de maintenance", path: "maintenancerequests" },
    { label: "Modifier le profil", path: "edit-profile" },
  ];

  // Fonction pour déterminer les éléments de navigation en fonction du rôle
  const getNavItems = () => {
    const userType = JSON.parse(window.localStorage.getItem("whom"))?.userType;
    switch (userType) {
      case "admin":
        return forAdmin;
      case "employee":
        return forEmployee;
      case "tenant":
        return forTenant;
      case "owner":
        return forOwner;
      default:
        return [];
    }
  };

  const navItems = getNavItems();
  const basePath = JSON.parse(window.localStorage.getItem("whom"))?.userType || "";

  return (
    <div className="App font-mons background">
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route
          path="/admin"
          element={
            <main>
              <Header forHam={[...forAdmin.map(item => item.label), "Déconnexion"]} />
              <section className="flex">
                <Aside forHam={forAdmin} base={'admin'} />
                <Dashboard />
              </section>
            </main>
          }
        />
        <Route
          path="/employee"
          element={
            <main>
              <Header forHam={[...forEmployee.map(item => item.label), "Déconnexion"]} />
              <section className="flex">
                <Aside forHam={forEmployee} base={'employee'} />
                <Dashboard />
              </section>
            </main>
          }
        />
        <Route
          path="/tenant"
          element={
            <main>
              <Header forHam={[...forTenant.map(item => item.label), "Déconnexion"]} />
              <section className="flex">
                <Aside forHam={forTenant} base={'tenant'} />
                <Dashboard />
              </section>
            </main>
          }
        />
        <Route
          path="/owner"
          element={
            <main>
              <Header forHam={[...forOwner.map(item => item.label), "Déconnexion"]} />
              <section className="flex">
                <Aside forHam={forOwner} base={'owner'} />
                <Dashboard />
              </section>
            </main>
          }
        />
        <Route
          path="/admin/ownerdetails"
          element={
            <main>
              <Header forHam={forAdmin.map(item => item.label)} />
              <section className="dashboardSkeleton">
                <Aside forHam={forAdmin} base={'admin'} />
                <OwnerDetails />
              </section>
            </main>
          }
        />
        <Route
          path="/admin/tenantdetails"
          element={
            <main>
              <Header forHam={forAdmin.map(item => item.label)} />
              <section className="dashboardSkeleton">
                <Aside forHam={forAdmin} base={'admin'} />
                <TenantDetails />
              </section>
            </main>
          }
        />
        <Route
          path="/admin/createowner"
          element={
            <main>
              <Header forHam={forAdmin.map(item => item.label)} />
              <section className="dashboardSkeleton">
                <Aside forHam={forAdmin} base={'admin'} />
                <CreatingOwner />
              </section>
            </main>
          }
        />
        <Route
          path="/admin/allottingparkingslot"
          element={
            <main>
              <Header forHam={forAdmin.map(item => item.label)} />
              <section className="dashboardSkeleton">
                <Aside forHam={forAdmin} base={'admin'} />
                <CreatingParkingSlot />
              </section>
            </main>
          }
        />
        <Route
          path="/admin/complaints"
          element={
            <main>
              <Header forHam={forAdmin.map(item => item.label)} />
              <section className="dashboardSkeleton">
                <Aside forHam={forAdmin} base={'admin'} />
                <ComplaintsViewer />
              </section>
            </main>
          }
        />
        <Route
          path="/tenant/raisingcomplaints"
          element={
            <main>
              <Header forHam={forTenant.map(item => item.label)} />
              <section className="dashboardSkeleton">
                <Aside forHam={forTenant} base={'tenant'} />
                <RaisingComplaints />
              </section>
            </main>
          }
        />
        <Route
          path="/tenant/allotedparkingslot"
          element={
            <main>
              <Header forHam={forTenant.map(item => item.label)} />
              <section className="dashboardSkeleton">
                <Aside forHam={forTenant} base={'tenant'} />
                <ParkingSlot />
              </section>
            </main>
          }
        />
        <Route
          path="/tenant/paymaintenance"
          element={
            <main>
              <Header forHam={forTenant.map(item => item.label)} />
              <section className="dashboardSkeleton">
                <Aside forHam={forTenant} base={'tenant'} />
                <PayMaintenance />
              </section>
            </main>
          }
        />
        {/* Updated Route for EditProfile to handle dynamic userType */}
        <Route
          path="/:userType/edit-profile"
          element={
            <main>
              <Header forHam={[...navItems.map(item => item.label), "Déconnexion"]} />
              <section className="dashboardSkeleton">
                <Aside forHam={navItems} base={basePath} />
                <EditProfile />
              </section>
            </main>
          }
        />
        <Route
          path="/owner/tenantdetails"
          element={
            <main>
              <Header forHam={forOwner.map(item => item.label)} />
              <section className="dashboardSkeleton">
                <Aside forHam={forOwner} base={'owner'} />
                <RoomDetailsOwner />
              </section>
            </main>
          }
        />
        <Route
          path="/owner/complaint"
          element={
            <main>
              <Header forHam={forOwner.map(item => item.label)} />
              <section className="dashboardSkeleton">
                <Aside forHam={forOwner} base={'owner'} />
                <ComplaintsViewerOwner />
              </section>
            </main>
          }
        />
        <Route
          path="/owner/createtenant"
          element={
            <main>
              <Header forHam={forOwner.map(item => item.label)} />
              <section className="dashboardSkeleton">
                <Aside forHam={forOwner} base={'owner'} />
                <CreatingTenant />
              </section>
            </main>
          }
        />
        <Route
          path="/owner/roomdetails"
          element={
            <main>
              <Header forHam={forOwner.map(item => item.label)} />
              <section className="dashboardSkeleton">
                <Aside forHam={forOwner} base={'owner'} />
                <RoomDetails />
              </section>
            </main>
          }
        />
        <Route
          path="/employee/complaints"
          element={
            <main>
              <Header forHam={forEmployee.map(item => item.label)} />
              <section className="dashboardSkeleton">
                <Aside forHam={forEmployee} base={'employee'} />
                <ComplaintsViewer />
              </section>
            </main>
          }
        />
        <Route
          path="/owner/maintenancerequests"
          element={
            <main>
              <Header forHam={forOwner.map(item => item.label)} />
              <section className="dashboardSkeleton">
                <Aside forHam={forOwner} base={'owner'} />
                <MaintenanceRequests />
              </section>
            </main>
          }
        />
        <Route
          path="/admin/maintenancerequests"
          element={
            <main>
              <Header forHam={forAdmin.map(item => item.label)} />
              <section className="dashboardSkeleton">
                <Aside forHam={forAdmin} base={'admin'} />
                <MaintenanceRequests />
              </section>
            </main>
          }
        />
        <Route
          path="/employee/maintenancerequests"
          element={
            <main>
              <Header forHam={forEmployee.map(item => item.label)} />
              <section className="dashboardSkeleton">
                <Aside forHam={forEmployee} base={'employee'} />
                <MaintenanceRequests />
              </section>
            </main>
          }
        />
        <Route path="/*" element={<main><ErrorPage /></main>} />
      </Routes>
    </div>
  );
}

export default App;