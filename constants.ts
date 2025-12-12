import { Speaker, Host, Language, MessageType, MessageRole, Visit, SpeakerRaw, PublicTalk, SpecialDate, SpecialDateType, HostRequestTemplate } from './types';
import { generateUUID } from './utils/uuid';

export const UNASSIGNED_HOST = 'À définir';
export const NO_HOST_NEEDED = 'Pas nécessaire';

// Raw data for speakers and their scheduled talks (both past and future)
const speakersWithTalksRaw: SpeakerRaw[] = [

    {
        id: "4",
        nom: "Alexis CARVALHO",
        congregation: "Lyon KBV",
        talkHistory: [
            {
                date: "2026-01-03",
                talkNo: null,
                theme: null
            }
        ],
        telephone: "33644556677"
    },
    {
        id: "25",
        nom: "José DA SILVA",
        congregation: "Creil KBV",
        talkHistory: [
            {
                date: "2026-01-10",
                talkNo: "179",
                theme: "Nega iluzon di mundu, sforsa pa kes kuza di Reinu ki ta izisti di verdadi"
            }
        ],
        telephone: "33618772533"
    },
    {
        id: "20",
        nom: "João CECCON",
        congregation: "Villiers KBV",
        talkHistory: [
            {
                date: "2026-01-17",
                talkNo: "1",
                theme: "Bu konxe Deus dretu?"
            }
        ],
        telephone: "33601234567"
    },
    {
        id: "30",
        nom: "Marcelino DOS SANTOS",
        congregation: "Plaisir KBV",
        talkHistory: [
            {
                date: "2026-01-10",
                talkNo: "100",
                theme: "Modi ki nu pode faze bons amizadi"
            },
            {
                date: "2026-01-24",
                talkNo: "36",
                theme: "Vida é só kel-li?"
            }
        ],
        telephone: "33650015128"
    },
    {
        id: "9",
        nom: "David MOREIRA",
        congregation: "Steinsel KBV",
        talkHistory: [
            {
                date: "2026-01-31",
                talkNo: "56",
                theme: "Na ki lider ki bu pode kunfia?"
            }
        ],
        telephone: "352621386797"
    },
    {
        id: "11",
        nom: "Eddy SILVA",
        congregation: "Steinsel KBV",
        talkHistory: [
            {
                date: "2026-02-07",
                talkNo: "9",
                theme: "Obi i kunpri Palavra di Deus"
            },
            {
                date: "2026-02-28",
                talkNo: "9",
                theme: "Obi i kunpri Palavra di Deus"
            }
        ],
        telephone: "352691574935"
    },
    {
        id: "37",
        nom: "Valdir DIOGO",
        congregation: "Porto KBV",
        talkHistory: [
            {
                date: "2026-02-14",
                talkNo: "189",
                theme: "Anda ku Deus ta traze-nu bensons gosi i pa tudu témpu"
            }
        ],
        telephone: "33677788899"
    },
    {
        id: "23",
        nom: "Jorge GONÇALVES",
        congregation: "Porto KBV",
        talkHistory: [
            {
                date: "2026-02-21",
                talkNo: "4",
                theme: "Ki próvas ten ma Deus ta izisti?"
            }
        ],
        telephone: "33633456789"
    },
    {
        id: "57",
        nom: "Jeje ou JP",
        congregation: "",
        talkHistory: [
            {
                date: "2026-02-28",
                talkNo: null,
                theme: null
            }
        ],
        gender: "male"
    },
    {
        id: "18",
        nom: "Jefersen BOELJIN",
        congregation: "Rotterdam KBV",
        talkHistory: [
            {
                date: "2026-03-07",
                talkNo: null,
                theme: null
            }
        ],
        telephone: "31618513034"
    },
    {
        id: "58",
        nom: "Dimitri GIVAC",
        congregation: "Marseille KBV",
        talkHistory: [
            {
                date: "2025-10-18",
                talkNo: null,
                theme: null
            },
            {
                date: "2026-03-14",
                talkNo: "3",
                theme: "Bu sta ta anda ku organizason unidu di Jeová?"
            }
        ],
        gender: "male"
    },
    {
        id: "38",
        nom: "Jonatã ALVES",
        congregation: "Albufeira KBV Zoom",
        talkHistory: [
            {
                date: "2026-03-21",
                talkNo: "11",
                theme: "Sima Jizus, nu 'ka ta faze párti di mundu'"
            }
        ],
        telephone: "",
        tags: [
            "zoom",
            "expérimenté"
        ]
    },
    {
        id: "event-59",
        nom: "Diskursu Spesial",
        congregation: "Événement spécial",
        talkHistory: [
            {
                date: "2026-03-28",
                talkNo: "DS",
                theme: "Ken ki ta ben konpo téra?"
            }
        ]
    },
    {
        id: "6",
        nom: "Dany TAVARES",
        congregation: "Plaisir KBV",
        talkHistory: [
            {
                date: "2025-05-03",
                talkNo: "32",
                theme: "Modi ki nu pode lida ku preokupasons di vida"
            },
            {
                date: "2025-09-20",
                talkNo: "102",
                theme: "Presta atenson na \"profesia\""
            }
        ],
        telephone: "33668121101"
    },
    {
        id: "24",
        nom: "José BATALHA",
        congregation: "Marseille KBV",
        talkHistory: [
            {
                date: "2025-05-31",
                talkNo: "17",
                theme: "Da Deus glória ku tudu kel ki bu ten"
            },
            {
                date: "2026-04-04",
                talkNo: "18",
                theme: "Faze Jeová bu fortaléza"
            }
        ],
        telephone: "33618505292"
    },
    {
        id: "22",
        nom: "Joel CARDOSO",
        congregation: "Nice KBV",
        talkHistory: [
            {
                date: "2025-06-14",
                talkNo: "30",
                theme: "Modi ki familia pode pápia ku kunpanheru midjór"
            }
        ],
        telephone: "33658943038"
    },
    {
        id: "19",
        nom: "Jérémy TORRES",
        congregation: "Lyon KBV",
        talkHistory: [
            {
                date: "2025-07-05",
                talkNo: "12",
                theme: "Deus kré pa bu ruspeta kes ki ren autoridadi"
            },
            {
                date: "2026-02-07",
                talkNo: "76",
                theme: "Prinsípius di Bíblia pode djuda-nu lida ku prublémas di oji?"
            }
        ],
        telephone: "33690123456",
        notes: "Allergique aux chats.",
        tags: [
            "allergie-chat"
        ],
        isVehiculed: false
    },
    {
        id: "10",
        nom: "David VIEIRA",
        congregation: "Villiers KBV",
        talkHistory: [
            {
                date: "2024-05-26",
                talkNo: "48",
                theme: "Modi ki nu pode kontinua lial pa Deus óras ki nu ta pasa pa próva"
            },
            {
                date: "2025-08-30",
                talkNo: "108",
                theme: "Bu pode kunfia ma nu ta ben ten un futuru sóbi!"
            }
        ],
        telephone: "33771670140"
    },
    {
        id: "27",
        nom: "Luis CARDOSO",
        congregation: "Nice KBV",
        talkHistory: [
            {
                date: "2025-09-06",
                talkNo: "15",
                theme: "Mostra bondadi pa tudu algen"
            }
        ],
        telephone: "33669519131"
    },
    {
        id: "60",
        nom: "Paulo COSTA",
        congregation: "Streaming",
        talkHistory: [
            {
                date: "2025-09-13",
                talkNo: "43",
                theme: "Kel ki Deus ta fla sénpri é midjór pa nos"
            }
        ],
        gender: "male"
    },
    {
        id: "61",
        nom: "João Paulo BAPTISTA",
        congregation: "Lyon KBV",
        talkHistory: [
            {
                date: "2025-09-27",
                talkNo: "DS",
                theme: "Modi ki géra ta ben kaba ?"
            }
        ],
        gender: "male"
    },
    {
        id: "8",
        nom: "David LUCIO",
        congregation: "Porto KBV",
        talkHistory: [
            {
                date: "2025-10-04",
                talkNo: "16",
                theme: "Kontinua ta bira bu amizadi ku Deus más fórti"
            }
        ],
        telephone: "351960413461"
    },
    {
        id: "33",
        nom: "Moises CALDES",
        congregation: "Cannes KBV",
        talkHistory: [
            {
                date: "2024-11-17",
                talkNo: "64",
                theme: "Bu 'krê sô pasa sábi' ô bu ta 'ama Deus'?"
            },
            {
                date: "2025-10-11",
                talkNo: "183",
                theme: "Tra odju di kuzas ki ka ten valor!"
            },
            {
                date: "2026-03-07",
                talkNo: "183",
                theme: "Tra odju di kuzas ki ka ten valor!"
            }
        ],
        telephone: "33627826869"
    },
    {
        id: "31",
        nom: "Mario MIRANDA",
        congregation: "Cannes KBV Zoom",
        talkHistory: [
            {
                date: "2025-10-25",
                talkNo: "100",
                theme: "Modi ki nu pode faze bons amizadi"
            }
        ],
        telephone: "33615879709"
    },
    {
        id: "15",
        nom: "Gilberto FERNANDES",
        congregation: "St Denis KBV",
        talkHistory: [
            {
                date: "2025-11-01",
                talkNo: "2",
                theme: "Bu ta skapa na témpu di fin?"
            }
        ],
        telephone: "33769017274"
    },
    {
        id: "14",
        nom: "Gianni FARIA",
        congregation: "Plaisir KBV",
        talkHistory: [
            {
                date: "2025-11-08",
                talkNo: "26",
                theme: "Abo é inportanti pa Deus?"
            }
        ],
        telephone: "33698657173"
    },
    {
        id: "event-62",
        nom: "Visita do Superintendente de Circuito",
        congregation: "Événement spécial",
        talkHistory: [
            {
                date: "2025-11-15",
                talkNo: "Visita do Superintendente de Circuito",
                theme: "Visita do Superintendente de Circuito"
            }
        ]
    },
    {
        id: "event-63",
        nom: "Assembleia de Circuito com Representante da Filial",
        congregation: "Événement spécial",
        talkHistory: [
            {
                date: "2025-11-22",
                talkNo: "Assembleia de Circuito com Representante da Filial",
                theme: "Assembleia de Circuito com Representante da Filial"
            }
        ]
    },
    {
        id: "36",
        nom: "Thomas FREITAS",
        congregation: "Lyon KBV",
        talkHistory: [
            {
                date: "2025-11-29",
                talkNo: "70",
                theme: "Pamodi ki Deus merese nos kunfiansa?"
            },
            {
                date: "2026-06-06",
                talkNo: "31",
                theme: "Bu ten konsénsia ma bu ten nisisidadi spritual?"
            }
        ],
        telephone: "33666677788"
    },
    {
        id: "32",
        nom: "Matthieu DHALENNE",
        congregation: "Steinsel KBV",
        talkHistory: [
            {
                date: "2025-12-06",
                talkNo: "194",
                theme: "Modi ki sabedoria di Deus ta djuda-nu"
            }
        ],
        telephone: "33628253599"
    },
    {
        id: "12",
        nom: "François GIANNINO",
        congregation: "St Denis KBV",
        talkHistory: [
            {
                date: "2025-12-13",
                talkNo: "7",
                theme: "Imita mizerikordia di Jeová"
            }
        ],
        telephone: "33633891566"
    },
    {
        id: "event-64",
        nom: "Asenbleia ku enkaregadu di grupu di kongregason",
        congregation: "Événement spécial",
        talkHistory: [
            {
                date: "2025-12-20",
                talkNo: "Asenbleia ku enkaregadu di grupu di kongregason",
                theme: "Asenbleia ku enkaregadu di grupu di kongregason"
            }
        ]
    },
    {
        id: "26",
        nom: "José FREITAS",
        congregation: "Lyon KBV",
        talkHistory: [
            {
                date: "2025-12-27",
                talkNo: "55",
                theme: "Modi ki bu pode faze un bon nómi ki ta agrada Deus?"
            }
        ],
        telephone: "33666789012"
    },
    {
        id: "1",
        nom: "Ailton DIAS",
        congregation: "Villiers-sur-Marne",
        talkHistory: [],
        telephone: "33611223344",
        gender: "male"
    },
    {
        id: "2",
        nom: "Alain CURTIS",
        congregation: "Marseille KBV",
        talkHistory: [],
        telephone: "33606630000",
        notes: "Préfère un repas léger le soir. Pas d'hébergement nécessaire, a de la famille à proximité.",
        gender: "male",
        tags: [
            "sans escaliers",
            "calme"
        ]
    },
    {
        id: "3",
        nom: "Alexandre NOGUEIRA",
        congregation: "Creil",
        talkHistory: [],
        telephone: "33612526605",
        gender: "male"
    },
    {
        id: "5",
        nom: "Daniel FORTES",
        congregation: "Villiers-sur-Marne",
        talkHistory: [],
        telephone: "33655667788",
        gender: "male"
    },
    {
        id: "7",
        nom: "David DE FARIA",
        congregation: "Villiers-sur-Marne",
        talkHistory: [],
        telephone: "33677889900",
        gender: "male"
    },
    {
        id: "13",
        nom: "Fred MARQUES",
        congregation: "Villiers-sur-Marne",
        talkHistory: [],
        telephone: "33634567890",
        gender: "male"
    },
    {
        id: "16",
        nom: "Isaque PEREIRA",
        congregation: "St Denis KBV",
        talkHistory: [
            {
                date: "2024-02-18",
                talkNo: "50",
                theme: "Modi ki nu pode toma disizons ki ta djuda-nu ten bons rezultadu na vida"
            }
        ],
        telephone: "33652851904",
        gender: "male"
    },
    {
        id: "17",
        nom: "Jean-Paul BATISTA",
        congregation: "Lyon",
        talkHistory: [],
        telephone: "33678901234",
        gender: "male"
    },
    {
        id: "21",
        nom: "João-Paulo BAPTISTA",
        congregation: "Lyon KBV",
        talkHistory: [],
        telephone: "33611234567",
        gender: "male"
    },
    {
        id: "28",
        nom: "Luis FARIA",
        congregation: "Plaisir",
        talkHistory: [],
        telephone: "33670748952",
        gender: "male"
    },
    {
        id: "29",
        nom: "Manuel ANTUNES",
        congregation: "Villiers KBV",
        talkHistory: [
            {
                date: "2025-01-19",
                talkNo: "77",
                theme: "'Nhos mostra sénpri ma nhos sabe resebe algen dretu'"
            }
        ],
        telephone: "33670872232",
        gender: "male"
    },
    {
        id: "35",
        nom: "Santiago MONIZ",
        congregation: "Esch",
        talkHistory: [],
        telephone: "352691253068",
        gender: "male"
    },
    {
        id: "39",
        nom: "Lionel ALMEIDA",
        congregation: "À définir",
        talkHistory: [],
        telephone: "33632461762",
        gender: "male"
    },
    {
        id: "40",
        nom: "Arthur FELICIANO",
        congregation: "À définir",
        talkHistory: [],
        telephone: "352621283777",
        gender: "male"
    },
    {
        id: "41",
        nom: "Andrea MENARA",
        congregation: "À définir",
        talkHistory: [
            {
                date: "2026-04-11",
                talkNo: "103",
                theme: "Modi ki bu pode xinti alegria di verdadi?"
            }
        ],
        telephone: "352691295018",
        gender: "male"
    },
    {
        id: "42",
        nom: "Victor RIBEIRO",
        congregation: "À définir",
        talkHistory: [],
        telephone: "352621625893",
        gender: "male"
    },
    {
        id: "43",
        nom: "Benvindo SILVA",
        congregation: "À définir",
        talkHistory: [],
        telephone: "352691453468",
        gender: "male"
    },
    {
        id: "44",
        nom: "Miguel SILVA",
        congregation: "À définir",
        talkHistory: [
            {
                date: "2026-06-13",
                talkNo: "65",
                theme: "Modi ki nu pode luta pa pas na un mundu xeiu di ódiu"
            }
        ],
        telephone: "352621651610",
        gender: "male"
    },
    {
        id: "45",
        nom: "José BARBOSA",
        congregation: "À définir",
        talkHistory: [],
        telephone: "352661931153",
        gender: "male"
    },
    {
        id: "46",
        nom: "Yuri BRADA",
        congregation: "À définir",
        talkHistory: [],
        telephone: "352691556138",
        gender: "male"
    },
    {
        id: "47",
        nom: "João CUSTEIRA",
        congregation: "À définir",
        talkHistory: [],
        telephone: "41799014137",
        gender: "male"
    },
    {
        id: "48",
        nom: "António GONGA",
        congregation: "À définir",
        talkHistory: [],
        telephone: "352661230114",
        gender: "male"
    },
    {
        id: "49",
        nom: "Ashley RAMOS",
        congregation: "À définir",
        talkHistory: [],
        telephone: "33695564747",
        gender: "male"
    },
    {
        id: "50",
        nom: "Júlio TAVARES",
        congregation: "À définir",
        talkHistory: [],
        telephone: "352621510176",
        gender: "male"
    },
    {
        id: "51",
        nom: "Paulo CORREIA",
        congregation: "À définir",
        talkHistory: [],
        telephone: "33661712640",
        gender: "male"
    },
    {
        id: "52",
        nom: "José FERNANDES",
        congregation: "À définir",
        talkHistory: [],
        telephone: "33661881589",
        gender: "male"
    },
    {
        id: "53",
        nom: "António MELÍCIO",
        congregation: "À définir",
        talkHistory: [],
        telephone: "31610337402",
        gender: "male"
    },
    {
        id: "54",
        nom: "Patrick SOUSA",
        congregation: "À définir",
        talkHistory: [],
        telephone: "31640081710",
        gender: "male"
    },
    {
        id: "55",
        nom: "Franck BHAGOOA",
        congregation: "À définir",
        talkHistory: [],
        telephone: "33782551793",
        gender: "male"
    },
    {
        id: "56",
        nom: "Van'dredi DOMINGOS",
        congregation: "À définir",
        talkHistory: [],
        telephone: "33769111390",
        gender: "male"
    },
    {
        id: "62",
        nom: "STREAM",
        congregation: "À définir",
        talkHistory: [
            {
                date: "2025-09-13",
                talkNo: "43",
                theme: "Kel ki Deus ta fla sénpri é midjór pa nos"
            },
            {
                date: "2025-10-11",
                talkNo: "5",
                theme: "Kuzê ki ta djuda bu família ser filís?"
            }
        ],
        telephone: ""
    },
    {
        id: "63",
        nom: "Rémy CAPELA",
        congregation: "À définir",
        talkHistory: [
            {
                date: "2023-12-18",
                talkNo: "26",
                theme: "Abo é inportanti pa Deus?"
            }
        ],
        telephone: ""
    },
    {
        id: "64",
        nom: "JP BAPTISTA",
        congregation: "À définir",
        talkHistory: [
            {
                date: "2026-05-09",
                talkNo: "61",
                theme: "Na promésas di kenha ki bu ta kunfia?"
            }
        ],
        telephone: ""
    },
    {
        id: "65",
        nom: "Octávio PEREIRA",
        congregation: "À définir",
        talkHistory: [
            {
                date: "2026-04-25",
                talkNo: "186",
                theme: "Faze vontadi di Deus djuntu ku se povu filís"
            }
        ],
        telephone: ""
    }

];

// Filter out special events from the raw speaker data
const regularSpeakersWithTalksRaw = speakersWithTalksRaw.filter(s => !s.id.startsWith('event-'));

// Extract special events to a new structure
export const initialSpecialDates: SpecialDate[] = speakersWithTalksRaw
    .filter(s => s.id.startsWith('event-'))
    .map(event => {
        const talk = event.talkHistory[0];
        let type: SpecialDateType = 'other';
        const nameLower = event.nom.toLowerCase();

        if (nameLower.includes('superintendente') || nameLower.includes('surveillant')) {
            type = 'co_visit';
        } else if (nameLower.includes('assembleia') || nameLower.includes('assemblée')) {
            type = 'assembly';
        } else if (nameLower.includes('diskursu spesial') || nameLower.includes('discours spécial')) {
            type = 'special_talk';
        }

        return {
            id: event.id,
            date: talk.date,
            name: event.nom,
            type: type,
            description: talk.theme ?? undefined,
        };
    });


// Generate initialSpeakers with only past talks in history, from regular speakers
export const initialSpeakers: Speaker[] = regularSpeakersWithTalksRaw.map(s => ({
    id: s.id || generateUUID(),
    nom: s.nom,
    congregation: s.congregation,
    // Keep only talks from before 2025 as "history"
    talkHistory: (s.talkHistory || []).filter(talk => new Date(talk.date).getFullYear() < 2025),
    telephone: s.telephone,
    notes: s.notes,
    photoUrl: s.photoUrl,
    gender: s.gender || 'male',
    tags: s.tags || [],
    isVehiculed: s.isVehiculed,
})).sort((a,b) => a.nom.localeCompare(b.nom));

// Generate initialVisits from future talks in the regular speakers raw data
export const initialVisits: Visit[] = regularSpeakersWithTalksRaw
    .flatMap(speaker => 
        (speaker.talkHistory || [])
            // Filter for talks in 2025 or later to create Visit objects
            .filter(talk => new Date(talk.date).getFullYear() >= 2025)
            .map((talk): Visit => {
                const cong = speaker.congregation.toLowerCase();
                let locationType: 'physical' | 'zoom' | 'streaming' = 'physical';
                if (cong.includes('zoom')) {
                    locationType = 'zoom';
                } else if (cong.includes('streaming')) {
                    locationType = 'streaming';
                }

                return {
                    id: speaker.id,
                    nom: speaker.nom,
                    congregation: speaker.congregation,
                    telephone: speaker.telephone,
                    photoUrl: speaker.photoUrl,
                    visitId: generateUUID(),
                    visitDate: talk.date,
                    visitTime: '14:30', // Default time, can be edited by user
                    host: UNASSIGNED_HOST,
                    accommodation: '',
                    meals: '',
                    status: 'pending',
                    notes: undefined, // Visit-specific notes start empty
                    attachments: [],
                    expenses: [],
                    communicationStatus: {},
                    checklist: [],
                    talkNoOrType: talk.talkNo,
                    talkTheme: talk.theme,
                    locationType: locationType,
                };
            })
    );

// Explicitly cast the array to Host[] before sorting to ensure type safety.
export const initialHosts: Host[] = ([
    { nom: "Jean-Paul Batista", telephone: "", gender: 'male', address: "182 Avenue Felix Faure, 69003", notes: "Logement en centre-ville, idéal pour orateur sans voiture. Pas d'animaux.", unavailabilities: [], tags: ["centre-ville", "sans-animaux"] },
    { nom: "Suzy", telephone: "", gender: 'female', address: "14 bis Montée des Roches, 69009", unavailabilities: [], tags: ["calme"] },
    { nom: "Alexis", telephone: "", gender: 'male', address: "13 Avenue Debrousse, 69005", unavailabilities: [] },
    { nom: "Andréa", telephone: "", gender: 'female', address: "25c Rue Georges Courteline, Villeurbanne", unavailabilities: [] },
    { nom: "Dara & Lia", telephone: "", gender: 'couple', address: "16 Rue Imbert Colomes, 69001", unavailabilities: [], tags: ["proche salle", "escaliers"] },
    { nom: "José Freitas", telephone: "", gender: 'male', address: "27 Av Maréchal Foch, 69110", notes: "Possède un chat. Idéal pour un orateur seul.", unavailabilities: [], tags: ["animaux", "chat"] },
    { nom: "Paulo Martins", telephone: "", gender: 'male', address: "18 Rue des Soeurs Bouviers, 69005", unavailabilities: [], tags: ["escaliers"] },
    { nom: "Fátima", telephone: "", gender: 'female', address: "9 Chemin de la Vire, Caluire", unavailabilities: [] },
    { nom: "Sanches", telephone: "", gender: 'male', address: "132 Av. L'Aqueduc de Beaunant, 69110 Ste Foy", unavailabilities: [], tags: ["sans escaliers"] },
    { nom: "Torres", telephone: "", gender: 'male', address: "15 Cours Rouget de l'Isle, Rillieux", notes: "Famille avec jeunes enfants, très accueillants.", unavailabilities: [], tags: ["enfants"] },
    { nom: "Nathalie", telephone: "", gender: 'female', address: "86 Rue Pierre Delore, 69008", unavailabilities: [] },
    { nom: "Francisco Pinto", telephone: "", gender: 'male', address: "20 Rue Professeur Patel, 69009", unavailabilities: [] }
] as Host[]).sort((a,b) => a.nom.localeCompare(b.nom));

export const messageTemplates: Record<Language, Record<MessageType, Record<MessageRole, string>>> = {
  en: {
    confirmation: {
      speaker: `Hello Brother {speakerName},{firstTimeIntroduction}

We are looking forward to welcoming you for your talk on {visitDate}.

To better prepare for your visit, could you please let us know if you have any special needs?

- Do you need accommodation?
- Do you have any dietary restrictions?
- Do you need transportation from the train station/airport?

Thank you in advance for your response.

Warm regards,

{hospitalityOverseer}
{hospitalityOverseerPhone}`,
      host: `Hello {hostName},

We are pleased to inform you that Brother *{speakerName}* from the {speakerCongregation} congregation will be our guest speaker on *{visitDate}* at *{visitTime}*.

We would like to know if you would be available to host him for this occasion.

Please let us know as soon as possible if you are available.

Thank you for your hospitality.

Best regards,

{hospitalityOverseer}
{hospitalityOverseerPhone}`
    },
    preparation: {
      speaker: `Hello Brother {speakerName},

Just a quick reminder about your upcoming visit to our congregation on *{visitDate}* at *{visitTime}*.

Here are the details we have for your visit:
- Congregation: {congregation}
- Address: {congregationAddress}
- Contact: {hospitalityOverseer} ({hospitalityOverseerPhone})

If you have any questions or need assistance, please don't hesitate to contact us.

Looking forward to meeting you soon!

Warm regards,

{hospitalityOverseer}
{hospitalityOverseerPhone}`,
      host: `Hello {hostName},

This is a friendly reminder that you will be hosting Brother *{speakerName}* on *{visitDate}*.

Here are the details we have:
- Arrival: {arrivalTime}
- Departure: {departureTime}
- Special notes: {specialNotes || 'None'}

If you have any questions or need to make any changes, please let us know.

Thank you for your hospitality!

Best regards,

{hospitalityOverseer}
{hospitalityOverseerPhone}`
    },
    'reminder-7': {
      speaker: `Hello Brother {speakerName},

Just a quick reminder about your visit to our congregation in one week, on *{visitDate}* at *{visitTime}*.

We are looking forward to welcoming you. If you have any questions or needs, please don't hesitate to contact us.

Safe travels if you need to come from far away.

Warm regards,

{hospitalityOverseer}
{hospitalityOverseerPhone}`,
      host: `Hello {hostName},

This is a friendly reminder that you will be hosting Brother *{speakerName}* next week, on *{visitDate}*.

Here are the details we have:
- Arrival: {arrivalTime}
- Departure: {departureTime}
- Special notes: {specialNotes || 'None'}

If you need to make any changes or have any questions, please let us know.

Thank you for your hospitality!

Best regards,

{hospitalityOverseer}
{hospitalityOverseerPhone}`
    },
    'reminder-2': {
      speaker: `Hello Brother {speakerName},

Just a quick reminder about your public talk scheduled for this weekend, on *{visitDate}* at *{visitTime}*.

We are really looking forward to hearing you. Have a safe trip if you need to travel.

Warm regards,

{hospitalityOverseer}
{hospitalityOverseerPhone}`,
      host: `Hello {hostName},

This is a final reminder that you will be hosting Brother *{speakerName}* this weekend, on *{visitDate}*.

Here are the details we have:
- Arrival: {arrivalTime}
- Departure: {departureTime}
- Special notes: {specialNotes || 'None'}

If you need any assistance, please don't hesitate to contact us.

Thank you for your hospitality!

Best regards,

{hospitalityOverseer}
{hospitalityOverseerPhone}`
    },
    thanks: {
      speaker: `Hello Brother {speakerName},

Just a quick note to thank you again for your excellent talk. We were all very encouraged.

We hope you had a good time with us and that your return went well.

We look forward to seeing you again.

Warm regards,

{hospitalityOverseer}
{hospitalityOverseerPhone}`,
      host: `Hello {hostName},

A big thank you for your wonderful hospitality toward Brother *{speakerName}* this weekend. It's thanks to brothers like you that our guest speakers feel so welcome.

Your help was greatly appreciated.

Warm regards,

{hospitalityOverseer}
{hospitalityOverseerPhone}`
    }
  },
  fr: {
    confirmation: {
      speaker: `Bonjour Frère {speakerName},{firstTimeIntroduction}

Nous nous réjouissons de t'accueillir pour ton discours le {visitDate}.

Pour mieux préparer ta visite, pourrais-tu nous indiquer si tu as des besoins particuliers ?

- As-tu besoin d'un hébergement ?
- As-tu des restrictions alimentaires ?
- As-tu besoin d'un transport depuis la gare ou l'aéroport ?

Merci d'avance pour ta réponse.

Cordialement,

{hospitalityOverseer}
{hospitalityOverseerPhone}`,
      host: `Bonjour {hostName},

Nous sommes ravis de vous informer que le Frère *{speakerName}* de la congrégation {speakerCongregation} sera notre orateur invité le *{visitDate}* à *{visitTime}*.

Nous aimerions savoir si vous seriez disponible pour l'héberger pour cette occasion.

Veuillez nous faire savoir dès que possible si vous êtes disponible.

Merci pour votre hospitalité.

Cordialement,

{hospitalityOverseer}
{hospitalityOverseerPhone}`
    },
    preparation: {
      speaker: `Bonjour Frère {speakerName},

Juste un petit rappel concernant votre visite à notre congrégation le *{visitDate}* à *{visitTime}*.

Voici les détails que nous avons pour votre visite :
- Congrégation : {congregation}
- Adresse : {congregationAddress}
- Contact : {hospitalityOverseer} ({hospitalityOverseerPhone})

Si vous avez des questions ou avez besoin d'assistance, n'hésitez pas à nous contacter.

Nous avons hâte de vous rencontrer bientôt !

Cordialement,

{hospitalityOverseer}
{hospitalityOverseerPhone}`,
      host: `Bonjour {hostName},

Ceci est un petit rappel amical concernant l'accueil du Frère *{speakerName}* le *{visitDate}*.

Voici les détails que nous avons :
- Arrivée : {arrivalTime}
- Départ : {departureTime}
- Notes spéciales : {specialNotes || 'Aucune'}

Si vous avez des questions ou devez faire des changements, veuillez nous faire savoir.

Merci pour votre hospitalité !

Cordialement,

{hospitalityOverseer}
{hospitalityOverseerPhone}`
    },
    'reminder-7': {
      speaker: `Bonjour Frère {speakerName},

Juste un petit rappel concernant votre visite à notre congrégation dans une semaine, le *{visitDate}* à *{visitTime}*.

Nous nous réjouissons de vous accueillir. Si vous avez des questions ou des besoins, n'hésitez pas à nous contacter.

Bonne route si vous devez venir de loin.

Cordialement,

{hospitalityOverseer}
{hospitalityOverseerPhone}`,
      host: `Bonjour {hostName},

Ceci est un petit rappel amical concernant l'accueil du Frère *{speakerName}* la semaine prochaine, le *{visitDate}*.

Voici les détails que nous avons :
- Arrivée : {arrivalTime}
- Départ : {departureTime}
- Notes spéciales : {specialNotes || 'Aucune'}

Si vous devez faire des changements ou avez des questions, veuillez nous faire savoir.

Merci pour votre hospitalité !

Cordialement,

{hospitalityOverseer}
{hospitalityOverseerPhone}`
    },
    'reminder-2': {
      speaker: `Bonjour Frère {speakerName},

Juste un petit rappel concernant votre discours public prévu ce week-end, le *{visitDate}* à *{visitTime}*.

Nous sommes vraiment impatients de vous entendre. Bon voyage si vous devez voyager.

Cordialement,

{hospitalityOverseer}
{hospitalityOverseerPhone}`,
      host: `Bonjour {hostName},

Ceci est un dernier rappel concernant l'accueil du Frère *{speakerName}* ce week-end, le *{visitDate}*.

Voici les détails que nous avons :
- Arrivée : {arrivalTime}
- Départ : {departureTime}
- Notes spéciales : {specialNotes || 'Aucune'}

Si vous avez besoin d'assistance, n'hésitez pas à nous contacter.

Merci pour votre hospitalité !

Cordialement,

{hospitalityOverseer}
{hospitalityOverseerPhone}`
    },
    thanks: {
      speaker: `Bonjour Frère {speakerName},

Juste un petit mot pour vous remercier encore chaleureusement pour votre excellent discours. Nous avons tous été très encouragés.

Nous espérons que vous avez passé un bon moment avec nous et que votre retour s'est bien passé.

Nous avons hâte de vous revoir.

Cordialement,

{hospitalityOverseer}
{hospitalityOverseerPhone}`,
      host: `Bonjour {hostName},

Un grand merci pour votre merveilleuse hospitalité envers le Frère *{speakerName}* ce week-end. C'est grâce à des frères comme vous que nos orateurs invités se sentent si bien accueillis.

Votre aide a été très appréciée.

Cordialement,

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

Nu sta kontenti di resebe-u.
Te breve!

{hospitalityOverseer}
{hospitalityOverseerPhone}`,
      host: `Olá, Irmon {hostName},

Pikenu lembreti amigável sobri akolhimentu di Irmon *{speakerName}*, markadu pa li un simana, na dia *{visitDate}* às *{visitTime}*.

Sta tudu dretu di bu ladu?

Obrigadu pa bu ajuda.
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

Sta tudu dretu di bu ladu?

Obrigadu pa tudu.
Ku amor fraternu.

{hospitalityOverseer}
{hospitalityOverseerPhone}`
    },
    thanks: {
      speaker: `Olá, Irmon {speakerName},

Sô un palavrinha pa gradese-u más un bes di korason pa bu eselenti diskursu. Nu fika tudu mutu enkorajadu.

Nu ta spera ma bu pasa un bon momentu na nos meiu i ma bu regresu foi tranquilu.

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
  },
  es: {
    confirmation: {
      speaker: `Hola Hermano {speakerName},{firstTimeIntroduction}

Nos alegra recibirte para tu discurso el {visitDate}.

Para preparar mejor tu visita, ¿podrías indicarnos si tienes alguna necesidad especial?

- ¿Necesitas alojamiento?
- ¿Tienes alguna restricción alimentaria?
- ¿Necesitas transporte desde la estación de tren o aeropuerto?

Gracias de antemano por tu respuesta.

Atentamente,

{hospitalityOverseer}
{hospitalityOverseerPhone}`,
      host: `Hola Hermano {hostName},

Nos complace informarte que el Hermano *{speakerName}* de la congregación {speakerCongregation} será nuestro orador invitado el *{visitDate}* a las *{visitTime}*.

Nos gustaría saber si estarías disponible para hospedarlo para esta ocasión.

Por favor, haznos saber lo antes posible si estás disponible.

Gracias por tu hospitalidad.

Atentamente,

{hospitalityOverseer}
{hospitalityOverseerPhone}`
    },
    preparation: {
      speaker: `Hola Hermano {speakerName},

Solo un recordatorio rápido sobre tu visita a nuestra congregación el *{visitDate}* a las *{visitTime}*.

Aquí están los detalles que tenemos para tu visita:
- Congregación: {congregation}
- Dirección: {congregationAddress}
- Contacto: {hospitalityOverseer} ({hospitalityOverseerPhone})

Si tienes alguna pregunta o necesitas asistencia, no dudes en hacernos saber.

Esperamos verte pronto.

Atentamente,

{hospitalityOverseer}
{hospitalityOverseerPhone}`,
      host: `Hola Hermano {hostName},

Este es un recordatorio amistoso sobre el alojamiento del Hermano *{speakerName}* el *{visitDate}*.

Aquí están los detalles que tenemos:
- Llegada: {arrivalTime}
- Salida: {departureTime}
- Notas especiales: {specialNotes || 'Ninguna'}

Si tienes alguna pregunta o necesitas hacer algún cambio, por favor haznos saber.

Gracias por tu hospitalidad.

Atentamente,

{hospitalityOverseer}
{hospitalityOverseerPhone}`
    },
    'reminder-7': {
      speaker: `Hola Hermano {speakerName},

Solo un recordatorio rápido sobre tu visita a nuestra congregación en una semana, el *{visitDate}* a las *{visitTime}*.

Nos alegra recibirte. Si tienes alguna pregunta o necesidad, no dudes en hacernos saber.

Buen viaje si necesitas venir de lejos.

Atentamente,

{hospitalityOverseer}
{hospitalityOverseerPhone}`,
      host: `Hola Hermano {hostName},

Este es un recordatorio amistoso sobre el alojamiento del Hermano *{speakerName}* la semana próxima, el *{visitDate}*.

Aquí están los detalles que tenemos:
- Llegada: {arrivalTime}
- Salida: {departureTime}
- Notas especiales: {specialNotes || 'Ninguna'}

Si necesitas hacer algún cambio o tienes alguna pregunta, por favor haznos saber.

Gracias por tu hospitalidad.

Atentamente,

{hospitalityOverseer}
{hospitalityOverseerPhone}`
    },
    'reminder-2': {
      speaker: `Hola Hermano {speakerName},

Solo un recordatorio rápido sobre tu discurso público programado para este fin de semana, el *{visitDate}* a las *{visitTime}*.

Realmente esperamos escucharte. Buen viaje si necesitas viajar.

Atentamente,

{hospitalityOverseer}
{hospitalityOverseerPhone}`,
      host: `Hola Hermano {hostName},

Este es un recordatorio final sobre el alojamiento del Hermano *{speakerName}* este fin de semana, el *{visitDate}*.

Aquí están los detalles que tenemos:
- Llegada: {arrivalTime}
- Salida: {departureTime}
- Notas especiales: {specialNotes || 'Ninguna'}

Si necesitas asistencia, no dudes en hacernos saber.

Gracias por tu hospitalidad.

Atentamente,

{hospitalityOverseer}
{hospitalityOverseerPhone}`
    },
    thanks: {
      speaker: `Hola Hermano {speakerName},

Solo una nota rápida para agradecerte de nuevo por tu excelente discurso. Todos fuimos muy animados.

Esperamos que hayas pasado un buen momento con nosotros y que tu regreso haya ido bien.

Esperamos verte de nuevo.

Atentamente,

{hospitalityOverseer}
{hospitalityOverseerPhone}`,
      host: `Hola Hermano {hostName},

Un gran agradecimiento por tu maravillosa hospitalidad hacia el Hermano *{speakerName}* este fin de semana. Es gracias a hermanos como tú que nuestros oradores invitados se sienten tan bien recibidos.

Tu ayuda fue muy apreciada.

Atentamente,

{hospitalityOverseer}
{hospitalityOverseerPhone}`
    }
  }
};


export const hostRequestMessageTemplates: Record<Language, HostRequestTemplate> = {
  en: {
    singular: `Hello brothers and sisters, 

We are delighted to welcome a visiting speaker soon. We are looking for a host family to accommodate them.

Here is the visit we need help with:

{visitList}

If you can help with accommodation, a meal, or both, please reply with what you can offer.

Your hospitality is greatly appreciated!

"Do not forget to show hospitality to strangers, for by so doing some people have shown hospitality to angels without knowing it." (Hebrews 13:2)

{hospitalityOverseer}
{hospitalityOverseerPhone}`,
    plural: `Hello brothers and sisters, 

We are delighted to welcome several visiting speakers soon. We are looking for host families to accommodate them.

Here are the visits we need help with:

{visitList}

If you can help with any of these needs (accommodation, meals, or both), please reply with the speaker's name and what you can offer.

Your hospitality is greatly appreciated!

"Do not forget to show hospitality to strangers, for by so doing some people have shown hospitality to angels without knowing it." (Hebrews 13:2)

{hospitalityOverseer}
{hospitalityOverseerPhone}`
  },
  fr: {
    singular: `Bonjour chers frères et sœurs, 

Nous avons la joie d'accueillir prochainement un orateur visiteur. Nous recherchons une famille hospitalière pour le recevoir.

Voici la visite pour laquelle nous avons besoin de votre aide :

{visitList}

Si vous pouvez aider pour l'hébergement, un repas, ou les deux, merci de répondre en précisant ce que vous pouvez proposer.

Votre hospitalité est grandement appréciée !

« N’oubliez pas l’hospitalité, car grâce à elle certains ont sans le savoir logé des anges. » (Hébreux 13:2)

{hospitalityOverseer}
{hospitalityOverseerPhone}`,
    plural: `Bonjour chers frères et sœurs, ☀️

Nous avons la joie d'accueillir prochainement plusieurs orateurs visiteurs. Nous recherchons des familles hospitalières pour les recevoir.

Voici les visites pour lesquelles nous avons besoin de votre aide :

{visitList}

Si vous pouvez aider pour l'un de ces besoins (hébergement, repas, ou les deux), merci de répondre en précisant le nom de l'orateur et ce que vous pouvez proposer.

Votre hospitalité est grandement appréciée !

« N’oubliez pas l’hospitalité, car grâce à elle certains ont sans le savoir logé des anges. » (Hébreux 13:2)

{hospitalityOverseer}
{hospitalityOverseerPhone}`
  },
  cv: {
      singular: `Olá, keridus irmons i irmãs, ☀️

Nu ten alegria di resebe un orador vizitanti na futuru prósimu. Nu sta buska un família ospitalera pa resebe-l.

Es li é a vizita ki nu mesti di nhos ajuda pa akolhimentu:

{visitList}

Si nhos pode djuda ku alojamentu, un kumida, ô es dôs, favor responde ku kuzê ki nhos pode oferese.

Nhos ospitalidadi é mutu apresiadu!

« Ka nhos skese di ospitalidadi, pamodi é grasas a el ki alguns resebe anjus na ses kaza sen es sabe. » (Ebreus 13:2)

{hospitalityOverseer}
{hospitalityOverseerPhone}`,
      plural: `Olá, keridus irmons i irmãs, ☀️

Nu ten alegria di resebe alguns oradoris vizitanti na futuru prósimu. Nu sta buska famílias ospitaleras pa resebe-s.

Es li é kes vizita ki nu mesti di nhos ajuda pa akolhimentu:

{visitList}

Si nhos pode djuda ku un di kes nesesidadi li (alojamentu, kumida, ô es dôs), favor responde ku nómi di orador i ku kuzê ki nhos pode oferese.

Nhos ospitalidadi é mutu apresiadu!

« Ka nhos skese di ospitalidadi, pamodi é grasas a el ki alguns resebe anjus na ses kaza sen es sabe. » (Ebreus 13:2)

{hospitalityOverseer}
{hospitalityOverseerPhone}`
  },
  es: {
    singular: `Hola queridos hermanos y hermanas, 

Tenemos la alegría de recibir pronto a un orador visitante. Buscamos una familia hospitalaria para recibirlo.

Aquí está la visita para la cual necesitamos su ayuda:

{visitList}

Si pueden ayudar con alojamiento, una comida, o ambos, por favor respondan especificando lo que pueden ofrecer.

¡Su hospitalidad es muy apreciada!

"No olviden la hospitalidad, porque gracias a ella algunos, sin saberlo, hospedaron ángeles." (Hebreos 13:2)

{hospitalityOverseer}
{hospitalityOverseerPhone}`,
    plural: `Hola queridos hermanos y hermanas, ☀️

Tenemos la alegría de recibir pronto a varios oradores visitantes. Buscamos familias hospitalarias para recibirlos.

Aquí están las visitas para las cuales necesitamos su ayuda:

{visitList}

Si pueden ayudar con alguna de estas necesidades (alojamiento, comidas, o ambas), por favor respondan especificando el nombre del orador y lo que pueden ofrecen.

¡Su hospitalidad es muy apreciada!

"No olviden la hospitalidad, porque gracias a ella algunos, sin saberlo, hospedaron ángeles." (Hebreos 13:2)

{hospitalityOverseer}
{hospitalityOverseerPhone}`
  }
};


export const initialPublicTalks: PublicTalk[] = [
    { number: 1, theme: "Bu konxe Deus dretu?" },
    { number: 2, theme: "Bu ta skapa na ténpu di fin?" },
    { number: 3, theme: "Bu sta ta anda ku organizason unidu di Jeová?" },
    { number: 4, theme: "Ki próvas ten ma Deus ta izisti?" },
    { number: 5, theme: "Kuzê ki ta djuda bu família ser filís?" },
    { number: 6, theme: "Kuzê ki nu pode prende di dilúviu di ténpu di Nué?" },
    { number: 7, theme: "Imita mizerikórdia di Jeová" },
    { number: 8, theme: "Vive pa faze vontadi di Deus" },
    { number: 9, theme: "Obi i kunpri Palavra di Deus" },
    { number: 10, theme: "Ser onéstu na tudu kuza ki bu ta fla i ki bu ta faze" },
    { number: 11, theme: "Sima Jizus, nu 'ka ta faze párti di mundu'" },
    { number: 12, theme: "Deus krê pa bu ruspeta kes ki ten autoridadi" },
    { number: 13, theme: "Kuzê ki Deus ta pensa sobri séksu i kazamentu" },
    { number: 14, theme: "Pamodi ki povu di Deus debe ser linpu?" },
    { number: 15, theme: "Mostra bondadi pa tudu algen" },
    { number: 16, theme: "Kontinua ta bira bu amizadi ku Deus más fórti" },
    { number: 17, theme: "Da Deus glória ku tudu kel ki bu ten" },
    { number: 18, theme: "Faze Jeová bu fortaléza" },
    { number: 19, theme: "Modi ki bu pode sabe bu futuru?" },
    { number: 20, theme: "Dja txiga ténpu di Deus governa mundu?" },
    { number: 21, theme: "Da valor pa bu lugar na Reinu di Deus" },
    { number: 22, theme: "Bu sta pruveta dretu kes kuza ki Jeová ta da-u?" },
    { number: 23, theme: "Pamodi ki Deus faze-nu?" },
    { number: 24, theme: "Dja bu atxa un 'jóia di txeu valor'?" },
    { number: 25, theme: "Luta kóntra spritu di mundu!" },
    { number: 26, theme: "Abo é inportanti pa Deus?" },
    { number: 27, theme: "Modi ki bu pode kumesa bu kazamentu dretu" },
    { number: 28, theme: "Mostra amor i ruspetu na bu kazamentu" },
    { number: 29, theme: "Responsabilidadis i bensons pa pai ku mai" },
    { number: 30, theme: "Modi ki família pode pâpia ku kunpanheru midjór" },
    { number: 31, theme: "Bu ten konsénsia ma bu ten nisisidadi spritual?" },
    { number: 32, theme: "Modi ki nu pode lida ku preokupasons di vida" },
    { number: 33, theme: "Algun dia nu ta ben ten justisa di verdadi?" },
    { number: 34, theme: "Bu ta ser markadu pa salvason?" },
    { number: 35, theme: "Bu ta kridita ma bu pode ben vive pa tudu ténpu?" },
    { number: 36, theme: "Vida é sô kel-li?" },
    { number: 37, theme: "Bale péna sigi kaminhus di Deus?" },
    { number: 38, theme: "Modi ki bu pode salva óras ki es mundu ben distruídu?" },
    { number: 39, theme: "Modi i na ki ténpu ki Jizus ta ben vense mundu?" },
    { number: 40, theme: "Kuzê ki sta ben kontise na futuru?" },
    { number: 41, theme: "'Fika paradu i odja salvason ki ta ben di Jeová'" },
    { number: 42, theme: "Amor ta vense ódiu" },
    { number: 43, theme: "Kel ki Deus ta fla sénpri é midjór pa nos" },
    { number: 44, theme: "Modi ki kuzas ki Jizus inxina ta djuda-nu?" },
    { number: 45, theme: "Sigi kaminhu di vida" },
    { number: 46, theme: "Nu mante nos kunfiansa firmi ti fin" },
    { number: 47, theme: "(Pa ka uza)" },
    { number: 48, theme: "Modi ki nu pode kontinua lial pa Deus óras ki nu ta pasa pa próva" },
    { number: 49, theme: "Algun dia Téra ta ben fika linpu?" },
    { number: 50, theme: "Modi ki nu pode toma disizons ki ta djuda-nu ten bons rezultadu na vida" },
    { number: 51, theme: "Verdadi sta ta muda bu vida?" },
    { number: 52, theme: "Kenha ki é bu Deus?" },
    { number: 53, theme: "Bu ta pensa sima Deus?" },
    { number: 54, theme: "Bira bu fé na Deus i na se promésas más fórti" },
    { number: 55, theme: "Modi ki bu pode faze un bon nómi ki ta agrada Deus?" },
    { number: 56, theme: "Na ki líder ki bu pode kunfia?" },
    { number: 57, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 58, theme: "Ken ki é kristons verdaderu?" },
    { number: 59, theme: "(Pa ka uza)" },
    { number: 60, theme: "Kal ki é bu obijetivu na vida?" },
    { number: 61, theme: "Na promésas di kenha ki bu ta kunfia?" },
    { number: 62, theme: "Na undi ki nu pode atxa un speransa sértu?" },
    { number: 63, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 64, theme: "Bu 'krê sô pasa sábi' ô bu ta 'ama Deus'?" },
    { number: 65, theme: "Modi ki nu pode luta pa pas na un mundu xeiu di ódiu" },
    { number: 66, theme: "Bu ta ben partisipa na kodjéta?" },
    { number: 67, theme: "Midita na Bíblia i na kuzas ki Jeová kria" },
    { number: 68, theme: "'Nhos kontinua ta púrdua kunpanheru di korason'" },
    { number: 69, theme: "Pamodi ki nu debe faze sakrifisiu pa otus ku amor?" },
    { number: 70, theme: "Pamodi ki Deus merese nos kunfiansa?" },
    { number: 71, theme: "Modi i pamodi ki nu debe 'mante sienti'?" },
    { number: 72, theme: "Amor ta mostra ken ki é sigidoris di Jizus di verdadi" },
    { number: 73, theme: "Sforsa pa 'ten un korason ki ten sabedoria'" },
    { number: 74, theme: "Jeová ta odja kuzê ki nu ta faze" },
    { number: 75, theme: "Mostra na bu vida ma bu ta apoia direitu ki Jeová ten di governa" },
    { number: 76, theme: "Prinsípius di Bíblia pode djuda-nu lida ku prublémas di oji?" },
    { number: 77, theme: "'Nhos mostra sénpri ma nhos sabe resebe algen dretu'" },
    { number: 78, theme: "Sirbi Jeová ku alegria" },
    { number: 79, theme: "Amizadi di kenha ki bu ta skodje?" },
    { number: 80, theme: "Bu speransa sta na siênsia ô na Bíblia?" },
    { number: 81, theme: "Ken ki sta kualifikadu pa faze disiplus?" },
    { number: 82, theme: "(Pa ka uza)" },
    { number: 83, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 84, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 85, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 86, theme: "Orasons ki Deus ta obi" },
    { number: 87, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 88, theme: "Pamodi ki nu debe vive di akordu ku prinsípius di Bíblia?" },
    { number: 89, theme: "Nhos ben, nhos ki tene sedi di verdadi!" },
    { number: 90, theme: "Faze tudu ki bu pode pa bu ten kel vida di verdadi" },
    { number: 91, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 92, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 93, theme: "Ki ténpu ki dizastris na naturéza ta ben kaba?" },
    { number: 94, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 95, theme: "Ka bu dexa fitisaria ô bruxaria ingana-u!" },
    { number: 96, theme: "Kuzê ki ta ben kontise ku relijion?" },
    { number: 97, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 98, theme: "'Séna di es mundu sta ta muda'" },
    { number: 99, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 100, theme: "Modi ki nu pode faze bons amizadi" },
    { number: 101, theme: "Jeová é kel 'Grandiozu Kriador'" },
    { number: 102, theme: "Presta atenson na \"profesia\"" },
    { number: 103, theme: "Modi ki bu pode xinti alegria di verdadi?" },
    { number: 104, theme: "Pai ku mai — Nhos sta ta konstrui ku material ki ka ta kema?" },
    { number: 105, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 106, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 107, theme: "Ten un konsénsia trenadu sta ta djuda-u?" },
    { number: 108, theme: "Bu pode kunfia ma nu ta ben ten un futuru sábi!" },
    { number: 109, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 110, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 111, theme: "Modi ki pesoas ta ben kuradu?" },
    { number: 112, theme: "(Pa ka uza)" },
    { number: 113, theme: "Modi ki jóvens pode ten bon rezultadu na vida i ser filís?" },
    { number: 114, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 115, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 116, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 117, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 118, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 119, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 120, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 121, theme: "Un família di irmons na mundu interu ta ben salva" },
    { number: 122, theme: "(Pa ka uza)" },
    { number: 123, theme: "(Pa ka uza)" },
    { number: 124, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 125, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 126, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 127, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 128, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 129, theme: "Trindadi é un ensinu di Bíblia?" },
    { number: 130, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 131, theme: "(Pa ka uza)" },
    { number: 132, theme: "Resureison ta ben vense mórti!" },
    { number: 133, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 134, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 135, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 136, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 137, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 138, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 139, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 140, theme: "Ken ki é Jizus Kristu?" },
    { number: 141, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 142, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 143, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 144, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 145, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 146, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 147, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 148, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 149, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 150, theme: "Es mundu sta kondenadu pa distruison?" },
    { number: 151, theme: "Jeová é 'un proteson suguru' pa se povu" },
    { number: 152, theme: "Ki ténpu ki Armajedon ta ben i pamodi?" },
    { number: 153, theme: "Vive ku xintidu na 'terível dia di Jeová'!" },
    { number: 154, theme: "Govérnu di ómi dja pezadu na balansa" },
    { number: 155, theme: "Dja txiga óra di Babilónia julgadu?" },
    { number: 156, theme: "(Ka sta disponível na Kabuverdianu)" },
    { number: 157, theme: "Modi ki kristons verdaderu ta faze ensinu di Jeová fika más bunitu" },
    { number: 158, theme: "Mostra koraji i kunfia na Jeová" },
    { number: 159, theme: "Modi ki nu ta atxa suguransa na es mundu prigozu" },
    { number: 160, theme: "Nu lenbra sénpri ma nos é kriston" },
    { number: 161, theme: "Pamodi ki Jizus sufri i el móre?" },
    { number: 162, theme: "Sai di es mundu ki sta sen lus di verdadi di Deus" },
    { number: 163, theme: "Pamodi ki nu debe ten grandi ruspetu pa Deus verdaderu?" },
    { number: 164, theme: "Deus ti inda sta ta kontrola asuntus ki ten aver ku Téra?" },
    { number: 165, theme: "Orientason di kenha ki bu ta sigi?" },
    { number: 166, theme: "Modi ki bu pode odja pa futuru ku fé i koraji?" },
    { number: 167, theme: "Nu konporta ku juís na un mundu sen juís" },
    { number: 168, theme: "Bu pode xinti suguru na es mundu xeiu di prubléma!" },
    { number: 169, theme: "Pamodi ki nu debe dexa Bíblia gia-nu?" },
    { number: 170, theme: "Ken ki sta priparadu pa governa Téra?" },
    { number: 171, theme: "Bu pode vive na pas gósi i pa tudu ténpu?" },
    { number: 172, theme: "Kuzê ki Deus ta pensa di bo?" },
    { number: 173, theme: "Pa Deus – Ten sô un relijion verdaderu?" },
    { number: 174, theme: "Mundu novu di Deus – Ken ki sta priparadu pa ba vive la?" },
    { number: 175, theme: "Kuzê ki ta mostra ma kel ki sta na Bíblia é verdadi?" },
    { number: 176, theme: "Ki ténpu ki nu ta ben vive sen medu i ku pas di verdadi?" },
    { number: 177, theme: "Undi nu ta atxa ajuda óras ki nu sta frontadu?" },
    { number: 178, theme: "Ser un algen lial ku Deus" },
    { number: 179, theme: "Nega iluzon di mundu, sforsa pa kes kuza di Reinu ki ta izisti di verdadi" },
    { number: 180, theme: "Pamodi ki resureison debe ser un speransa sértu pa bo?" },
    { number: 181, theme: "Fin ta ben más sédu di ki kel ki bu ta spera?" },
    { number: 182, theme: "Kuzê ki Reinu di Deus sta ta faze pa nos gósi?" },
    { number: 183, theme: "Tra odju di kuzas ki ka ten valor!" },
    { number: 184, theme: "Óras ki algen móre tudu dja kaba?" },
    { number: 185, theme: "Verdadi sta ta djuda-u ten un vida midjór?" },
    { number: 186, theme: "Faze vontadi di Deus djuntu ku se povu filís" },
    { number: 187, theme: "Pamodi ki un Deus di amor ta dexa sufrimentu kontise?" },
    { number: 188, theme: "Bu ta kunfia na Jeová?" },
    { number: 189, theme: "Anda ku Deus ta traze-nu bensons gósi i pa tudu ténpu" },
    { number: 190, theme: "Modi ki ta ben kunpri kel promésa di filisidadi perfeitu na família" },
    { number: 191, theme: "Modi ki amor i fé ta vense mundu?" },
    { number: 192, theme: "Bu sta ta anda na kaminhu pa vida itérnu?" },
    { number: 193, theme: "Prublémas di oji ka ta ben ten más" },
    { number: 194, theme: "Modi ki sabedoria di Deus ta djuda-nu" },

];