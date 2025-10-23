import { Language } from '../types';

export const hostRequestMessageTemplates: Record<Language, string> = {
  fr: `Bonjour chers frères et sœurs, ☀️

Nous avons la joie d'accueillir prochainement plusieurs orateurs visiteurs. Nous recherchons des familles hospitalières pour les recevoir.

Voici les visites pour lesquelles nous avons besoin de votre aide :

{visitList}

Si vous pouvez aider pour l'un de ces besoins (hébergement, repas, ou les deux), merci de répondre en précisant le nom de l'orateur et ce que vous pouvez proposer.

Votre hospitalité est grandement appréciée !

« N’oubliez pas l’hospitalité, car grâce à elle certains ont sans le savoir logé des anges. » (Hébreux 13:2)

{hospitalityOverseer}
{hospitalityOverseerPhone}`,
  cv: `Olá, keridus irmons i irmãs, ☀️

Nu ten alegria di resebe alguns oradoris vizitanti na futuru prósimu. Nu sta buska famílias ospitaleras pa resebe-s.

Es li é kes vizita ki nu mesti di nhos ajuda pa akolhimentu:

{visitList}

Si nhos pode djuda ku un di kes nesesidadi li (alojamentu, kumida, ô es dôs), favor responde ku nómi di orador i ku kuzê ki nhos pode oferese.

Nhos ospitalidadi é mutu apresiadu!

« Ka nhos skese di ospitalidadi, pamodi é grasas a el ki alguns resebe anjus na ses kaza sen es sabe. » (Ebreus 13:2)

{hospitalityOverseer}
{hospitalityOverseerPhone}`,
};
