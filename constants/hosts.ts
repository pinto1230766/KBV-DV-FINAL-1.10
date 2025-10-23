import type { Host } from '../types';

export const initialHosts: Host[] = [
  {
    nom: 'Famille Fernandes',
    address: '12 Rue des Marronniers, 69002 Lyon',
    telephone: '+33611223344',
    gender: 'couple',
    tags: ['proche salle', 'sans animaux'],
    notes: 'Appartement lumineux, 2 chambres disponibles.',
  },
  {
    nom: 'Famille Oliveira',
    address: '8 Avenue Jean Jaurès, 69150 Décines',
    telephone: '+33655667788',
    gender: 'couple',
    tags: ['voiture', 'allergie chat'],
    notes: 'Peut transporter les orateurs depuis la gare Part-Dieu.',
  },
  {
    nom: 'Famille Mendes',
    address: '24 Rue de la République, 69002 Lyon',
    telephone: '+33699887766',
    gender: 'couple',
    tags: ['proche transport'],
    notes: 'Possède un ascenseur, convient aux personnes âges.',
  },
  {
    nom: 'Famille Santos',
    address: '53 Rue Garibaldi, 69006 Lyon',
    telephone: '+33677889900',
    gender: 'couple',
    tags: ['animal friendly'],
    notes: 'Petit jardin, accepte les animaux de compagnie.',
  },
  {
    nom: 'Famille Ferreira',
    address: '18 Rue Victor Hugo, 69100 Villeurbanne',
    telephone: '+33633445566',
    gender: 'couple',
    tags: ['langue espagnole'],
    notes: 'Parle également espagnol, bon pour orateurs hispanophones.',
  },
];
