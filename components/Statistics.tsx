import React, { useMemo, useState } from 'react';
import { 
    ChartBarIcon, 
    ReceiptIcon, 
    UserIcon, 
    HomeIcon,
    SparklesIcon
} from './Icons';
import { GoogleGenAI } from '@google/genai';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';

// Types
interface DataPoint {
    label: string;
    value: number;
}

// Spinner Component
const SpinnerIcon = ({ className }: { className?: string }) => (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

// StatCard Component
const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    children?: React.ReactNode;
}> = ({ title, value, icon: Icon, children }) => (
    <div className="bg-card-light dark:bg-card-dark p-1 rounded-lg shadow-soft-lg">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
                <Icon className="w-3 h-3 text-secondary" />
                <span className="text-xs font-semibold text-text-main dark:text-text-main-dark">{title}</span>
            </div>
        </div>
        <div className="mt-0.5">
            <div className="text-sm font-bold text-text-main dark:text-text-main-dark">{value}</div>
            {children}
        </div>
    </div>
);

// HorizontalBarChart Component
const HorizontalBarChart: React.FC<{
    data: DataPoint[];
    title: string;
    isCurrency?: boolean;
}> = ({ data, title, isCurrency = false }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    
    return (
        <div className="bg-card-light dark:bg-card-dark p-1 rounded-lg shadow-soft-lg">
            <h3 className="text-xs font-bold mb-0.5">{title}</h3>
            <div className="space-y-0.25">
                {data.slice(0, 3).map((item) => (
                    <div key={item.label} className="flex items-center gap-1">
                        <span className="text-xs truncate flex-1">{item.label}</span>
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1 relative">
                            <div 
                                className="bg-primary dark:bg-primary-light h-1 rounded-full" 
                                style={{ width: `${(item.value / maxValue) * 100}%` }}
                            ></div>
                        </div>
                        <span className="text-xs font-bold w-10 text-right">
                            {isCurrency ? `${item.value.toFixed(0)}€` : item.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// RenderAnalysis Component
const RenderAnalysis: React.FC<{ text: string }> = ({ text }) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    return (
        <div className="prose prose-sm dark:prose-invert max-w-none text-text-main dark:text-text-main-dark">
            {lines.map((line, index) => {
                if (line.startsWith('**') && line.endsWith('**')) {
                    return <h4 key={index} className="font-bold text-xs mt-2 mb-1">{line.replace(/\*\*/g, '')}</h4>;
                }
                if (line.startsWith('- ') || line.startsWith('* ')) {
                    return <p key={index} className="ml-2 flex text-xs"><span className="mr-1 text-secondary">•</span><span>{line.substring(2)}</span></p>;
                }
                return <p key={index} className="text-xs">{line}</p>;
            })}
        </div>
    );
};

export const Statistics: React.FC = () => {
    const { speakers, hosts, upcomingVisits, archivedVisits, apiKey, isOnline } = useData();
    const { addToast } = useToast();
    const allVisits = useMemo(() => [...upcomingVisits, ...archivedVisits], [upcomingVisits, archivedVisits]);
    
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    const generalStats = useMemo(() => {
        const speakerVisitCounts = new Map<string, number>();
        allVisits.forEach(v => {
            speakerVisitCounts.set(v.id, (speakerVisitCounts.get(v.id) || 0) + 1);
        });

        let mostFrequentSpeaker = { id: '', name: 'N/A', count: 0 };
        if (speakerVisitCounts.size > 0) {
            const [topSpeakerId, topCount] = [...speakerVisitCounts.entries()].reduce((a, b) => b[1] > a[1] ? b : a);
            const speaker = speakers.find(s => s.id === topSpeakerId);
            if (speaker) {
                mostFrequentSpeaker = { id: speaker.id, name: speaker.nom, count: topCount };
            }
        }
        
        const hostVisitCounts = new Map<string, number>();
        allVisits.forEach(v => {
            if (v.host && v.host !== 'À définir' && v.host !== 'Pas nécessaire' && v.host !== 'N/A') {
                hostVisitCounts.set(v.host, (hostVisitCounts.get(v.host) || 0) + 1);
            }
        });

        let mostHospitableHost = { name: 'N/A', count: 0 };
        if (hostVisitCounts.size > 0) {
            const [topHostName, topCount] = [...hostVisitCounts.entries()].reduce((a, b) => b[1] > a[1] ? b : a);
            mostHospitableHost = { name: topHostName, count: topCount };
        }
        
        const totalExpenses = allVisits.reduce((sum, visit) => {
            return sum + (visit.expenses || []).reduce((expSum, exp) => expSum + exp.amount, 0);
        }, 0);

        return {
            totalVisits: allVisits.length,
            mostFrequentSpeaker,
            mostHospitableHost,
            totalExpenses,
        };
    }, [allVisits, speakers]);

    const hostParticipationData = useMemo(() => {
        const counts = new Map<string, number>();
        allVisits.forEach(v => {
            if (v.host && v.host !== 'À définir' && v.host !== 'Pas nécessaire' && v.host !== 'N/A') {
                 counts.set(v.host, (counts.get(v.host) || 0) + 1);
            }
        });
        return Array.from(counts.entries())
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [allVisits]);

    const congregationDistributionData = useMemo(() => {
        const speakerVisitCounts = new Map<string, number>();
        allVisits.forEach(v => {
             const speaker = speakers.find(s => s.id === v.id);
             if (speaker) {
                const cong = speaker.congregation || 'Non spécifiée';
                speakerVisitCounts.set(cong, (speakerVisitCounts.get(cong) || 0) + 1);
             }
        });
         return Array.from(speakerVisitCounts.entries())
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [allVisits, speakers]);
    
    const talkPopularityData = useMemo(() => {
        const counts = new Map<string, number>();
        allVisits.forEach(v => {
            if (v.talkTheme) {
                counts.set(v.talkTheme, (counts.get(v.talkTheme) || 0) + 1);
            }
        });
        return Array.from(counts.entries())
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [allVisits]);

    const expenseByCategoryData = useMemo(() => {
        const expensesByCategory = new Map<string, number>();
        allVisits.forEach(v => {
            (v.expenses || []).forEach(e => {
                expensesByCategory.set(e.category, (expensesByCategory.get(e.category) || 0) + e.amount);
            });
        });
        
        return Array.from(expensesByCategory.entries())
            .map(([label, value]) => ({ label: label.charAt(0).toUpperCase() + label.slice(1), value }))
            .sort((a,b) => b.value - a.value);
    }, [allVisits]);

    const handleGenerateAnalysis = async () => {
        if (!isOnline) {
            addToast("Une connexion Internet est requise pour l'analyse IA.", 'info');
            return;
        }
        if (!apiKey) {
            addToast("Veuillez configurer votre clé API dans les Paramètres pour utiliser l'IA.", 'error');
            return;
        }

        setIsGeneratingAnalysis(true);
        setAnalysisError(null);
        setAnalysis(null);

        try {
            const hostDataString = hostParticipationData.map(d => `- ${d.label}: ${d.value} fois`).join('\n');
            const congDataString = congregationDistributionData.map(d => `- ${d.label}: ${d.value} visites`).join('\n');
            const talkDataString = talkPopularityData.map(d => `- "${d.label}": ${d.value} fois`).join('\n');
            const expenseDataString = expenseByCategoryData.map(d => `- ${d.label}: ${d.value.toFixed(2)} €`).join('\n');

            const prompt = `Vous êtes un assistant aidant un responsable d'accueil de Témoins de Jéhovah à analyser des données. Votre ton est encourageant et perspicace. Basé sur les statistiques suivantes, fournissez un résumé concis avec des observations clés et des suggestions pratiques. Formatez votre réponse en français avec des titres en gras (ex: **Observations**) et des listes à puces (ex: - Point 1).

**Résumé des données :**
- Total des visites suivies : ${generalStats.totalVisits}
- Orateur le plus fréquent : ${generalStats.mostFrequentSpeaker.name} (${generalStats.mostFrequentSpeaker.count} fois)
- Famille d'accueil la plus sollicitée : ${generalStats.mostHospitableHost.name} (${generalStats.mostHospitableHost.count} fois)
- Total des frais de visite : ${generalStats.totalExpenses.toFixed(2)} €

**Top 10 Participation des Accueils :**
${hostDataString}

**Top 10 Congrégations des Orateurs :**
${congDataString}

**Top 10 Discours les plus présentés :**
${talkDataString}

**Répartition des frais par catégorie :**
${expenseDataString}

Analysez ces données et fournissez des aperçus actionnables. Par exemple, commentez la diversité des orateurs, la charge sur les familles d'accueil, ou les thèmes populaires et les postes de dépenses.`;
            
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "text/plain",
                }
            });
            
            setAnalysis(response.text || null);

        } catch (error) {
            console.error("Error generating AI analysis:", error);
            const errorMessage = error instanceof Error && error.message.includes("API key") 
                ? "La clé API n'est pas configurée ou est invalide."
                : "Une erreur est survenue lors de la génération de l'analyse.";
            setAnalysisError(errorMessage);
            addToast(errorMessage, 'error');
        } finally {
            setIsGeneratingAnalysis(false);
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden animate-fade-in">
            {/* Ligne 1: KPIs principaux */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-0.5 p-1">
                <StatCard title="Visites" value={generalStats.totalVisits} icon={ChartBarIcon} />
                <StatCard title="Frais" value={`${generalStats.totalExpenses.toFixed(0)} €`} icon={ReceiptIcon} />
                <StatCard title="Orateur top" value={generalStats.mostFrequentSpeaker.name} icon={UserIcon}>
                    <p className="text-xs -mt-1">{generalStats.mostFrequentSpeaker.count}x</p>
                </StatCard>
                <StatCard title="Accueil top" value={generalStats.mostHospitableHost.name} icon={HomeIcon}>
                    <p className="text-xs -mt-1">{generalStats.mostHospitableHost.count}x</p>
                </StatCard>
            </div>

            {/* Ligne 2: Analyse IA + Statistiques avancées */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0.5 p-1 flex-1">
                <div className="bg-card-light dark:bg-card-dark p-1 rounded-lg shadow-soft-lg">
                    <div className="flex items-center gap-0.5 mb-0.5">
                        <SparklesIcon className="w-2 h-2 text-secondary" />
                        <h3 className="text-xs font-bold">Analyse IA</h3>
                    </div>
                    <button onClick={handleGenerateAnalysis} disabled={isGeneratingAnalysis || !apiKey || !isOnline} className="w-full flex items-center justify-center gap-0.5 px-0.5 py-0.5 bg-primary hover:bg-primary-light text-white font-semibold rounded text-xs mb-0.5">
                        {isGeneratingAnalysis ? <SpinnerIcon className="w-2 h-2" /> : <SparklesIcon className="w-2 h-2" />}
                        {isGeneratingAnalysis ? '...' : 'AI'}
                    </button>
                    <div className="min-h-[1rem] text-xs">
                        {isGeneratingAnalysis && <div className="h-1 bg-gray-200 rounded animate-pulse"></div>}
                        {!isGeneratingAnalysis && !analysis && <p className="text-text-muted">Cliquez</p>}
                        {analysis && <p className="truncate">{analysis.substring(0, 25)}...</p>}
                    </div>
                </div>

                <div className="bg-card-light dark:bg-card-dark p-1 rounded-lg shadow-soft-lg">
                    <h3 className="text-xs font-bold mb-0.5">Satisfaction</h3>
                    <div className="text-center">
                        <div className="text-base font-bold text-secondary">{(() => {
                            const feedbacks = allVisits.filter(v => v.feedback);
                            return feedbacks.length > 0 ? (feedbacks.reduce((sum, v) => sum + (v.feedback?.rating || 0), 0) / feedbacks.length).toFixed(1) : 'N/A';
                        })()}/5</div>
                        <div className="text-xs text-text-muted">{allVisits.filter(v => v.feedback).length} avis</div>
                    </div>
                </div>

                <div className="bg-card-light dark:bg-card-dark p-1 rounded-lg shadow-soft-lg">
                    <h3 className="text-xs font-bold mb-0.5">KPIs</h3>
                    <div className="grid grid-cols-2 gap-0.5 text-xs">
                        <div>
                            <span className="text-text-muted">Ratio:</span>
                            <span className="font-bold ml-0.5">{speakers.length > 0 ? (allVisits.length / speakers.length).toFixed(1) : '0'}</span>
                        </div>
                        <div>
                            <span className="text-text-muted">Moy/visite:</span>
                            <span className="font-bold ml-0.5">{allVisits.length > 0 ? (generalStats.totalExpenses / allVisits.length).toFixed(0) : '0'}€</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ligne 3: Top 5 en colonnes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0.5 p-1 flex-1">
                <div className="bg-card-light dark:bg-card-dark p-1 rounded-lg shadow-soft-lg">
                    <h3 className="text-xs font-bold mb-0.5">Top Accueils</h3>
                    <div className="space-y-0.25 text-xs">
                        {hostParticipationData.slice(0, 3).map((item) => (
                            <div key={item.label} className="flex justify-between">
                                <span className="truncate">{item.label}</span>
                                <span className="font-bold">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-card-light dark:bg-card-dark p-1 rounded-lg shadow-soft-lg">
                    <h3 className="text-xs font-bold mb-0.5">Top Congrégations</h3>
                    <div className="space-y-0.25 text-xs">
                        {congregationDistributionData.slice(0, 3).map((item) => (
                            <div key={item.label} className="flex justify-between">
                                <span className="truncate">{item.label}</span>
                                <span className="font-bold">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-card-light dark:bg-card-dark p-1 rounded-lg shadow-soft-lg">
                    <h3 className="text-xs font-bold mb-0.5">Top Discours</h3>
                    <div className="space-y-0.25 text-xs">
                        {talkPopularityData.slice(0, 3).map((item) => (
                            <div key={item.label} className="flex justify-between">
                                <span className="truncate">{item.label}</span>
                                <span className="font-bold">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Ligne 4: Répartitions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-0.5 p-1 flex-1">
                <div className="bg-card-light dark:bg-card-dark p-1 rounded-lg shadow-soft-lg">
                    <h3 className="text-xs font-bold mb-0.5">Statut</h3>
                    <div className="text-xs space-y-0.25">
                        <div className="flex justify-between">
                            <span>✓ Confirmé</span>
                            <span className="font-bold">{allVisits.filter(v => v.status === 'confirmed').length}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>⏳ En attente</span>
                            <span className="font-bold">{allVisits.filter(v => v.status === 'pending').length}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>✅ Complété</span>
                            <span className="font-bold">{allVisits.filter(v => v.status === 'completed').length}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-card-light dark:bg-card-dark p-1 rounded-lg shadow-soft-lg">
                    <h3 className="text-xs font-bold mb-0.5">Location</h3>
                    <div className="text-xs space-y-0.25">
                        <div className="flex justify-between">
                            <span>🏠 Physique</span>
                            <span className="font-bold">{allVisits.filter(v => v.locationType === 'physical').length}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>💻 Zoom</span>
                            <span className="font-bold">{allVisits.filter(v => v.locationType === 'zoom').length}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>📺 Streaming</span>
                            <span className="font-bold">{allVisits.filter(v => v.locationType === 'streaming').length}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-card-light dark:bg-card-dark p-1 rounded-lg shadow-soft-lg">
                    <h3 className="text-xs font-bold mb-0.5">Orateurs</h3>
                    <div className="text-xs space-y-0.25">
                        <div className="flex justify-between">
                            <span>👨 Hommes</span>
                            <span className="font-bold">{speakers.filter(s => s.gender === 'male').length}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>👩 Femmes</span>
                            <span className="font-bold">{speakers.filter(s => s.gender === 'female').length}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>🚗 Véhiculés</span>
                            <span className="font-bold">{speakers.filter(s => s.isVehiculed).length}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-card-light dark:bg-card-dark p-1 rounded-lg shadow-soft-lg">
                    <h3 className="text-xs font-bold mb-0.5">Tags Orateurs</h3>
                    <div className="text-xs space-y-0.25">
                        {(() => {
                            const speakerTags = new Map<string, number>();
                            speakers.forEach(speaker => {
                                (speaker.tags || []).forEach(tag => {
                                    speakerTags.set(tag, (speakerTags.get(tag) || 0) + 1);
                                });
                            });
                            return Array.from(speakerTags.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);
                        })().map(([tag, count]) => (
                            <div key={tag} className="flex justify-between">
                                <span className="truncate">{tag}</span>
                                <span className="font-bold">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Ligne 5: Graphiques compactes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0.5 p-1 flex-1">
                <HorizontalBarChart data={expenseByCategoryData} title="Frais par Catégorie" isCurrency={true} />
                <div className="bg-card-light dark:bg-card-dark p-1 rounded-lg shadow-soft-lg">
                    <h3 className="text-xs font-bold mb-0.5">Tendance 6 mois</h3>
                    <div className="h-16 flex items-end justify-between text-xs">
                        {(() => {
                            const monthlyTrend = new Map<string, number>();
                            const now = new Date();
                            for (let i = 5; i >= 0; i--) {
                                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                                const key = `${date.getFullYear()}-${date.getMonth()}`;
                                monthlyTrend.set(key, 0);
                            }
                            
                            allVisits.forEach(v => {
                                const visitDate = new Date(v.visitDate + 'T00:00:00');
                                const key = `${visitDate.getFullYear()}-${visitDate.getMonth()}`;
                                if (monthlyTrend.has(key)) {
                                    monthlyTrend.set(key, (monthlyTrend.get(key) || 0) + 1);
                                }
                            });

                            const maxCount = Math.max(...Array.from(monthlyTrend.values()), 1);
                            return Array.from(monthlyTrend.entries()).map(([key, count], index) => {
                                const height = (count / maxCount) * 100;
                                return (
                                    <div key={key} className="flex-1 flex flex-col items-center">
                                        <div className="w-full bg-primary rounded-t" style={{ height: `${height}%` }}></div>
                                        <span className="text-xs mt-0.25">{new Date(key + '-01').toLocaleDateString('fr-FR', { month: 'short' })}</span>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>
                <div className="bg-card-light dark:bg-card-dark p-1 rounded-lg shadow-soft-lg">
                    <h3 className="text-xs font-bold mb-0.5">Feedback Tags</h3>
                    <div className="text-xs space-y-0.25">
                        {(() => {
                            const feedbacks = allVisits.filter(v => v.feedback);
                            const feedbackTags = new Map<string, number>();
                            feedbacks.forEach(v => {
                                (v.feedback?.tags || []).forEach(tag => {
                                    feedbackTags.set(tag, (feedbackTags.get(tag) || 0) + 1);
                                });
                            });
                            return Array.from(feedbackTags.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4);
                        })().map(([tag, count]) => (
                            <div key={tag} className="flex justify-between">
                                <span className="truncate">{tag}</span>
                                <span className="font-bold">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
};
