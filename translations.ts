export const translations = {
  en: {
    // App.tsx
    settingsTitle: 'Settings',
    resetGameTitle: 'Reset Game',
    closeButton: 'Close',
    themeSelectorTitle: 'CHOOSE A THEME',
    languageSelectorTitle: 'LANGUAGE',

    // WelcomeScreen.tsx
    welcomeTitle: 'Quiz Night',
    welcomeSubtitle: 'Join the biggest quiz night of the century. Test your knowledge, outsmart your rivals, and collect the most prizes for victory.',
    createGameButton: 'Create Game',
    loadGameButton: 'Load Game',

    // SetupScreen.tsx
    step0: 'Configuration',
    step1: 'Contestants',
    step2: 'Rules',
    step3: 'Prizes',
    step4: 'Rounds',
    step5: 'Recap',
    configReset: 'Configuration reset.',
    errorAllTeamsMustHaveName: 'All teams must have a name.',
    errorPrizeBankNotEmpty: 'The prize bank must contain at least one prize.',
    errorMinOneRound: 'Please add at least one round.',
    errorRoundMustHaveName: 'All rounds must have a name.',
    errorRoundMinOneQuestion: (roundName: string) => `Round "${roundName}" must have at least one question.`,
    errorQuestionMustHaveAnswer: (roundName: string) => `All questions in round "${roundName}" must have an answer.`,
    errorPrizesMustHaveName: (roundName:string) => `All prizes in round "${roundName}" must have a name.`,
    errorPrizeCountMismatch: (roundName: string, prizeCount: number, teamCount: number) => `The number of prizes for round "${roundName}" (${prizeCount}) must equal the number of teams (${teamCount}).`,
    previousButton: 'Previous',
    nextButtonRules: 'Next: Rules',
    nextButtonPrizes: 'Next: Prizes',
    nextButtonRounds: 'Next: Rounds',
    nextButtonRecap: 'View Recap',
    startGameButton: 'Start the Game!',
    createGameButtonSetup: 'Create a new game',

    // SetupStep0Config.tsx
    loadExistingGame: 'Load an existing game',
    manageCurrentConfig: 'Manage current configuration',
    saveConfig: 'Save',
    exportJson: 'Export (JSON)',
    exportZip: 'Export (ZIP)',
    importFile: 'Import File',
    resetButton: 'Reset',
    noConfigAvailable: 'No configurations available.',
    localConfig: 'Local',
    presetConfig: 'Preset',
    loadButton: 'Load',
    deleteConfigConfirm: (name: string) => `Are you sure you want to delete the configuration "${name}"?`,
    configDeleted: (name: string) => `Configuration "${name}" deleted.`,
    configLoaded: (name: string) => `Configuration "${name}" loaded!`,
    errorInvalidConfig: 'Error: Invalid configuration file structure.',
    errorProcessingZip: 'Processing ZIP file...',
    saveConfigPrompt: 'Enter a name for this configuration:',
    preparingZip: 'Preparing ZIP file...',
    zipGenerated: 'ZIP generated! Downloading...',
    errorZip: (message: string) => `ZIP Error: ${message}`,

    // SetupStep1Teams.tsx
    teamCount: "Number of Teams",
    teamName: (index: number) => `Team ${index + 1} Name`,

    // SetupStep2Rules.tsx
    gameRulesTitle: 'Game Rules',
    prizeModeTitle: 'Game Mode (Prize Attribution)',
    prizeModePerRound: 'Per Round (Classic):',
    prizeModePerRoundDesc: 'Specific prizes are defined for each round. At the end of the round, prizes are assigned based on team rankings.',
    prizeModeBank: 'Prize Bank (Strategic):',
    prizeModeBankDesc: 'A central prize pool is created for the entire game. At the end of the round, teams choose a prize from the bank in order of their ranking.',
    buzzerModeTitle: 'Buzzer Mode',
    buzzerModeEnable: 'Enable Buzzer Mode:',
    buzzerModeEnableDesc: 'Players use their phones as buzzers. A QR code will be displayed for them to connect.',
    tieBreakerTitle: 'Tie-Breaker Management',
    tieBreakerNone: 'Disable:',
    tieBreakerNoneDesc: 'Ties are allowed. The order of tied teams will be determined randomly.',
    tieBreakerAll: 'Enable for all places:',
    tieBreakerAllDesc: 'A tie-breaker challenge will settle all tied teams.',
    tieBreakerFirst: 'Enable for 1st place only:',
    tieBreakerFirstDesc: 'A challenge will only break a tie for the win. Other ties will be ranked randomly.',
    winConditionTitle: 'Win Condition / Specific Rules',
    winConditionPlaceholder: 'Optional. If filled, a screen will display these rules at the start of the game.',

    // SetupStep3Prizes.tsx
    prizesTitle: 'The Prizes',
    prizeBankSetupDesc: 'Configure all the prizes that can be won during the game.',
    perRoundPrizeDesc: 'You have selected the "Per Round" prize mode.',
    perRoundPrizeConfigNext: 'Prizes for each round will be configured in the next step, along with the questions.',
    aiIdeas: 'Ideas',
    addPrize: 'Add',
    prizeLabel: (index: number) => `Prize ${index + 1}`,
    prizeNamePlaceholder: 'Prize name',
    uploadImage: 'Image',
    
    // SetupStep4Rounds.tsx
    roundsTitle: 'The Rounds',

    // RoundsSetup.tsx
    bulkImportAudio: 'Bulk Import Audio',
    addRound: 'Add Round',
    roundNamePlaceholder: (index: number) => `Round ${index + 1} Name`,
    aiAssistant: 'AI Assistant',
    questions: 'Questions',
    addQuestion: 'Add Question',
    questionLabel: (index: number) => `Question ${index + 1}`,
    questionTextPlaceholder: "Question text (e.g., 'What is this song?')",
    cluePlaceholder: 'Clue (optional, hidden during the game)',
    answerPlaceholder: 'Answer (for your reference)',
    points: 'Points',
    timer: 'Timer',
    none: 'None',
    splitAnswer: 'Split Artist / Title (1pt + 1pt)',
    questionTypeQuiz: 'QUIZ',
    questionTypeImage: 'IMAGE',
    questionTypeAudio: 'AUDIO',
    questionTypeLive: 'LIVE',
    audioFile: 'Audio File',
    processingNormalization: 'Normalizing audio...',
    missingFile: 'Missing file:',
    editTrimming: 'Edit Trim',
    prizesToWin: 'Prizes to win in this round',
    prizeCategoryPlaceholder: "Prize category (optional, e.g., Alcohols)",
    prizeCountMatchTeams: 'The number of prizes must match the number of teams.',
    
    // SetupStep5Recap.tsx
    recapTitle: 'Recap',
    editButton: 'Edit',
    recapContestants: 'Contestants',
    recapRules: 'Game Rules',
    recapPrizeMode: 'Game mode:',
    recapTieBreaker: 'Tie-breaker management:',
    recapTieBreakerValueNone: 'Disabled',
    recapTieBreakerValueAll: 'All places',
    recapTieBreakerValueFirst: '1st place only',
    recapSpecificRules: 'Specific rules:',
    recapPrizes: 'Prizes',
    recapPrizesInRounds: 'Prizes are defined in each round.',
    recapRounds: 'Rounds',
    recapQuestionCount: (count: number) => `${count} questions`,
    recapPrizeCount: (count: number) => `${count} prizes`,
    exportAnswers: 'Export Answer Sheet',
    pdfTitle: 'Quiz Night - Answer Sheet',
    pdfRulesTitle: 'Game Rules',
    pdfRoundTitle: 'Round',
    pdfPrizesForRound: 'Prizes for this round:',
    pdfPrizeBankTitle: 'Prize Bank',
    pdfQuestionColumn: 'Question',
    pdfAnswerColumn: 'Answer',
    pdfPointsColumn: 'Points',

    // WaitingRoom.tsx
    waitingRoomTitle: 'Waiting Room',
    waitingRoomSubtitle: 'The game is about to begin!',
    teamsReady: 'Teams Ready',

    // BuzzerManager.tsx
    buzzerInstructions: 'Scan the QR code with your phone to connect your buzzer!',
    buzzerHostId: 'Your Host ID:',
    buzzerConnectedTeams: 'Connected Teams',
    buzzerNoTeamsConnected: 'No teams connected yet.',
    
    // BuzzerController.tsx
    buzzerStatusWaiting: 'Waiting for a buzz...',
    buzzerStatusBuzzed: (teamName: string) => `${teamName} buzzed!`,
    buzzerStatusAllLocked: 'All teams are locked out!',
    buzzerHostCorrect: 'Correct',
    buzzerHostIncorrect: 'Incorrect',
    buzzerLockedOut: 'Locked Out',

    // GameScreen.tsx
    loading: 'Loading...',
    tieBreakerTieFor: (rank: number) => `Tie for ${rank}th place!`,
    tieBreakerFinalTieFor: (rank: number) => `Tie for ${rank}th place!`,
    congratsTeam: 'Bravo,',
    congratsAnd: 'and',
    congratsArtist: 'Artist',
    congratsTitle: 'Title',

    // AnswerDisplay.tsx
    answerIs: 'THE ANSWER IS...',
    nextQuestion: 'Next Question',
    viewRoundSummary: 'View Round Summary',
    undoButton: 'Undo',

    // FinalSummaryDisplay.tsx
    finalResults: 'Final Results',
    yourPrizeCollection: 'Your Prize Collection',
    noPrizes: 'No prizes.',
    congratsWinners: 'Congratulations to the winners! 🥳',
    
    // HorizontalScoreboard.tsx
    noPrizesCollected: 'No prizes',

    // QuestionDisplay.tsx
    questionXofY: (qNum: number, total: number) => `Question ${qNum} / ${total}`,
    pointsBanner: (points: number) => `${points} POINTS!`,
    pointsBannerSplit: '2 POINTS (1+1)',
    livePerformance: 'LIVE PERFORMANCE!',
    noAudioFile: 'No audio file.',
    noImageFile: 'No image.',
    revealClue: 'Reveal Clue',
    whoAnswered: 'Who answered correctly?',
    nobodyFound: "Nobody found it? Reveal the answer",
    validateAndReveal: 'Validate & Reveal',
    artist: 'Artist',
    title: 'Title',

    // RoundHeader.tsx
    roundLabel: 'Round:',
    prizesToWinHeader: 'PRIZES TO WIN',

    // RoundSummaryDisplay.tsx
    endOfRound: (roundName: string) => `End of round ${roundName}`,
    remainingPrizes: 'REMAINING PRIZES',
    assignPrizes: 'Assign a prize to each team based on their ranking.',
    choosePrize: '-- Choose --',
    backButton: 'Back',
    confirmAndNext: 'Confirm & Next Round',
    
    // TieBreakerDisplay.tsx
    tieBreakerTitleDisplay: 'Tie!',
    tieBreakerMessage: 'Organize a quick challenge to break the tie, then select the winner.',

    // RulesDisplay.tsx
    rulesTitle: 'Game Rules',
    rulesAcknowledge: 'Got it!',

    // PrizeSelectionDisplay.tsx
    prizeSelectionTitle: 'Prize Selection',
    selectionFinished: 'Selection finished!',
    prizeSummary: 'Here is the summary of the chosen prizes:',
    turnToPick: (teamName: string) => `It's ${teamName}'s turn to pick a prize!`,
    prizesRemaining: (count: number) => `Prizes remaining: ${count}`,
    undoLastChoice: 'Undo Last Choice',
    confirmPrizesAndNextRound: 'Confirm Prizes & Next Round',
  },
  fr: {
    // App.tsx
    settingsTitle: 'Paramètres',
    resetGameTitle: 'Réinitialiser le jeu',
    closeButton: 'Fermer',
    themeSelectorTitle: 'CHOISIR UN THÈME',
    languageSelectorTitle: 'LANGUE',
    
    // WelcomeScreen.tsx
    welcomeTitle: 'Quiz Night',
    welcomeSubtitle: 'Participez à la plus grande soirée quiz du siècle. Testez vos connaissances, surpassez vos rivaux et amassez le plus de prix pour la victoire.',
    createGameButton: 'Créer une partie',
    loadGameButton: 'Charger une partie',
    
    // SetupScreen.tsx
    step0: 'Configuration',
    step1: 'Concurrents',
    step2: 'Règles',
    step3: 'Prix',
    step4: 'Manches',
    step5: 'Récapitulatif',
    configReset: 'Configuration réinitialisée.',
    errorAllTeamsMustHaveName: 'Toutes les équipes doivent avoir un nom.',
    errorPrizeBankNotEmpty: 'La banque de prix doit contenir au moins un prix.',
    errorMinOneRound: 'Veuillez ajouter au moins une manche.',
    errorRoundMustHaveName: 'Toutes les manches doivent avoir un nom.',
    errorRoundMinOneQuestion: (roundName: string) => `La manche "${roundName}" doit avoir au moins une question.`,
    errorQuestionMustHaveAnswer: (roundName: string) => `Toutes les questions de la manche "${roundName}" doivent avoir une réponse.`,
    errorPrizesMustHaveName: (roundName:string) => `Tous les prix de la manche "${roundName}" doivent avoir un nom.`,
    errorPrizeCountMismatch: (roundName: string, prizeCount: number, teamCount: number) => `Le nombre de prix pour la manche "${roundName}" (${prizeCount}) doit être égal au nombre d'équipes (${teamCount}).`,
    previousButton: 'Précédent',
    nextButtonRules: 'Suivant : Règles',
    nextButtonPrizes: 'Suivant : Prix',
    nextButtonRounds: 'Suivant : Manches',
    nextButtonRecap: 'Voir le récapitulatif',
    startGameButton: 'Lancer la Partie !',
    createGameButtonSetup: 'Créer une nouvelle partie',

    // SetupStep0Config.tsx
    loadExistingGame: 'Charger une partie existante',
    manageCurrentConfig: 'Gérer la configuration actuelle',
    saveConfig: 'Sauvegarder',
    exportJson: 'Exporter (JSON)',
    exportZip: 'Exporter (ZIP)',
    importFile: 'Importer un Fichier',
    resetButton: 'Réinitialiser',
    noConfigAvailable: 'Aucune configuration disponible.',
    localConfig: 'Local',
    presetConfig: 'Prêt',
    loadButton: 'Charger',
    deleteConfigConfirm: (name: string) => `Êtes-vous sûr de vouloir supprimer la configuration "${name}" ?`,
    configDeleted: (name: string) => `Configuration "${name}" supprimée.`,
    configLoaded: (name: string) => `Configuration "${name}" chargée !`,
    errorInvalidConfig: 'Erreur: Structure de fichier de configuration invalide.',
    errorProcessingZip: 'Traitement du fichier ZIP...',
    saveConfigPrompt: 'Entrez un nom pour cette configuration :',
    preparingZip: 'Préparation du fichier ZIP...',
    zipGenerated: 'ZIP généré ! Téléchargement...',
    errorZip: (message: string) => `Erreur ZIP : ${message}`,
    
    // SetupStep1Teams.tsx
    teamCount: "Nombre d'Équipes",
    teamName: (index: number) => `Nom de l'Équipe ${index + 1}`,

    // SetupStep2Rules.tsx
    gameRulesTitle: 'Règles du Jeu',
    prizeModeTitle: 'Mode de Jeu (Attribution des Prix)',
    prizeModePerRound: 'Par Manche (Classique) :',
    prizeModePerRoundDesc: 'des prix spécifiques sont définis pour chaque manche. À la fin de la manche, les prix sont assignés selon le classement des équipes.',
    prizeModeBank: 'Banque de Prix (Stratégique) :',
    prizeModeBankDesc: 'une réserve centrale de prix est créée pour toute la partie. À la fin de la manche, les équipes choisissent un prix dans la banque, dans l\'ordre de leur classement.',
    buzzerModeTitle: 'Mode Buzzer',
    buzzerModeEnable: 'Activer le mode Buzzer :',
    buzzerModeEnableDesc: 'Les joueurs utilisent leurs téléphones comme buzzers. Un QR code sera affiché pour qu\'ils se connectent.',
    tieBreakerTitle: 'Gestion des Égalités',
    tieBreakerNone: 'Désactiver :',
    tieBreakerNoneDesc: 'les égalités sont autorisées. L\'ordre des équipes à égalité sera déterminé au hasard.',
    tieBreakerAll: 'Activer pour toutes les places :',
    tieBreakerAllDesc: 'un défi départagera toutes les équipes à égalité.',
    tieBreakerFirst: 'Activer uniquement pour la 1ère place :',
    tieBreakerFirstDesc: 'un défi ne départagera que les ex æquo pour la victoire. Les autres égalités seront classées au hasard.',
    winConditionTitle: 'Condition de Victoire / Règles Spécifiques',
    winConditionPlaceholder: 'Optionnel. Si rempli, un écran affichera ces règles au début de la partie.',
    
    // SetupStep3Prizes.tsx
    prizesTitle: 'Les Prix',
    prizeBankSetupDesc: 'Configurez tous les prix qui pourront être gagnés pendant la partie.',
    perRoundPrizeDesc: 'Vous avez choisi le mode de prix "Par Manche".',
    perRoundPrizeConfigNext: 'Les prix pour chaque manche seront configurés à l\'étape suivante, avec les questions.',
    aiIdeas: 'Idées',
    addPrize: 'Ajouter',
    prizeLabel: (index: number) => `Prix ${index + 1}`,
    prizeNamePlaceholder: 'Nom du prix',
    uploadImage: 'Image',
    
    // SetupStep4Rounds.tsx
    roundsTitle: 'Les Manches',

    // RoundsSetup.tsx
    bulkImportAudio: 'Importer des audios en masse',
    addRound: 'Ajouter une Manche',
    roundNamePlaceholder: (index: number) => `Nom de la Manche ${index + 1}`,
    aiAssistant: 'Assistant IA',
    questions: 'Questions',
    addQuestion: 'Ajouter une Question',
    questionLabel: (index: number) => `Question ${index + 1}`,
    questionTextPlaceholder: "Texte de la question (ex: 'Quelle est cette chanson ?')",
    cluePlaceholder: 'Indice (optionnel, caché pendant le jeu)',
    answerPlaceholder: 'Réponse (pour votre référence)',
    points: 'Points',
    timer: 'Chrono',
    none: 'Aucun',
    splitAnswer: 'Séparer Artiste / Titre (1pt + 1pt)',
    questionTypeQuiz: 'QUIZ',
    questionTypeImage: 'IMAGE',
    questionTypeAudio: 'AUDIO',
    questionTypeLive: 'LIVE',
    audioFile: 'Fichier audio',
    processingNormalization: 'Normalisation en cours...',
    missingFile: 'Fichier manquant :',
    editTrimming: 'Modifier l\'extrait',
    prizesToWin: 'Prix à gagner dans cette manche',
    prizeCategoryPlaceholder: "Catégorie des prix (optionnel, ex: Alcools)",
    prizeCountMatchTeams: 'Le nombre de prix doit correspondre au nombre d\'équipes.',
    
    // SetupStep5Recap.tsx
    recapTitle: 'Récapitulatif',
    editButton: 'Modifier',
    recapContestants: 'Concurrents',
    recapRules: 'Règles du Jeu',
    recapPrizeMode: 'Mode de jeu :',
    recapTieBreaker: 'Gestion des égalités :',
    recapTieBreakerValueNone: 'Désactivée',
    recapTieBreakerValueAll: 'Toutes les places',
    recapTieBreakerValueFirst: '1ère place uniquement',
    recapSpecificRules: 'Règles spécifiques :',
    recapPrizes: 'Prix',
    recapPrizesInRounds: 'Les prix sont définis dans chaque manche.',
    recapRounds: 'Manches',
    recapQuestionCount: (count: number) => `${count} questions`,
    recapPrizeCount: (count: number) => `${count} prix`,
    exportAnswers: 'Exporter la Feuille de Réponses',
    pdfTitle: 'Quiz Night - Feuille de Réponses',
    pdfRulesTitle: 'Règles du jeu',
    pdfRoundTitle: 'Manche',
    pdfPrizesForRound: 'Prix pour cette manche :',
    pdfPrizeBankTitle: 'Banque de Prix',
    pdfQuestionColumn: 'Question',
    pdfAnswerColumn: 'Réponse',
    pdfPointsColumn: 'Points',

    // WaitingRoom.tsx
    waitingRoomTitle: "Salle d'attente",
    waitingRoomSubtitle: 'La partie est sur le point de commencer !',
    teamsReady: 'Équipes en lice',
    
    // BuzzerManager.tsx
    buzzerInstructions: 'Scannez le QR code avec votre téléphone pour connecter votre buzzer !',
    buzzerHostId: 'Votre ID d\'hôte :',
    buzzerConnectedTeams: 'Équipes Connectées',
    buzzerNoTeamsConnected: 'Aucune équipe connectée pour le moment.',
    
    // BuzzerController.tsx
    buzzerStatusWaiting: 'En attente d\'un buzz...',
    buzzerStatusBuzzed: (teamName: string) => `${teamName} a buzzé !`,
    buzzerStatusAllLocked: 'Toutes les équipes sont bloquées !',
    buzzerHostCorrect: 'Correct',
    buzzerHostIncorrect: 'Incorrect',
    buzzerLockedOut: 'Bloquée',

    // GameScreen.tsx
    loading: 'Chargement...',
    tieBreakerTieFor: (rank: number) => `Égalité pour la ${rank}e place !`,
    tieBreakerFinalTieFor: (rank: number) => `Égalité pour la ${rank}e place !`,
    congratsTeam: 'Bravo,',
    congratsAnd: 'et',
    congratsArtist: 'Artiste',
    congratsTitle: 'Titre',

    // AnswerDisplay.tsx
    answerIs: 'LA RÉPONSE EST...',
    nextQuestion: 'Question Suivante',
    viewRoundSummary: 'Voir le résumé de la manche',
    undoButton: 'Annuler',

    // FinalSummaryDisplay.tsx
    finalResults: 'Résultats Finaux',
    yourPrizeCollection: 'Votre Collection de Prix',
    noPrizes: 'Aucun prix.',
    congratsWinners: 'Félicitations aux gagnants ! 🥳',
    
    // HorizontalScoreboard.tsx
    noPrizesCollected: 'Aucun prix',

    // QuestionDisplay.tsx
    questionXofY: (qNum: number, total: number) => `Question ${qNum} / ${total}`,
    pointsBanner: (points: number) => `${points} POINTS !`,
    pointsBannerSplit: '2 POINTS (1+1)',
    livePerformance: 'PRESTATION LIVE !',
    noAudioFile: 'Aucun fichier audio.',
    noImageFile: 'Aucune image.',
    revealClue: "Révéler l'indice",
    whoAnswered: 'Qui a répondu correctement ?',
    nobodyFound: "Personne n'a trouvé ? Révéler la réponse",
    validateAndReveal: 'Valider & Révéler',
    artist: 'Artiste',
    title: 'Titre',

    // RoundHeader.tsx
    roundLabel: 'Manche :',
    prizesToWinHeader: 'PRIX À GAGNER',
    
    // RoundSummaryDisplay.tsx
    endOfRound: (roundName: string) => `Fin de la manche ${roundName}`,
    remainingPrizes: 'PRIX RESTANTS',
    assignPrizes: 'Attribuez un prix à chaque équipe en fonction de leur classement.',
    choosePrize: '-- Choisir --',
    backButton: 'Retour',
    confirmAndNext: 'Confirmer & Prochaine Manche',
    
    // TieBreakerDisplay.tsx
    tieBreakerTitleDisplay: 'Égalité !',
    tieBreakerMessage: 'Organisez un défi rapide pour les départager, puis sélectionnez le vainqueur.',

    // RulesDisplay.tsx
    rulesTitle: 'Règles du Jeu',
    rulesAcknowledge: 'Compris !',
    
    // PrizeSelectionDisplay.tsx
    prizeSelectionTitle: 'Sélection des Prix',
    selectionFinished: 'Sélection terminée !',
    prizeSummary: 'Voici le résumé des prix choisis :',
    turnToPick: (teamName: string) => `Au tour de ${teamName} de choisir un prix !`,
    prizesRemaining: (count: number) => `Prix restants : ${count}`,
    undoLastChoice: 'Annuler le dernier choix',
    confirmPrizesAndNextRound: 'Confirmer & Prochaine Manche',
  }
};