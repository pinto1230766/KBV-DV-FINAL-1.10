import { Language, MessageType, MessageRole } from '../types';

export const messageTemplates: Record<Language, Record<MessageType, Record<MessageRole, string>>> = {
  fr: {
    confirmation: {
      speaker: `Bonjour Frère {speakerName},{firstTimeIntroduction}

Nous nous réjouissons de t'accueillir pour ton discours le {visitDate}.

Afin de préparer au mieux ta venue, pourrais-tu nous indiquer si tu as des besoins particuliers ?
- As-tu besoin d'un hébergement ?
- Serais-tu disponible pour un repas ?
- Viendras-tu par tes propres moyens ou as-tu besoin qu'on vienne te chercher ?

N'hésite pas si tu as la moindre question.
Fraternellement.

{hospitalityOverseer}
{hospitalityOverseerPhone}`,
      host: `Bonjour Frère {hostName},

J'espère que tu vas bien.
Juste une petite confirmation pour l'accueil de Frère *{speakerName}* le *{visitDate}*.

Est-ce que tout est en ordre de ton côté ?

Merci pour ton hospitalité !
Fraternellement.

{hospitalityOverseer}
{hospitalityOverseerPhone}`
    },
    preparation: {
      speaker: `Bonjour Frère {speakerName},

J'espère que tu vas bien.

Nous nous réjouissons de t'accueillir pour ton discours public prévu le *{visitDate}* à *{visitTime}*.

Pour l'organisation, c'est notre frère *{hostName}* qui s'occupera de ton accueil. Si tu as des questions ou des besoins spécifiques (transport, hébergement, repas), n'hésite pas à le contacter.

Voici ses coordonnées :
- Téléphone : {hostPhone}
- Adresse : {hostAddress}

Nous avons hâte de passer ce moment avec toi.

Fraternellement.

{hospitalityOverseer}
{hospitalityOverseerPhone}`,
      host: `Bonjour Frère {hostName},

J'espère que tu vas bien.

Je te contacte concernant l'accueil de notre orateur invité, Frère *{speakerName}*, qui nous visitera le *{visitDate}* à *{visitTime}*.

Merci de t'être porté volontaire. Peux-tu prendre contact avec lui pour coordonner les détails de sa visite (transport, repas, hébergement) ? Son numéro est {speakerPhone}.

Fais-moi savoir si tu as la moindre question.

Merci pour ton hospitalité.
Fraternellement.

{hospitalityOverseer}
{hospitalityOverseerPhone}`
    },
    'reminder-7': {
      speaker: `Bonjour Frère {speakerName},

Ceci est un petit rappel amical pour ton discours public parmi nous, prévu dans une semaine, le *{visitDate}* à *{visitTime}*.

Frère {hostName} ({hostPhone}) est toujours ton contact pour l'organisation.

Nous nous réjouissons de t'accueillir.
À très bientôt !

{hospitalityOverseer}
{hospitalityOverseerPhone}`,
      host: `Bonjour Frère {hostName},

Petit rappel amical concernant l'accueil de Frère *{speakerName}*, prévu dans une semaine, le *{visitDate}* à *{visitTime}*.

N'hésite pas si tu as des questions.

Merci encore pour ton aide précieuse.
Fraternellement.

{hospitalityOverseer}
{hospitalityOverseerPhone}`
    },
    'reminder-2': {
      speaker: `Bonjour Frère {speakerName},

Dernier petit rappel avant ton discours public prévu ce week-end, le *{visitDate}* à *{visitTime}*.

Nous avons vraiment hâte de t'écouter. Fais bon voyage si tu dois te déplacer.

Fraternellement.

{hospitalityOverseer}
{hospitalityOverseerPhone}`,
      host: `Bonjour Frère {hostName},

Dernier petit rappel pour l'accueil de Frère *{speakerName}* ce week-end, le *{visitDate}* à *{visitTime}*.

Tout est en ordre de ton côté ?

Merci pour tout.
Fraternellement.

{hospitalityOverseer}
{hospitalityOverseerPhone}`
    },
    thanks: {
      speaker: `Bonjour Frère {speakerName},

Juste un petit mot pour te remercier encore chaleureusement pour ton excellent discours. Nous avons tous été très encouragés.

Nous espérons que tu as passé un bon moment parmi nous et que ton retour s'est bien passé.

Si tu as eu des frais de visite (transport, repas, hébergement), n'hésite pas à nous les transmettre pour remboursement.

Au plaisir de te revoir.
Fraternellement.

{hospitalityOverseer}
{hospitalityOverseerPhone}`,
      host: `Bonjour Frère {hostName},

Un grand merci pour ta merveilleuse hospitalité envers Frère *{speakerName}* ce week-end. C'est grâce à des frères comme toi que nos orateurs se sentent si bien accueillis.

Ton aide a été très appréciée.

Fraternellement.

{hospitalityOverseer}
{hospitalityOverseerPhone}`
    }
  },
  cv: {
    confirmation: {
      speaker: `Olá, Irmon {speakerName},{firstTimeIntroduction}

Nu sta kontenti di resebe-u pa bu diskursu na dia {visitDate}.

Pa nu prepara midjor pa bu vizita, bu pode fla-nu si bu ten algun nesesidadi spesial?
- Bu mesti di alojamentu?
- Bu sta dispunível pa un kumida?
- Bu ta ben pa bu konta ô bu mesti pa algen bai buska-u?

Si bu tiver kualker pergunta, ka bu ezita.
Ku amor fraternu.

{hospitalityOverseer}
{hospitalityOverseerPhone}`,
      host: `Olá, Irmon {hostName},

N ta spera ma bu sta dretu.
Sô un konfirmason rapidu pa akolhimentu di Irmon *{speakerName}* na dia *{visitDate}*.

Sta tudu dretu di bu ladu?

Obrigadu pa bu ospitalidadi!
Ku amor fraternu.

{hospitalityOverseer}
{hospitalityOverseerPhone}`
    },
    preparation: {
      speaker: `Olá, Irmon {speakerName},

N ta spera ma bu sta dretu.

Nu sta kontenti di resebe-u pa bu diskursu públiku markadu pa dia *{visitDate}* às *{visitTime}*.

Pa organizason, é nos irmon *{hostName}* ki ta enkarrega di resebe-u. Si bu tiver algun pergunta ô nesesidadi spesífiku (transporti, alojamentu, kumida), ka bu ezita na kontakta-l.

Es li é se kontaktu:
- Telefoni: {hostPhone}
- Nderesu: {hostAddress}

Nu sta ansiozu pa pasa es momentu ku bo.

Ku amor fraternu.

{hospitalityOverseer}
{hospitalityOverseerPhone}`,
      host: `Olá, Irmon {hostName},

N ta spera ma bu sta dretu.

N sta kontakta-u sobri akolhimentu di nos orador konvidadu, Irmon *{speakerName}*, ki ta vizita-nu na dia *{visitDate}* às *{visitTime}*.

Obrigadu pa bu voluntariadu. Bu pode entra en kontaktu ku el pa kordena kes detadjis di se vizita (transporti, kumida, alojamentu)? Se númeru é {speakerPhone}.

Aviza-m si bu tiver algun pergunta.

Obrigadu pa bu ospitalidadi.
Ku amor fraternu.

{hospitalityOverseer}
{hospitalityOverseerPhone}`
    },
    'reminder-7': {
      speaker: `Olá, Irmon {speakerName},

Es li é un pikenu lembreti amigável pa bu diskursu públiku na nos kongregason, markadu pa li un simana, na dia *{visitDate}* às *{visitTime}*.

Irmon {hostName} ({hostPhone}) inda é bu kontaktu pa organizason.

Nu sta kontenti di resebe-u.
Te breve!

{hospitalityOverseer}
{hospitalityOverseerPhone}`,
      host: `Olá, Irmon {hostName},

Pikenu lembreti amigável sobri akolhimentu di Irmon *{speakerName}*, markadu pa li un simana, na dia *{visitDate}* às *{visitTime}*.

Ka bu ezita si bu tiver algun pergunta.

Obrigadu más un bes pa bu ajuda presioza.
Ku amor fraternu.

{hospitalityOverseer}
{hospitalityOverseerPhone}`
    },
    'reminder-2': {
      speaker: `Olá, Irmon {speakerName},

Últimu pikenu lembreti antis di bu diskursu públiku markadu pa es fin di simana, na dia *{visitDate}* às *{visitTime}*.

Nu sta mutu ansiozu pa uvi-u. Fazi un bon viaji si bu tiver ki disloka.

Ku amor fraternu.

{hospitalityOverseer}
{hospitalityOverseerPhone}`,
      host: `Olá, Irmon {hostName},

Últimu pikenu lembreti pa akolhimentu di Irmon *{speakerName}* es fin di simana, na dia *{visitDate}* às *{visitTime}*.

Tudu dretu di bu ladu?

Obrigadu pa tudu.
Ku amor fraternu.

{hospitalityOverseer}
{hospitalityOverseerPhone}`
    },
    thanks: {
      speaker: `Olá, Irmon {speakerName},

Sô un palavrinha pa gradese-u más un bes di korason pa bu eselenti diskursu. Nu fika tudu mutu enkorajadu.

Nu ta spera ma bu pasa un bon momentu na nos meiu i ma bu regresu foi tranquilu.

Si bu teve gastus di vizita (transporti, kumida, alojamentu), ka bu ezita na manda-nu pa reembolzu.

Un abrasu i ti próssima.
Ku amor fraternu.

{hospitalityOverseer}
{hospitalityOverseerPhone}`,
      host: `Olá, Irmon {hostName},

Un grandi obrigadu pa bu maravilhoza ospitalidadi pa ku Irmon *{speakerName}* es fin di simana. É grasas a irmons sima bo ki nos oradoris ta sinti tan ben resebidu.

Bu ajuda foi mutu apresiadu.

Ku amor fraternu.

{hospitalityOverseer}
{hospitalityOverseerPhone}`
    }
  }
};
