'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
    Sparkles, 
    Wand2, 
    Download, 
    ImageIcon, 
    Palette,
    Settings2,
    Loader2,
    CheckCircle2,
    XCircle,
    Upload,
    FileSpreadsheet,
    ArrowRight,
    ArrowLeft,
    FileArchive,
    FileText,
    Trash2,
    Table,
    Eye
} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';

interface CardData {
    id: string;
    name: string;
    description: string;
    promptModifiers: string;
    [key: string]: string;
}

interface StyleConfig {
    artStyle: string;
    colorPalette: string;
    frameStyle: string;
    backgroundStyle: string;
    textStyle: string;
    additionalStyleNotes: string;
}

interface ReferenceImage {
    data: string;
    mimeType: string;
    purpose: 'style' | 'template' | 'character' | 'background';
    preview: string;
    fileName: string;
}

interface GenerationResult {
    cardId: string;
    success: boolean;
    imageData?: string;
    mimeType?: string;
    textResponse?: string;
    error?: string;
}

const PRESET_STYLES = [
    { name: 'Anime/Manga', value: 'Japanese anime style with bold outlines, cel-shading, and vibrant colors' },
    { name: 'Fantasy Illustration', value: 'High fantasy illustration style with rich details, dramatic lighting, and painterly textures' },
    { name: 'Realistic', value: 'Photorealistic digital painting with accurate proportions and lifelike textures' },
    { name: 'Pixel Art', value: 'Retro pixel art style with limited color palette and chunky pixels' },
    { name: 'Watercolor', value: 'Soft watercolor painting style with flowing colors and organic edges' },
    { name: 'Comic Book', value: 'Western comic book style with bold inks, halftone dots, and dynamic poses' },
    { name: 'Art Nouveau', value: 'Elegant Art Nouveau style with flowing organic lines and decorative borders' },
    { name: 'Minimalist', value: 'Clean minimalist design with simple shapes, limited colors, and negative space' },
];

const ASPECT_RATIOS = [
    { label: 'Square (1:1)', value: '1:1' },
    { label: 'Portrait 2:3', value: '2:3' },
    { label: 'Landscape 3:2', value: '3:2' },
    { label: 'Portrait 3:4', value: '3:4' },
    { label: 'Landscape 4:3', value: '4:3' },
    { label: 'Portrait 4:5', value: '4:5' },
    { label: 'Landscape 5:4', value: '5:4' },
    { label: 'Portrait 9:16', value: '9:16' },
    { label: 'Landscape 16:9', value: '16:9' },
    { label: 'Ultrawide 21:9', value: '21:9' },
];

const IMAGE_SIZES = [
    { label: '1K (Standard)', value: '1K' },
    { label: '2K (High)', value: '2K' },
    { label: '4K (Ultra)', value: '4K' },
];

const STEPS = [
    { id: 1, title: 'Style Setup', description: 'Define the visual style' },
    { id: 2, title: 'Card Data', description: 'Import your cards' },
    { id: 3, title: 'Generate', description: 'Create & download' },
];

export default function TradingCardGeneratorClient() {
    const [currentStep, setCurrentStep] = useState(1);
    
    // Step 1: Style Configuration
    const [styleConfig, setStyleConfig] = useState<StyleConfig>({
        artStyle: PRESET_STYLES[0].value,
        colorPalette: '',
        frameStyle: '',
        backgroundStyle: '',
        textStyle: '',
        additionalStyleNotes: '',
    });
    const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
    const [aspectRatio, setAspectRatio] = useState('2:3');
    const [imageSize, setImageSize] = useState('2K');

    // Step 2: Card Data
    const [cards, setCards] = useState<CardData[]>([]);
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [nameColumn, setNameColumn] = useState('');
    const [descriptionColumn, setDescriptionColumn] = useState('');
    const [modifiersColumn, setModifiersColumn] = useState('');
    const [typeColumn, setTypeColumn] = useState('');
    const [rarityColumn, setRarityColumn] = useState('');
    const [elementColumn, setElementColumn] = useState('');
    const [attackColumn, setAttackColumn] = useState('');
    const [defenseColumn, setDefenseColumn] = useState('');
    const [costColumn, setCostColumn] = useState('');
    // Free custom columns
    const [customColumns, setCustomColumns] = useState<{ column: string; label: string }[]>(
        Array(10).fill(null).map(() => ({ column: '', label: '' }))
    );
    const [importedFileName, setImportedFileName] = useState('');

    // Step 3: Generation
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);
    const [results, setResults] = useState<GenerationResult[]>([]);
    const [isDownloading, setIsDownloading] = useState(false);

    // Step Navigation
    const canProceedToStep2 = styleConfig.artStyle.trim().length > 0;
    const canProceedToStep3 = cards.length > 0;

    const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>, purpose: ReferenceImage['purpose']) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            const base64 = dataUrl.split(',')[1];
            setReferenceImages(prev => [...prev, {
                data: base64,
                mimeType: file.type,
                purpose,
                preview: dataUrl,
                fileName: file.name
            }]);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    }, []);

    const removeReferenceImage = useCallback((index: number) => {
        setReferenceImages(prev => prev.filter((_, i) => i !== index));
    }, []);

    // CSV/Excel Import
    const handleFileImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImportedFileName(file.name);
        const fileExtension = file.name.split('.').pop()?.toLowerCase();

        if (fileExtension === 'csv') {
            Papa.parse(file, {
                header: true,
                complete: (results) => {
                    const data = results.data as Record<string, string>[];
                    if (data.length > 0) {
                        const headers = Object.keys(data[0]);
                        setCsvHeaders(headers);
                        
                        // Auto-detect columns
                        const nameCandidates = headers.filter(h => 
                            h.toLowerCase().includes('name') || h.toLowerCase().includes('title') || h.toLowerCase().includes('card')
                        );
                        const descCandidates = headers.filter(h => 
                            h.toLowerCase().includes('desc') || h.toLowerCase().includes('text') || h.toLowerCase().includes('flavor')
                        );
                        const modCandidates = headers.filter(h => 
                            h.toLowerCase().includes('modifier') || h.toLowerCase().includes('prompt') || h.toLowerCase().includes('style')
                        );
                        const typeCandidates = headers.filter(h => 
                            h.toLowerCase().includes('type') || h.toLowerCase().includes('category') || h.toLowerCase().includes('class')
                        );
                        const rarityCandidates = headers.filter(h => 
                            h.toLowerCase().includes('rarity') || h.toLowerCase().includes('tier') || h.toLowerCase().includes('grade')
                        );
                        const elementCandidates = headers.filter(h => 
                            h.toLowerCase().includes('element') || h.toLowerCase().includes('attribute') || h.toLowerCase().includes('affinity')
                        );
                        const attackCandidates = headers.filter(h => 
                            h.toLowerCase().includes('attack') || h.toLowerCase().includes('power') || h.toLowerCase().includes('atk') || h.toLowerCase().includes('strength')
                        );
                        const defenseCandidates = headers.filter(h => 
                            h.toLowerCase().includes('defense') || h.toLowerCase().includes('health') || h.toLowerCase().includes('def') || h.toLowerCase().includes('hp')
                        );
                        const costCandidates = headers.filter(h => 
                            h.toLowerCase().includes('cost') || h.toLowerCase().includes('mana') || h.toLowerCase().includes('energy') || h.toLowerCase().includes('cp')
                        );

                        if (nameCandidates.length > 0) setNameColumn(nameCandidates[0]);
                        if (descCandidates.length > 0) setDescriptionColumn(descCandidates[0]);
                        if (modCandidates.length > 0) setModifiersColumn(modCandidates[0]);
                        if (typeCandidates.length > 0) setTypeColumn(typeCandidates[0]);
                        if (rarityCandidates.length > 0) setRarityColumn(rarityCandidates[0]);
                        if (elementCandidates.length > 0) setElementColumn(elementCandidates[0]);
                        if (attackCandidates.length > 0) setAttackColumn(attackCandidates[0]);
                        if (defenseCandidates.length > 0) setDefenseColumn(defenseCandidates[0]);
                        if (costCandidates.length > 0) setCostColumn(costCandidates[0]);

                        // Convert to CardData format
                        const cardData: CardData[] = data
                            .filter(row => Object.values(row).some(v => v && v.trim()))
                            .map((row, index) => ({
                                id: `card_${index + 1}`,
                                name: '',
                                description: '',
                                promptModifiers: '',
                                ...row
                            }));
                        setCards(cardData);
                    }
                }
            });
        } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            const reader = new FileReader();
            reader.onload = (event) => {
                const data = event.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet) as Record<string, string>[];
                
                if (jsonData.length > 0) {
                    const headers = Object.keys(jsonData[0]);
                    setCsvHeaders(headers);

                    const nameCandidates = headers.filter(h => 
                        h.toLowerCase().includes('name') || h.toLowerCase().includes('title') || h.toLowerCase().includes('card')
                    );
                    const descCandidates = headers.filter(h => 
                        h.toLowerCase().includes('desc') || h.toLowerCase().includes('text') || h.toLowerCase().includes('flavor')
                    );
                    const modCandidates = headers.filter(h => 
                        h.toLowerCase().includes('modifier') || h.toLowerCase().includes('prompt') || h.toLowerCase().includes('style')
                    );
                    const typeCandidates = headers.filter(h => 
                        h.toLowerCase().includes('type') || h.toLowerCase().includes('category') || h.toLowerCase().includes('class')
                    );
                    const rarityCandidates = headers.filter(h => 
                        h.toLowerCase().includes('rarity') || h.toLowerCase().includes('tier') || h.toLowerCase().includes('grade')
                    );
                    const elementCandidates = headers.filter(h => 
                        h.toLowerCase().includes('element') || h.toLowerCase().includes('attribute') || h.toLowerCase().includes('affinity')
                    );
                    const attackCandidates = headers.filter(h => 
                        h.toLowerCase().includes('attack') || h.toLowerCase().includes('power') || h.toLowerCase().includes('atk') || h.toLowerCase().includes('strength')
                    );
                    const defenseCandidates = headers.filter(h => 
                        h.toLowerCase().includes('defense') || h.toLowerCase().includes('health') || h.toLowerCase().includes('def') || h.toLowerCase().includes('hp')
                    );
                    const costCandidates = headers.filter(h => 
                        h.toLowerCase().includes('cost') || h.toLowerCase().includes('mana') || h.toLowerCase().includes('energy') || h.toLowerCase().includes('cp')
                    );

                    if (nameCandidates.length > 0) setNameColumn(nameCandidates[0]);
                    if (descCandidates.length > 0) setDescriptionColumn(descCandidates[0]);
                    if (modCandidates.length > 0) setModifiersColumn(modCandidates[0]);
                    if (typeCandidates.length > 0) setTypeColumn(typeCandidates[0]);
                    if (rarityCandidates.length > 0) setRarityColumn(rarityCandidates[0]);
                    if (elementCandidates.length > 0) setElementColumn(elementCandidates[0]);
                    if (attackCandidates.length > 0) setAttackColumn(attackCandidates[0]);
                    if (defenseCandidates.length > 0) setDefenseColumn(defenseCandidates[0]);
                    if (costCandidates.length > 0) setCostColumn(costCandidates[0]);

                    const cardData: CardData[] = jsonData
                        .filter(row => Object.values(row).some(v => v && String(v).trim()))
                        .map((row, index) => ({
                            id: `card_${index + 1}`,
                            name: '',
                            description: '',
                            promptModifiers: '',
                            ...Object.fromEntries(Object.entries(row).map(([k, v]) => [k, String(v)]))
                        }));
                    setCards(cardData);
                }
            };
            reader.readAsBinaryString(file);
        }
        e.target.value = '';
    }, []);

    const clearImportedData = useCallback(() => {
        setCards([]);
        setCsvHeaders([]);
        setNameColumn('');
        setDescriptionColumn('');
        setModifiersColumn('');
        setTypeColumn('');
        setRarityColumn('');
        setElementColumn('');
        setAttackColumn('');
        setDefenseColumn('');
        setCostColumn('');
        setCustomColumns(Array(10).fill(null).map(() => ({ column: '', label: '' })));
        setImportedFileName('');
    }, []);

    // Get mapped cards with proper field assignments
    const getMappedCards = useCallback(() => {
        return cards.map(card => {
            const name = nameColumn ? (card[nameColumn] || card.name) : card.name;
            const description = descriptionColumn ? (card[descriptionColumn] || card.description) : card.description;
            const type = typeColumn ? card[typeColumn] : '';
            const rarity = rarityColumn ? card[rarityColumn] : '';
            const element = elementColumn ? card[elementColumn] : '';
            const attack = attackColumn ? card[attackColumn] : '';
            const defense = defenseColumn ? card[defenseColumn] : '';
            const cost = costColumn ? card[costColumn] : '';
            const baseModifiers = modifiersColumn ? (card[modifiersColumn] || card.promptModifiers) : card.promptModifiers;
            
            // Build custom fields from free columns
            const customFields: Record<string, string> = {};
            customColumns.forEach((col, idx) => {
                if (col.column && card[col.column]) {
                    const label = col.label || `Custom ${idx + 1}`;
                    customFields[label] = card[col.column];
                }
            });
            
            // Build enhanced prompt modifiers from all attributes
            const attributeParts: string[] = [];
            if (type) attributeParts.push(`Type: ${type}`);
            if (rarity) attributeParts.push(`Rarity: ${rarity}`);
            if (element) attributeParts.push(`Element: ${element}`);
            if (attack) attributeParts.push(`Attack: ${attack}`);
            if (defense) attributeParts.push(`Defense: ${defense}`);
            if (cost) attributeParts.push(`Cost: ${cost}`);
            
            // Add custom fields to prompt modifiers
            Object.entries(customFields).forEach(([label, value]) => {
                attributeParts.push(`${label}: ${value}`);
            });
            
            const enhancedModifiers = [baseModifiers, ...attributeParts].filter(Boolean).join(', ');
            
            return {
                id: card.id,
                name,
                description,
                promptModifiers: enhancedModifiers,
                attributes: { type, rarity, element, attack, defense, cost },
                customFields
            };
        });
    }, [cards, nameColumn, descriptionColumn, modifiersColumn, typeColumn, rarityColumn, elementColumn, attackColumn, defenseColumn, costColumn, customColumns]);

    // Generation
    const generateCards = async () => {
        const mappedCards = getMappedCards().filter(card => card.name.trim());
        if (mappedCards.length === 0) {
            alert('Please ensure at least one card has a name');
            return;
        }

        setIsGenerating(true);
        setResults([]);
        setGenerationProgress(0);

        try {
            const response = await fetch('/api/trading-cards/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cards: mappedCards,
                    styleConfig,
                    referenceImages: referenceImages.map(img => ({
                        data: img.data,
                        mimeType: img.mimeType,
                        purpose: img.purpose,
                    })),
                    outputConfig: {
                        aspectRatio,
                        imageSize,
                        model: 'gemini-3-pro-image-preview',
                    },
                    useConversation: false, // Use parallel generation for faster processing
                }),
            });

            const data = await response.json();
            if (data.results) {
                setResults(data.results);
                setGenerationProgress(100);
            } else if (data.error) {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error('Generation failed:', error);
            alert('Failed to generate cards. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    // Download as ZIP
    const downloadAsZip = async () => {
        setIsDownloading(true);
        try {
            const zip = new JSZip();
            const successfulResults = results.filter(r => r.success && r.imageData);
            const mappedCards = getMappedCards();

            // Track used file names to avoid duplicates
            const usedNames = new Set<string>();

            for (let i = 0; i < successfulResults.length; i++) {
                const result = successfulResults[i];
                const card = mappedCards.find(c => c.id === result.cardId);
                
                // Create unique file name with index prefix to avoid duplicates
                const cardIndex = String(i + 1).padStart(3, '0');
                const safeName = (card?.name || 'card').replace(/[^a-zA-Z0-9\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/g, '_').substring(0, 50);
                let fileName = `${cardIndex}_${safeName}.png`;
                
                // Ensure uniqueness (fallback in case of any edge cases)
                let counter = 1;
                while (usedNames.has(fileName)) {
                    fileName = `${cardIndex}_${safeName}_${counter}.png`;
                    counter++;
                }
                usedNames.add(fileName);
                
                // Convert base64 to binary
                const binaryString = atob(result.imageData!);
                const bytes = new Uint8Array(binaryString.length);
                for (let j = 0; j < binaryString.length; j++) {
                    bytes[j] = binaryString.charCodeAt(j);
                }
                
                zip.file(fileName, bytes);
            }

            const blob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'trading_cards.zip';
            link.click();
            URL.revokeObjectURL(url);
        } finally {
            setIsDownloading(false);
        }
    };

    // Download as PDF
    const downloadAsPdf = async () => {
        setIsDownloading(true);
        try {
            const successfulResults = results.filter(r => r.success && r.imageData);
            const mappedCards = getMappedCards();
            
            // Calculate PDF dimensions based on selected aspect ratio
            // Base width of 100mm, height calculated from aspect ratio
            const [ratioW, ratioH] = aspectRatio.split(':').map(Number);
            const baseWidth = 100; // mm
            const height = (baseWidth * ratioH) / ratioW;
            const orientation = ratioW > ratioH ? 'landscape' : 'portrait';
            const pageWidth = orientation === 'landscape' ? height : baseWidth;
            const pageHeight = orientation === 'landscape' ? baseWidth : height;
            
            const pdf = new jsPDF({
                orientation: orientation as 'portrait' | 'landscape',
                unit: 'mm',
                format: [pageWidth, pageHeight]
            });

            for (let i = 0; i < successfulResults.length; i++) {
                const result = successfulResults[i];
                const card = mappedCards.find(c => c.id === result.cardId);
                
                if (i > 0) {
                    pdf.addPage([pageWidth, pageHeight], orientation as 'portrait' | 'landscape');
                }

                // Add image to PDF maintaining aspect ratio
                const imgData = `data:${result.mimeType};base64,${result.imageData}`;
                pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
                
                // Add card name as metadata
                if (card?.name) {
                    pdf.setProperties({ title: card.name });
                }
            }

            pdf.save('trading_cards.pdf');
        } finally {
            setIsDownloading(false);
        }
    };

    // Download single image
    const downloadSingleImage = (imageData: string, mimeType: string, cardName: string) => {
        const link = document.createElement('a');
        link.href = `data:${mimeType};base64,${imageData}`;
        link.download = `${cardName.replace(/[^a-zA-Z0-9]/g, '_')}_card.png`;
        link.click();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
            {/* Animated background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-1/2 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-pink-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="relative z-10 container mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg shadow-purple-500/25">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-5xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
                            TCG Maker
                        </h1>
                    </div>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                        Create stunning, consistent trading card artwork with AI. 
                        Powered by Google Gemini 3 Pro Image Generation.
                    </p>
                </div>

                {/* Step Indicator */}
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-4 bg-slate-900/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50">
                        {STEPS.map((step, index) => (
                            <div key={step.id} className="flex items-center">
                                <div 
                                    className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all ${
                                        currentStep === step.id 
                                            ? 'bg-purple-600 text-white' 
                                            : currentStep > step.id
                                                ? 'bg-green-600/20 text-green-400'
                                                : 'bg-slate-800/50 text-slate-500'
                                    }`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                        currentStep > step.id ? 'bg-green-500 text-white' : 'bg-slate-700'
                                    }`}>
                                        {currentStep > step.id ? <CheckCircle2 className="w-5 h-5" /> : step.id}
                                    </div>
                                    <div className="hidden sm:block">
                                        <div className="font-semibold text-sm">{step.title}</div>
                                        <div className="text-xs opacity-70">{step.description}</div>
                                    </div>
                                </div>
                                {index < STEPS.length - 1 && (
                                    <ArrowRight className={`w-5 h-5 mx-2 ${currentStep > step.id ? 'text-green-400' : 'text-slate-600'}`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step 1: Style Setup */}
                {currentStep === 1 && (
                    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-right duration-300">
                        <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Palette className="w-5 h-5 text-purple-400" />
                                    Art Style
                                </CardTitle>
                                <CardDescription className="text-slate-400">
                                    Choose a preset or describe your custom style for all cards
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    {PRESET_STYLES.map((preset) => (
                                        <Button
                                            key={preset.name}
                                            variant={styleConfig.artStyle === preset.value ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setStyleConfig(prev => ({ ...prev, artStyle: preset.value }))}
                                            className={styleConfig.artStyle === preset.value 
                                                ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                                                : 'border-slate-600 text-slate-400 hover:text-white hover:border-purple-500'}
                                        >
                                            {preset.name}
                                        </Button>
                                    ))}
                                </div>
                                <Textarea
                                    placeholder="Or describe your custom art style in detail..."
                                    value={styleConfig.artStyle}
                                    onChange={(e) => setStyleConfig(prev => ({ ...prev, artStyle: e.target.value }))}
                                    className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-purple-500 min-h-[100px]"
                                />
                            </CardContent>
                        </Card>

                        <div className="grid gap-6 lg:grid-cols-2">
                            <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <Settings2 className="w-5 h-5 text-purple-400" />
                                        Visual Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Color Palette</Label>
                                        <Input
                                            placeholder="e.g., warm golden tones, vibrant neon colors"
                                            value={styleConfig.colorPalette}
                                            onChange={(e) => setStyleConfig(prev => ({ ...prev, colorPalette: e.target.value }))}
                                            className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-purple-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Card Frame/Border</Label>
                                        <Input
                                            placeholder="e.g., ornate golden frame with gemstones"
                                            value={styleConfig.frameStyle}
                                            onChange={(e) => setStyleConfig(prev => ({ ...prev, frameStyle: e.target.value }))}
                                            className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-purple-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Background Style</Label>
                                        <Input
                                            placeholder="e.g., mystical swirling energy, dark dungeon"
                                            value={styleConfig.backgroundStyle}
                                            onChange={(e) => setStyleConfig(prev => ({ ...prev, backgroundStyle: e.target.value }))}
                                            className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-purple-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Additional Notes</Label>
                                        <Textarea
                                            placeholder="Any other style instructions..."
                                            value={styleConfig.additionalStyleNotes}
                                            onChange={(e) => setStyleConfig(prev => ({ ...prev, additionalStyleNotes: e.target.value }))}
                                            className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-purple-500"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <Upload className="w-5 h-5 text-purple-400" />
                                        Reference Images (Optional)
                                    </CardTitle>
                                    <CardDescription className="text-slate-400">
                                        Upload images for style transfer
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        {referenceImages.map((img, index) => (
                                            <div key={index} className="relative group">
                                                <img
                                                    src={img.preview}
                                                    alt={`Reference ${index + 1}`}
                                                    className="w-full h-24 object-cover rounded-lg border border-slate-600"
                                                />
                                                <Badge className="absolute top-1 left-1 text-xs bg-purple-600">
                                                    {img.purpose}
                                                </Badge>
                                                <button
                                                    onClick={() => removeReferenceImage(index)}
                                                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Remove image"
                                                    aria-label="Remove image"
                                                >
                                                    <XCircle className="w-4 h-4 text-white" />
                                                </button>
                                                <p className="text-xs text-slate-500 truncate mt-1">{img.fileName}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <label>
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'style')} />
                                            <Button variant="outline" className="w-full border-slate-600 text-slate-400 hover:text-white hover:border-purple-500" asChild>
                                                <span><ImageIcon className="w-4 h-4 mr-2" />Style Ref</span>
                                            </Button>
                                        </label>
                                        <label>
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'template')} />
                                            <Button variant="outline" className="w-full border-slate-600 text-slate-400 hover:text-white hover:border-purple-500" asChild>
                                                <span><FileText className="w-4 h-4 mr-2" />Template</span>
                                            </Button>
                                        </label>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Settings2 className="w-5 h-5 text-purple-400" />
                                    Output Settings
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Aspect Ratio</Label>
                                        <Select value={aspectRatio} onValueChange={setAspectRatio}>
                                            <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-800 border-slate-700">
                                                {ASPECT_RATIOS.map((ratio) => (
                                                    <SelectItem key={ratio.value} value={ratio.value} className="text-white hover:bg-slate-700">
                                                        {ratio.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Resolution</Label>
                                        <Select value={imageSize} onValueChange={setImageSize}>
                                            <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-800 border-slate-700">
                                                {IMAGE_SIZES.map((size) => (
                                                    <SelectItem key={size.value} value={size.value} className="text-white hover:bg-slate-700">
                                                        {size.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Step 2: Card Data Import */}
                {currentStep === 2 && (
                    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-right duration-300">
                        <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <FileSpreadsheet className="w-5 h-5 text-purple-400" />
                                    Import Card Data
                                </CardTitle>
                                <CardDescription className="text-slate-400">
                                    Upload a CSV or Excel file with your card data. Each row = one card.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {!importedFileName ? (
                                    <label className="block">
                                        <input
                                            type="file"
                                            accept=".csv,.xlsx,.xls"
                                            className="hidden"
                                            onChange={handleFileImport}
                                        />
                                        <div className="border-2 border-dashed border-slate-600 rounded-xl p-12 text-center cursor-pointer hover:border-purple-500 transition-colors">
                                            <Upload className="w-12 h-12 mx-auto text-slate-500 mb-4" />
                                            <p className="text-lg font-medium text-slate-300 mb-2">Drop your file here or click to browse</p>
                                            <p className="text-sm text-slate-500">Supports CSV and Excel files (.csv, .xlsx, .xls)</p>
                                        </div>
                                    </label>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-4">
                                            <div className="flex items-center gap-3">
                                                <FileSpreadsheet className="w-8 h-8 text-green-400" />
                                                <div>
                                                    <p className="text-white font-medium">{importedFileName}</p>
                                                    <p className="text-sm text-slate-400">{cards.length} cards loaded</p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={clearImportedData}
                                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Remove
                                            </Button>
                                        </div>

                                        {csvHeaders.length > 0 && (
                                            <div className="space-y-4">
                                                <h4 className="text-white font-medium flex items-center gap-2">
                                                    <Table className="w-4 h-4 text-purple-400" />
                                                    Map Columns to Card Fields
                                                </h4>
                                                
                                                {/* Primary Fields */}
                                                <div className="grid gap-4 sm:grid-cols-3">
                                                    <div className="space-y-2">
                                                        <Label className="text-slate-300">Card Name *</Label>
                                                        <Select value={nameColumn} onValueChange={setNameColumn}>
                                                            <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                                                                <SelectValue placeholder="Select column" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-slate-800 border-slate-700">
                                                                {csvHeaders.map((header) => (
                                                                    <SelectItem key={header} value={header} className="text-white hover:bg-slate-700">
                                                                        {header}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-slate-300">Description</Label>
                                                        <Select value={descriptionColumn || '_none'} onValueChange={(v) => setDescriptionColumn(v === '_none' ? '' : v)}>
                                                            <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                                                                <SelectValue placeholder="Select column" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-slate-800 border-slate-700">
                                                                <SelectItem value="_none" className="text-slate-500">None</SelectItem>
                                                                {csvHeaders.map((header) => (
                                                                    <SelectItem key={header} value={header} className="text-white hover:bg-slate-700">
                                                                        {header}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-slate-300">Prompt Modifiers</Label>
                                                        <Select value={modifiersColumn || '_none'} onValueChange={(v) => setModifiersColumn(v === '_none' ? '' : v)}>
                                                            <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                                                                <SelectValue placeholder="Select column" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-slate-800 border-slate-700">
                                                                <SelectItem value="_none" className="text-slate-500">None</SelectItem>
                                                                {csvHeaders.map((header) => (
                                                                    <SelectItem key={header} value={header} className="text-white hover:bg-slate-700">
                                                                        {header}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                {/* Card Attributes Section */}
                                                <div className="pt-4 border-t border-slate-700/50">
                                                    <h5 className="text-sm font-medium text-slate-400 mb-3">Card Attributes (Optional)</h5>
                                                    <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
                                                        <div className="space-y-2">
                                                            <Label className="text-slate-300 text-sm">Type/Class</Label>
                                                            <Select value={typeColumn || '_none'} onValueChange={(v) => setTypeColumn(v === '_none' ? '' : v)}>
                                                                <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white h-9 text-sm">
                                                                    <SelectValue placeholder="Select" />
                                                                </SelectTrigger>
                                                                <SelectContent className="bg-slate-800 border-slate-700">
                                                                    <SelectItem value="_none" className="text-slate-500">None</SelectItem>
                                                                    {csvHeaders.map((header) => (
                                                                        <SelectItem key={header} value={header} className="text-white hover:bg-slate-700">
                                                                            {header}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-slate-300 text-sm">Rarity</Label>
                                                            <Select value={rarityColumn || '_none'} onValueChange={(v) => setRarityColumn(v === '_none' ? '' : v)}>
                                                                <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white h-9 text-sm">
                                                                    <SelectValue placeholder="Select" />
                                                                </SelectTrigger>
                                                                <SelectContent className="bg-slate-800 border-slate-700">
                                                                    <SelectItem value="_none" className="text-slate-500">None</SelectItem>
                                                                    {csvHeaders.map((header) => (
                                                                        <SelectItem key={header} value={header} className="text-white hover:bg-slate-700">
                                                                            {header}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-slate-300 text-sm">Element</Label>
                                                            <Select value={elementColumn || '_none'} onValueChange={(v) => setElementColumn(v === '_none' ? '' : v)}>
                                                                <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white h-9 text-sm">
                                                                    <SelectValue placeholder="Select" />
                                                                </SelectTrigger>
                                                                <SelectContent className="bg-slate-800 border-slate-700">
                                                                    <SelectItem value="_none" className="text-slate-500">None</SelectItem>
                                                                    {csvHeaders.map((header) => (
                                                                        <SelectItem key={header} value={header} className="text-white hover:bg-slate-700">
                                                                            {header}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-slate-300 text-sm">Attack/Power</Label>
                                                            <Select value={attackColumn || '_none'} onValueChange={(v) => setAttackColumn(v === '_none' ? '' : v)}>
                                                                <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white h-9 text-sm">
                                                                    <SelectValue placeholder="Select" />
                                                                </SelectTrigger>
                                                                <SelectContent className="bg-slate-800 border-slate-700">
                                                                    <SelectItem value="_none" className="text-slate-500">None</SelectItem>
                                                                    {csvHeaders.map((header) => (
                                                                        <SelectItem key={header} value={header} className="text-white hover:bg-slate-700">
                                                                            {header}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-slate-300 text-sm">Defense/HP</Label>
                                                            <Select value={defenseColumn || '_none'} onValueChange={(v) => setDefenseColumn(v === '_none' ? '' : v)}>
                                                                <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white h-9 text-sm">
                                                                    <SelectValue placeholder="Select" />
                                                                </SelectTrigger>
                                                                <SelectContent className="bg-slate-800 border-slate-700">
                                                                    <SelectItem value="_none" className="text-slate-500">None</SelectItem>
                                                                    {csvHeaders.map((header) => (
                                                                        <SelectItem key={header} value={header} className="text-white hover:bg-slate-700">
                                                                            {header}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-slate-300 text-sm">Cost/Mana</Label>
                                                            <Select value={costColumn || '_none'} onValueChange={(v) => setCostColumn(v === '_none' ? '' : v)}>
                                                                <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white h-9 text-sm">
                                                                    <SelectValue placeholder="Select" />
                                                                </SelectTrigger>
                                                                <SelectContent className="bg-slate-800 border-slate-700">
                                                                    <SelectItem value="_none" className="text-slate-500">None</SelectItem>
                                                                    {csvHeaders.map((header) => (
                                                                        <SelectItem key={header} value={header} className="text-white hover:bg-slate-700">
                                                                            {header}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-2">
                                                        Card attributes will be included in the AI prompt to influence the artwork (e.g., &quot;Legendary&quot; rarity creates more ornate designs).
                                                    </p>
                                                </div>

                                                {/* Custom Free Columns */}
                                                <div className="pt-4 border-t border-slate-700/50">
                                                    <h5 className="text-sm font-medium text-slate-400 mb-3">Custom Fields (Optional - 10 free slots)</h5>
                                                    <p className="text-xs text-slate-500 mb-3">
                                                        Map any additional columns from your file. Add a label to describe what the field represents.
                                                    </p>
                                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                                        {customColumns.map((col, idx) => (
                                                            <div key={idx} className="space-y-1">
                                                                <div className="flex gap-1">
                                                                    <Input
                                                                        placeholder={`Label ${idx + 1}`}
                                                                        value={col.label}
                                                                        onChange={(e) => {
                                                                            const newCols = [...customColumns];
                                                                            newCols[idx] = { ...newCols[idx], label: e.target.value };
                                                                            setCustomColumns(newCols);
                                                                        }}
                                                                        className="bg-slate-800/50 border-slate-600 text-white h-8 text-xs flex-1"
                                                                    />
                                                                </div>
                                                                <Select 
                                                                    value={col.column || '_none'} 
                                                                    onValueChange={(v) => {
                                                                        const newCols = [...customColumns];
                                                                        newCols[idx] = { ...newCols[idx], column: v === '_none' ? '' : v };
                                                                        setCustomColumns(newCols);
                                                                    }}
                                                                >
                                                                    <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white h-8 text-xs">
                                                                        <SelectValue placeholder="Column" />
                                                                    </SelectTrigger>
                                                                    <SelectContent className="bg-slate-800 border-slate-700">
                                                                        <SelectItem value="_none" className="text-slate-500 text-xs">None</SelectItem>
                                                                        {csvHeaders.map((header) => (
                                                                            <SelectItem key={header} value={header} className="text-white hover:bg-slate-700 text-xs">
                                                                                {header}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {cards.length > 0 && nameColumn && (
                                            <div className="space-y-4">
                                                <h4 className="text-white font-medium flex items-center gap-2">
                                                    <Eye className="w-4 h-4 text-purple-400" />
                                                    Preview ({getMappedCards().filter(c => c.name.trim()).length} valid cards)
                                                </h4>
                                                <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-700">
                                                    <table className="w-full">
                                                        <thead className="bg-slate-800 sticky top-0">
                                                            <tr>
                                                                <th className="px-3 py-2 text-left text-slate-300 text-sm">#</th>
                                                                <th className="px-3 py-2 text-left text-slate-300 text-sm">Name</th>
                                                                <th className="px-3 py-2 text-left text-slate-300 text-sm">Description</th>
                                                                {(typeColumn || rarityColumn || elementColumn) && (
                                                                    <th className="px-3 py-2 text-left text-slate-300 text-sm">Attributes</th>
                                                                )}
                                                                {(attackColumn || defenseColumn || costColumn) && (
                                                                    <th className="px-3 py-2 text-left text-slate-300 text-sm">Stats</th>
                                                                )}
                                                                {customColumns.some(c => c.column) && (
                                                                    <th className="px-3 py-2 text-left text-slate-300 text-sm">Custom</th>
                                                                )}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {getMappedCards().slice(0, 10).map((card, idx) => (
                                                                <tr key={card.id} className="border-t border-slate-700/50">
                                                                    <td className="px-3 py-2 text-slate-500 text-sm">{idx + 1}</td>
                                                                    <td className="px-3 py-2 text-white text-sm font-medium">{card.name || <span className="text-red-400">Empty</span>}</td>
                                                                    <td className="px-3 py-2 text-slate-400 text-sm truncate max-w-[200px]">{card.description || '-'}</td>
                                                                    {(typeColumn || rarityColumn || elementColumn) && (
                                                                        <td className="px-3 py-2">
                                                                            <div className="flex flex-wrap gap-1">
                                                                                {card.attributes?.type && (
                                                                                    <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/30">{card.attributes.type}</Badge>
                                                                                )}
                                                                                {card.attributes?.rarity && (
                                                                                    <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/30">{card.attributes.rarity}</Badge>
                                                                                )}
                                                                                {card.attributes?.element && (
                                                                                    <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/30">{card.attributes.element}</Badge>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                    )}
                                                                    {(attackColumn || defenseColumn || costColumn) && (
                                                                        <td className="px-3 py-2">
                                                                            <div className="flex gap-2 text-xs">
                                                                                {card.attributes?.attack && (
                                                                                    <span className="text-red-400">⚔️{card.attributes.attack}</span>
                                                                                )}
                                                                                {card.attributes?.defense && (
                                                                                    <span className="text-green-400">🛡️{card.attributes.defense}</span>
                                                                                )}
                                                                                {card.attributes?.cost && (
                                                                                    <span className="text-cyan-400">💎{card.attributes.cost}</span>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                    )}
                                                                    {customColumns.some(c => c.column) && (
                                                                        <td className="px-3 py-2">
                                                                            <div className="flex flex-wrap gap-1">
                                                                                {Object.entries(card.customFields || {}).slice(0, 3).map(([label, value]) => (
                                                                                    <Badge key={label} variant="outline" className="text-xs bg-slate-500/10 text-slate-300 border-slate-500/30">
                                                                                        {label}: {value}
                                                                                    </Badge>
                                                                                ))}
                                                                                {Object.keys(card.customFields || {}).length > 3 && (
                                                                                    <span className="text-xs text-slate-500">+{Object.keys(card.customFields || {}).length - 3}</span>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                    )}
                                                                </tr>
                                                            ))}
                                                            {cards.length > 10 && (
                                                                <tr className="border-t border-slate-700/50">
                                                                    <td colSpan={6} className="px-3 py-2 text-center text-slate-500 text-sm">
                                                                        ... and {cards.length - 10} more cards
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Step 3: Generate & Download */}
                {currentStep === 3 && (
                    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-right duration-300">
                        {results.length === 0 ? (
                            <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50">
                                <CardContent className="py-16 text-center">
                                    {isGenerating ? (
                                        <div className="space-y-6">
                                            <Loader2 className="w-16 h-16 mx-auto text-purple-400 animate-spin" />
                                            <div>
                                                <p className="text-xl text-white font-medium mb-2">Generating your cards...</p>
                                                <p className="text-slate-400">This may take a few minutes depending on the number of cards.</p>
                                            </div>
                                            <div className="max-w-md mx-auto">
                                                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                                                        style={{ width: `${generationProgress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <Wand2 className="w-16 h-16 mx-auto text-slate-600" />
                                            <div>
                                                <p className="text-xl text-white font-medium mb-2">Ready to Generate</p>
                                                <p className="text-slate-400 mb-6">
                                                    {getMappedCards().filter(c => c.name.trim()).length} cards will be generated with your style settings.
                                                </p>
                                                <Button
                                                    onClick={generateCards}
                                                    size="lg"
                                                    className="bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-700 hover:via-pink-700 hover:to-amber-600 text-white font-bold px-8"
                                                >
                                                    <Wand2 className="w-5 h-5 mr-2" />
                                                    Generate Cards
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-3 py-1">
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                            {results.filter(r => r.success).length} Success
                                        </Badge>
                                        {results.some(r => !r.success) && (
                                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 px-3 py-1">
                                                <XCircle className="w-4 h-4 mr-2" />
                                                {results.filter(r => !r.success).length} Failed
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={downloadAsZip}
                                            disabled={isDownloading}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            {isDownloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileArchive className="w-4 h-4 mr-2" />}
                                            Download ZIP
                                        </Button>
                                        <Button
                                            onClick={downloadAsPdf}
                                            disabled={isDownloading}
                                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                        >
                                            {isDownloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                                            Download PDF
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {results.map((result) => {
                                        const card = getMappedCards().find(c => c.id === result.cardId);
                                        return (
                                            <Card key={result.cardId} className={`bg-slate-900/50 backdrop-blur-sm border-slate-700/50 overflow-hidden ${!result.success ? 'border-red-500/50' : ''}`}>
                                                {result.success && result.imageData ? (
                                                    <div className="relative group bg-slate-800/50">
                                                        <img
                                                            src={`data:${result.mimeType};base64,${result.imageData}`}
                                                            alt={card?.name || 'Generated card'}
                                                            className="w-full h-auto object-contain"
                                                        />
                                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <Button
                                                                onClick={() => downloadSingleImage(result.imageData!, result.mimeType!, card?.name || 'card')}
                                                                className="bg-white/20 backdrop-blur-sm hover:bg-white/30"
                                                            >
                                                                <Download className="w-4 h-4 mr-2" />
                                                                Download
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="aspect-[2/3] flex items-center justify-center bg-slate-800/50">
                                                        <div className="text-center p-4">
                                                            <XCircle className="w-12 h-12 mx-auto text-red-400 mb-2" />
                                                            <p className="text-red-400 text-sm">{result.error || 'Generation failed'}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                <CardContent className="p-3">
                                                    <h3 className="text-white font-medium truncate">{card?.name || result.cardId}</h3>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent">
                    <div className="container mx-auto flex justify-between max-w-4xl">
                        <Button
                            variant="outline"
                            onClick={() => setCurrentStep(prev => prev - 1)}
                            disabled={currentStep === 1}
                            className="border-slate-600 text-slate-400 hover:text-white hover:border-purple-500 disabled:opacity-30"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>

                        {currentStep < 3 && (
                            <Button
                                onClick={() => setCurrentStep(prev => prev + 1)}
                                disabled={currentStep === 1 ? !canProceedToStep2 : !canProceedToStep3}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-30"
                            >
                                Next Step
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        )}

                        {currentStep === 3 && results.length > 0 && (
                            <Button
                                onClick={() => {
                                    setResults([]);
                                    setCurrentStep(1);
                                }}
                                variant="outline"
                                className="border-slate-600 text-slate-400 hover:text-white hover:border-purple-500"
                            >
                                Start New Batch
                            </Button>
                        )}
                    </div>
                </div>

                {/* Bottom spacing */}
                <div className="h-24" />
            </div>
        </div>
    );
}
