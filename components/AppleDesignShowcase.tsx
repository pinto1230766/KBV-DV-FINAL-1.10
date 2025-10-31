import React, { useState } from 'react';
import { AppleCard } from './AppleCard';
import { AppleButton } from './AppleButton';
import { AppleModal } from './AppleModal';
import { AppleInput } from './AppleInput';
import { AppleBadge } from './AppleBadge';
import { AppleNavigation, AppleNavItem } from './AppleNavigation';
import { AppleList, AppleListItem } from './AppleList';
import { AppleToast } from './AppleToast';
import { 
  SparklesIcon, 
  UserIcon, 
  CogIcon, 
  BellIcon, 
  HeartIcon,
  StarIcon,
  SearchIcon
} from './Icons';

export const AppleDesignShowcase: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [activeTab, setActiveTab] = useState('showcase');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navigation */}
      <AppleNavigation glass>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-8 h-8 text-blue-500" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Apple Design System
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <AppleNavItem 
            active={activeTab === 'showcase'} 
            onClick={() => setActiveTab('showcase')}
            icon={<SparklesIcon className="w-5 h-5" />}
          >
            Showcase
          </AppleNavItem>
          <AppleNavItem 
            active={activeTab === 'components'} 
            onClick={() => setActiveTab('components')}
            icon={<CogIcon className="w-5 h-5" />}
            badge={12}
          >
            Components
          </AppleNavItem>
        </div>
      </AppleNavigation>

      <div className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Design de niveau Apple
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Interface premium avec glassmorphism, animations fluides et composants raffinés
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Card 1 - Glassmorphism */}
          <AppleCard glass className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <SparklesIcon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Glassmorphism
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              Effet de verre avec backdrop blur pour un rendu premium
            </p>
            <AppleBadge variant="primary">Premium</AppleBadge>
          </AppleCard>

          {/* Card 2 - Animations */}
          <AppleCard className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <HeartIcon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Animations fluides
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              Transitions et micro-interactions comme sur iOS
            </p>
            <AppleBadge variant="success">Smooth</AppleBadge>
          </AppleCard>

          {/* Card 3 - Components */}
          <AppleCard className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <StarIcon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Composants raffinés
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              Bibliothèque complète de composants Apple-style
            </p>
            <AppleBadge variant="warning">Quality</AppleBadge>
          </AppleCard>
        </div>

        {/* Interactive Demo */}
        <AppleCard className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Démonstration interactive
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Buttons Demo */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Boutons
              </h4>
              <div className="space-y-3">
                <AppleButton 
                  variant="primary" 
                  onClick={() => setShowToast(true)}
                  icon={<BellIcon className="w-5 h-5" />}
                >
                  Afficher Toast
                </AppleButton>
                <AppleButton 
                  variant="secondary" 
                  onClick={() => setIsModalOpen(true)}
                >
                  Ouvrir Modal
                </AppleButton>
                <AppleButton variant="success" size="sm">
                  Succès
                </AppleButton>
                <AppleButton variant="danger" size="lg">
                  Danger
                </AppleButton>
              </div>
            </div>

            {/* Input Demo */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Champs de saisie
              </h4>
              <div className="space-y-4">
                <AppleInput
                  label="Nom d'utilisateur"
                  placeholder="Entrez votre nom"
                  value={inputValue}
                  onChange={setInputValue}
                  icon={<UserIcon className="w-5 h-5" />}
                />
                <AppleInput
                  label="Recherche"
                  placeholder="Rechercher..."
                  value=""
                  onChange={() => {}}
                  icon={<SearchIcon className="w-5 h-5" />}
                />
                <AppleInput
                  label="Email avec erreur"
                  placeholder="email@exemple.com"
                  value="email-invalide"
                  onChange={() => {}}
                  error="Format d'email invalide"
                  type="email"
                />
              </div>
            </div>
          </div>
        </AppleCard>

        {/* List Demo */}
        <AppleCard>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Liste Apple-style
          </h3>
          
          <AppleList>
            <AppleListItem
              icon={<UserIcon className="w-6 h-6" />}
              badge={<AppleBadge variant="primary" size="sm">Pro</AppleBadge>}
              chevron
              onClick={() => console.log('Profile clicked')}
            >
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  Profil utilisateur
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Gérer vos informations personnelles
                </p>
              </div>
            </AppleListItem>
            
            <AppleListItem
              icon={<BellIcon className="w-6 h-6" />}
              badge={<AppleBadge variant="danger" size="sm" dot />}
              chevron
            >
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  Notifications
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  3 nouvelles notifications
                </p>
              </div>
            </AppleListItem>
            
            <AppleListItem
              icon={<CogIcon className="w-6 h-6" />}
              chevron
            >
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  Paramètres
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Configuration de l'application
                </p>
              </div>
            </AppleListItem>
          </AppleList>
        </AppleCard>
      </div>

      {/* Modal */}
      <AppleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Modal Apple-style"
        size="md"
      >
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-6 flex items-center justify-center">
            <SparklesIcon className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Design Premium
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Cette modal utilise le glassmorphism et les animations Apple pour une expérience utilisateur exceptionnelle.
          </p>
          <div className="flex gap-3 justify-center">
            <AppleButton variant="secondary" onClick={() => setIsModalOpen(false)}>
              Annuler
            </AppleButton>
            <AppleButton variant="primary" onClick={() => setIsModalOpen(false)}>
              Confirmer
            </AppleButton>
          </div>
        </div>
      </AppleModal>

      {/* Toast */}
      {showToast && (
        <AppleToast
          message="Design Apple appliqué avec succès ! 🎉"
          type="success"
          onClose={() => setShowToast(false)}
          duration={3000}
        />
      )}
    </div>
  );
};