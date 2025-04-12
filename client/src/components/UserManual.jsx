import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import {
  FaUser, FaUsers, FaBriefcase, FaHome, FaMoneyBillWave, FaExclamationTriangle,
  FaCar, FaWrench, FaEnvelope, FaQuestionCircle, FaHeadset, FaArrowLeft
} from "react-icons/fa";

function UserManual() {
  const { darkMode } = useTheme();
  const navigate = useNavigate();

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
        <h1 className="text-3xl font-bold">Manuel de l'Utilisateur - LocManager</h1>
        <button
          onClick={() => navigate(`/${JSON.parse(window.localStorage.getItem("whom"))?.userType || ""}`)}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-all duration-300 bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          <FaArrowLeft />
          Retour au Tableau de Bord
        </button>
      </motion.div>

      {/* Introduction */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-xl shadow-lg p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      >
        <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
        <p className="text-base">
          Bienvenue dans le manuel de l'utilisateur de LocManager, une application conçue pour faciliter la gestion des appartements pour les administrateurs, locataires, propriétaires et employés. Ce guide vous aidera à naviguer dans l'application et à utiliser ses fonctionnalités principales.
        </p>
      </motion.div>

      {/* Admin Guide */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="rounded-xl shadow-lg p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      >
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <FaUser className="text-blue-500" />
          Guide pour les Administrateurs
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">1. Vue d'Ensemble du Tableau de Bord</h3>
            <p className="text-base">
              Le tableau de bord admin vous donne un aperçu des statistiques clés, telles que le nombre total de propriétaires, locataires, employés, et les demandes en attente.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">2. Créer un Propriétaire</h3>
            <ul className="list-disc pl-6 space-y-1 text-base">
              <li>Allez dans "Actions Rapides" et cliquez sur "Créer un propriétaire".</li>
              <li>Remplissez les informations requises (nom, âge, numéro de chambre, mot de passe, statut de l'accord).</li>
              <li>Soumettez le formulaire pour ajouter un nouveau propriétaire.</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">3. Voir les Locataires</h3>
            <ul className="list-disc pl-6 space-y-1 text-base">
              <li>Dans "Actions Rapides", cliquez sur "Voir les locataires".</li>
              <li>Vous verrez une liste de tous les locataires avec leurs détails.</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">4. Exporter les Données</h3>
            <ul className="list-disc pl-6 space-y-1 text-base">
              <li>Dans "Actions Rapides", cliquez sur "Exporter les données".</li>
              <li>Un fichier CSV contenant les données des utilisateurs sera téléchargé.</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Tenant Guide */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="rounded-xl shadow-lg p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      >
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <FaUsers className="text-blue-500" />
          Guide pour les Locataires
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">1. Vue d'Ensemble du Tableau de Bord</h3>
            <p className="text-base">
              Le tableau de bord locataire affiche vos informations personnelles, le statut de paiement, et les actions rapides.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">2. Payer l'Entretien</h3>
            <ul className="list-disc pl-6 space-y-1 text-base">
              <li>Dans "Actions Rapides", cliquez sur "Payer l'entretien".</li>
              <li>Confirmez le paiement pour mettre à jour votre statut.</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">3. Déposer une Plainte</h3>
            <ul className="list-disc pl-6 space-y-1 text-base">
              <li>Dans "Actions Rapides", cliquez sur "Déposer une plainte".</li>
              <li>Remplissez les détails de votre plainte et soumettez.</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">4. Réserver un Emplacement de Parking</h3>
            <ul className="list-disc pl-6 space-y-1 text-base">
              <li>Dans "Actions Rapides", cliquez sur "Réserver un emplacement de parking".</li>
              <li>Sélectionnez un emplacement disponible et confirmez.</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">5. Voir les Emplacements de Parking</h3>
            <ul className="list-disc pl-6 space-y-1 text-base">
              <li>Dans "Actions Rapides", cliquez sur "Voir les emplacements de parking".</li>
              <li>Consultez les emplacements réservés et disponibles.</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Owner Guide */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="rounded-xl shadow-lg p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      >
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <FaHome className="text-blue-500" />
          Guide pour les Propriétaires
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">1. Vue d'Ensemble du Tableau de Bord</h3>
            <p className="text-base">
              Le tableau de bord propriétaire montre le nombre d'employés, les plaintes récentes, et un aperçu des locataires.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">2. Créer un Locataire</h3>
            <ul className="list-disc pl-6 space-y-1 text-base">
              <li>Dans "Actions Rapides", cliquez sur "Créer un locataire".</li>
              <li>Remplissez les informations du locataire (nom, âge, numéro de chambre, etc.).</li>
              <li>Soumettez pour ajouter le locataire.</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">3. Voir les Locataires</h3>
            <ul className="list-disc pl-6 space-y-1 text-base">
              <li>Dans "Actions Rapides", cliquez sur "Voir les locataires".</li>
              <li>Consultez la liste des locataires et leurs détails.</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">4. Gérer les Plaintes</h3>
            <ul className="list-disc pl-6 space-y-1 text-base">
              <li>Dans "Résumé des Plaintes Récentes", consultez les plaintes déposées par les locataires.</li>
              <li>Cliquez sur "Résoudre" pour marquer une plainte comme résolue, ou "Résoudre tout" pour toutes les plaintes non résolues.</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Employee Guide */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="rounded-xl shadow-lg p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      >
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <FaBriefcase className="text-blue-500" />
          Guide pour les Employés
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">1. Vue d'Ensemble du Tableau de Bord</h3>
            <p className="text-base">
              Le tableau de bord employé affiche le nombre total de plaintes, votre salaire, et les tâches en attente.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">2. Voir les Plaintes</h3>
            <ul className="list-disc pl-6 space-y-1 text-base">
              <li>Dans "Actions Rapides", cliquez sur "Voir les plaintes".</li>
              <li>Consultez les plaintes déposées par les locataires.</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">3. Envoyer un Message</h3>
            <ul className="list-disc pl-6 space-y-1 text-base">
              <li>Dans la section "Envoyer un Message", sélectionnez le type de destinataire (Administrateur ou Propriétaire).</li>
              <li>Choisissez le destinataire, entrez un sujet et un message, puis cliquez sur "Envoyer le message".</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">4. Gérer les Demandes de Maintenance</h3>
            <ul className="list-disc pl-6 space-y-1 text-base">
              <li>Dans "Demandes de Maintenance Récentes", consultez les demandes soumises par les locataires.</li>
              <li>Cliquez sur "Voir toutes les demandes" pour gérer les demandes en détail.</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* FAQ Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="rounded-xl shadow-lg p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      >
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <FaQuestionCircle className="text-blue-500" />
          Foire Aux Questions (FAQ)
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">1. Comment vérifier mon adresse e-mail ?</h3>
            <p className="text-base">
              Allez dans "Modifier le Profil" depuis votre tableau de bord. Si votre e-mail n'est pas vérifié, vous verrez un bouton "Renvoyer l'e-mail de vérification". Cliquez dessus et suivez le lien envoyé à votre adresse e-mail.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">2. Que faire si j'oublie mon mot de passe ?</h3>
            <p className="text-base">
              Contactez l'administrateur via la page "Contacter le support" pour réinitialiser votre mot de passe.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">3. Comment signaler un problème technique ?</h3>
            <p className="text-base">
              Utilisez le lien "Contacter le support" dans la section "Liens Rapides" pour signaler tout problème technique.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Contact Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="rounded-xl shadow-lg p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      >
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <FaHeadset className="text-blue-500" />
          Contacter le Support
        </h2>
        <p className="text-base">
          Si vous avez des questions ou besoin d'assistance, veuillez contacter notre équipe de support :
        </p>
        <ul className="list-disc pl-6 space-y-1 text-base mt-2">
          <li>Email : <a href="mailto:support@locmanager.com" className="text-blue-500 hover:underline">support@locmanager.com</a></li>
          <li>Téléphone : +33 1 23 45 67 89</li>
          <li>Horaires : Lundi au Vendredi, 9h00 - 17h00</li>
        </ul>
      </motion.div>
    </div>
  );
}

export default UserManual;