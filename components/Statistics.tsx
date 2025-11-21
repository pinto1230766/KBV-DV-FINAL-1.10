import React, { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { ChartBarIcon, UserIcon, HomeIcon, SparklesIcon, SpinnerIcon, ExclamationTriangleIcon, ReceiptIcon } from './Icons';
import { GoogleGenAI } from '@google/genai';
import { useToast } from '../contexts/ToastContext';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.FC<any>; children?: React.ReactNode }> = ({ title, value, icon: Icon, children }) => (
    <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-soft-lg">
        <div className="flex items-center gap-4">
            <Icon className="w-8 h-8 text-secondary" />
            <div>
                <p className="text-sm font-semibold text-text-muted dark:text-text-muted-dark">{title}</p>
                <p className="text-2xl font-bold text-text-main dark:text-text-main-dark">{value}</p>
            </div>
        </div>
        {children && <div className="mt-4">{children}</div>}
    </div>
);

const HorizontalBarChart: React.FC<{ data: { label: string; value: number }[], title: string, isCurrency?: boolean }> = ({ data, title, isCurrency = false }) => {
    const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 0), [data]);
    
    return (
        <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-soft-lg">
            <h3 className="text-lg font-bold text-text-main dark:text-text-main-dark mb-4">{title}</h3>
            <div className="space-y-3">
                {data.map(({ label, value }) => (
                    <div key={label} className="grid grid-cols-4 gap-2 items-center">
                        <span className="text-sm font-medium text-text-muted dark:text-text-muted-dark truncate col-span-1" title={label}>{label}</span>
                        <div className="col-span-3 flex items-center gap-2">
                             <div className="w-full bg-gray-200 dark:bg-primary-light/20 rounded-full h-4">
                                <div
                                    className="bg-secondary rounded-full h-4"
                                    style={{ width: `${maxValue > 0 ? (value / maxValue) * 100 : 0}%` }}
                                ></div>
                            </div>
                            <span className="font-bold text-sm w-16 text-right">{isCurrency ? `${value.toFixed(2)} €` : value}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const VisitsOverTimeChart: React.FC<{ visits: any[] }> = ({ visits }) => {
    const chartData = useMemo(() => {
        const now = new Date();
        const monthLabels: { month: string; year: number; key: string }[] = [];
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            monthLabels.push({
                month: date.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', ''),
                year: date.getFullYear(),
                key: `${date.getFullYear()}-${date.getMonth()}`
            });
        }

        const counts = new Map<string, number>();
        visits.forEach(v => {
            const visitDate = new Date(v.visitDate + 'T00:00:00');
            const key = `${visitDate.getFullYear()}-${visitDate.getMonth()}`;
            counts.set(key, (counts.get(key) || 0) + 1);
        });
        
        const dataPoints = monthLabels.map(label => ({
            month: label.month,
            count: counts.get(label.key) || 0
        }));

        const maxCount = Math.max(...dataPoints.map(d => d.count), 5);

        return { dataPoints, maxCount };
    }, [visits]);

    const { dataPoints, maxCount } = chartData;

    return (
        <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-soft-lg h-80 flex flex-col">
             <h3 className="text-lg font-bold text-text-main dark:text-text-main-dark mb-4 flex-shrink-0">Visites par mois (12 derniers mois)</h3>
            <div className="w-full flex-grow flex items-end">
                <svg width="100%" height="90%" className="text-xs">
                    <g className="chart-grid">
                        {[...Array(5)].map((_, i) => {
                            const y = (i / 4) * 100;
                            const value = Math.round(maxCount - (i * maxCount / 4));
                            return (
                                <g key={i}>
                                    <line x1="25" x2="100%" y1={`${y}%`} y2={`${y}%`} className="stroke-current text-gray-200 dark:text-gray-700" strokeWidth="1" />
                                    <text x="0" y={`${y}%`} dy="4" className="fill-current text-text-muted dark:text-text-muted-dark">{value}</text>
                                </g>
                            )
                        })}
                    </g>
                    <svg x="30" width="calc(100% - 30px)" height="100%" className="chart-bars" overflow="visible">
                        {dataPoints.map((data, i) => {
                            const barHeight = data.count > 0 ? (data.count / maxCount) * 100 : 0;
                            const barWidth = 100 / (dataPoints.length * 2);
                            const x = i * (100 / dataPoints.length) + (barWidth / 2);

                            return (
                                <g key={data.month + i}>
                                    <rect 
                                        x={`${x}%`} 
                                        y={`${100 - barHeight}%`} 
                                        width={`${barWidth}%`} 
                                        height={`${barHeight}%`} 
                                        className="fill-current text-primary dark:text-primary-light" 
                                        rx="2"
                                    >
                                        <title>{`${data.month}: ${data.count} visite(s)`}</title>
                                    </rect>
                                    <text x={`${x + barWidth / 2}%`} y="105%" textAnchor="middle" className="fill-current text-text-muted dark:text-text-muted-dark font-semibold capitalize">{data.month}</text>
                                </g>
                            )
                        })}
                    </svg>
                </svg>
            </div>
        </div>
    );
};

const RenderAnalysis: React.FC<{ text: string }> = ({ text }) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    return (
        <div className="prose prose-sm dark:prose-invert max-w-none text-text-main dark:text-text-main-dark">
            {lines.map((line, index) => {
                if (line.startsWith('**') && line.endsWith('**')) {
                    return <h4 key={index} className="font-bold text-base mt-4 mb-2">{line.replace(/\*\*/g, '')}</h4>;
                }
                if (line.startsWith('- ') || line.startsWith('* ')) {
                    return <p key={index} className="ml-4 flex"><span className="mr-2 text-secondary">•</span><span>{line.substring(2)}</span></p>;
                }
                return <p key={index}>{line}</p>;
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
            .slice(0, 10); // Top 10 hosts
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
        <div className="space-y-8 animate-fade-in">
            <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-soft-lg">
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                    <div className="flex items-center gap-4">
                        <SparklesIcon className="w-8 h-8 text-secondary flex-shrink-0" />
                        <div>
                            <h3 className="text-lg font-bold text-text-main dark:text-text-main-dark">Analyse Intelligente</h3>
                            <p className="text-sm text-text-muted dark:text-text-muted-dark">Laissez l'IA vous donner des aperçus sur vos données.</p>
                        </div>
                    </div>
                    <button onClick={handleGenerateAnalysis} disabled={isGeneratingAnalysis || !apiKey || !isOnline} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed" title={!apiKey ? "Veuillez configurer votre clé API" : !isOnline ? "Connexion Internet requise" : ""}>
                        {isGeneratingAnalysis ? <SpinnerIcon className="w-5 h-5" /> : <SparklesIcon className="w-5 h-5" />}
                        {isGeneratingAnalysis ? 'Analyse en cours...' : (analysis ? "Rafraîchir l'analyse" : "Générer l'analyse")}
                    </button>
                </div>
                <div className="mt-4 pt-4 border-t border-border-light dark:border-border-dark min-h-[6rem] flex items-center justify-center">
                    {isGeneratingAnalysis && (
                        <div className="space-y-3 w-full">
                            <div className="h-4 bg-gray-200 dark:bg-primary-light/10 rounded w-3/4 animate-pulse"></div>
                            <div className="h-4 bg-gray-200 dark:bg-primary-light/10 rounded w-1/2 animate-pulse"></div>
                            <div className="h-4 bg-gray-200 dark:bg-primary-light/10 rounded w-5/6 animate-pulse"></div>
                        </div>
                    )}
                    {analysisError && (
                        <div className="text-center text-red-600 dark:text-red-400">
                            <ExclamationTriangleIcon className="w-8 h-8 mx-auto mb-2" />
                            <p className="font-semibold">Erreur d'analyse</p>
                            <p className="text-sm">{analysisError}</p>
                        </div>
                    )}
                    {!isGeneratingAnalysis && !analysisError && analysis && (
                        <RenderAnalysis text={analysis} />
                    )}
                    {!isGeneratingAnalysis && !analysisError && !analysis && (
                        <p className="text-center text-text-muted dark:text-text-muted-dark">Cliquez sur le bouton pour obtenir des observations et suggestions sur vos données.</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total des visites" value={generalStats.totalVisits} icon={ChartBarIcon} />
                <StatCard title="Total des Frais de Visite" value={`${generalStats.totalExpenses.toFixed(2)} €`} icon={ReceiptIcon} />
                <StatCard title="Orateur le plus fréquent" value={generalStats.mostFrequentSpeaker.name} icon={UserIcon}>
                    <p className="text-sm text-text-muted dark:text-text-muted-dark -mt-2">{generalStats.mostFrequentSpeaker.count} visites</p>
                </StatCard>
                 <StatCard title="Accueil le plus sollicité" value={generalStats.mostHospitableHost.name} icon={HomeIcon}>
                    <p className="text-sm text-text-muted dark:text-text-muted-dark -mt-2">{generalStats.mostHospitableHost.count} accueils</p>
                </StatCard>
            </div>
            
            <VisitsOverTimeChart visits={allVisits} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <HorizontalBarChart data={hostParticipationData} title="Top 10 Participation des Accueils" />
                <HorizontalBarChart data={congregationDistributionData} title="Top 10 Congrégations d'Orateurs" />
            </div>
            
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <HorizontalBarChart data={talkPopularityData} title="Top 10 des Discours les Plus Présentés" />
                <HorizontalBarChart data={expenseByCategoryData} title="Répartition des Frais par Catégorie" isCurrency={true} />
            </div>

        </div>
    );
};