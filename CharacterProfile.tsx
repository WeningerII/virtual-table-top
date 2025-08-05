import React, { useState } from 'react';
import { Character } from '../types';
import { suggestCharacterNames, generateAvatar } from '../services/ai/character.service';
import { useToast } from '../state/ToastContext';
import { GeminiError } from '../services/geminiService';
import { useCharacterActions } from '../hooks/useCharacterActions';

interface CharacterProfileProps {
    character: Character;
}

const CharacterProfile: React.FC<CharacterProfileProps> = ({ character }) => {
    const { addToast } = useToast();
    const { updateMetaPartial } = useCharacterActions();
    const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
    const [isSuggestingNames, setIsSuggestingNames] = useState(false);
    const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);

    const handleSuggestNames = async () => {
        setIsSuggestingNames(true);
        setNameSuggestions([]);
        const species = character.heritage.resolvedHeritage?.name;
        const dndClass = character.classes.length > 0 ? character.classes[0].id : undefined;
        const suggestions = await suggestCharacterNames(species, dndClass);
        setNameSuggestions(suggestions);
        setIsSuggestingNames(false);
    };

    const handleGenerateAvatar = async () => {
        setIsGeneratingAvatar(true);
        try {
            const imageUrl = await generateAvatar(character);
            if (imageUrl) {
                updateMetaPartial({ characterPortraitUrl: imageUrl });
            }
        } catch (error) {
            console.error("Avatar generation failed:", error);
            const message = error instanceof GeminiError && error.isQuotaError
                ? "Avatar generation is temporarily unavailable due to high usage."
                : "Failed to generate avatar. Please try again later.";
            addToast(message, "error");
        }
        setIsGeneratingAvatar(false);
    }
    
    const handleChange = (update: Partial<Character>) => {
        updateMetaPartial(update);
    }

    const avatarUrl = character.characterPortraitUrl || character.heritage.resolvedHeritage?.iconUrl || 'https://picsum.photos/seed/avatar/96/96';

    return (
        <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="relative group w-24 h-24 flex-shrink-0">
                <div className="w-24 h-24 rounded-full bg-gray-700 border-2 border-dashed border-gray-500 flex items-center justify-center">
                   <img src={avatarUrl} alt="Character Avatar" className="w-full h-full rounded-full object-cover"/>
                </div>
                {isGeneratingAvatar && (
                    <div className="absolute inset-0 bg-black bg-opacity-70 rounded-full flex items-center justify-center">
                        <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                )}
                 <button 
                    onClick={handleGenerateAvatar} 
                    disabled={isGeneratingAvatar}
                    title="Generate with AI"
                    className="absolute -bottom-2 -right-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center transition-transform transform hover:scale-110 shadow-lg z-10 disabled:bg-gray-500 disabled:cursor-wait">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                 </button>
            </div>
            <div className="flex-grow w-full">
                <label htmlFor="characterName" className="text-sm font-medium text-gray-400">Character Name</label>
                <input
                    id="characterName"
                    type="text"
                    value={character.name}
                    onChange={(e) => handleChange({ name: e.target.value })}
                    placeholder="Enter character name"
                    className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
                <button
                    onClick={handleSuggestNames}
                    disabled={isSuggestingNames}
                    className="text-xs text-blue-400 hover:text-blue-300 mt-2 transition-colors disabled:text-gray-500"
                >
                    {isSuggestingNames ? 'Generating...' : 'SHOW SUGGESTIONS'}
                </button>
                {nameSuggestions.length > 0 && (
                    <div className="mt-2 p-2 bg-gray-900 rounded-md border border-gray-700">
                        <p className="text-xs text-gray-400 mb-2">Click a name to use it:</p>
                        <div className="flex flex-wrap gap-2">
                            {nameSuggestions.map(name => (
                                <button
                                    key={name}
                                    onClick={() => {
                                      updateMetaPartial({ name });
                                      setNameSuggestions([]);
                                    }}
                                    className="px-2 py-1 bg-gray-700 text-white rounded-md text-sm hover:bg-blue-600 transition"
                                >
                                    {name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CharacterProfile;