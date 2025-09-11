
import { QuestionType } from '../types';

// FIX: Made the 'id' property optional to allow for creation during setup without an ID.
// This is a workaround for the type definition.
interface Prize {
  id?: string;
  name: string;
  imageUrl: string;
}

interface Question {
  questionText: string;
  clue?: string;
  type: QuestionType;
  answer: string;
  audioUrl?: string;
  timer?: number; // in seconds
  points?: number;
  audioStartTime?: number; // in seconds
  audioEndTime?: number; // in seconds
}

interface Round {
  name: string;
  questions: Question[];
  prizePool: Prize[];
}

interface Config {
    numTeams: number;
    teams: { name: string }[];
    rounds: Round[];
}


export const demoData: Config = {
    numTeams: 8,
    teams: [
        { name: 'The Quizzards of Oz' }, 
        { name: 'Tequila Mockingbird' }, 
        { name: 'The Trivia Titans' }, 
        { name: 'Sonic Boom' },
        { name: 'Quiztopher Columbus'},
        { name: 'John Trivialta'},
        { name: 'E=MC Hammer'},
        { name: 'Les Quizerables'}
    ],
    rounds: [
        {
            name: 'Hymnes Rock des années 80',
            prizePool: [
                { name: 'Gin', imageUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjQUZEM0E4IiBzdHJva2Utd2lkdGg9IjEuNSI+CiAgPHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2EtbGluZWpvaW49InJvdW5kIiBkPSJNOSAySDdWNWg0VjJNMTAgNWgxMEw4IDIySDZMMTAgNVoiIC8+CiAgPGNpcmNsZSBjeD0iMTMiIGN5PSIxNCIgcj0iNCIgLz4KPC9zdmc+' },
                { name: 'Tonic Water', imageUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkRDRTkxIiBzdHJva2Utd2lkdGg9IjEuNSI+CiAgPHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNNiAzSDE4VjIxSDZWM1oiIC8+CiAgPHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNNiA5aDEybS0xMiA2aDEyIiAvPgo8L3N2Zz4=' },
                { name: 'Lime', imageUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNkNCMjVDIiBzdHJva2Utd2lkdGg9IjEuNSI+CiAgPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iOSIgLz4KICA8cGF0aCBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGQ9Ik0xNSAzYy0yIDItNCA0LTYgNk05IDNjMiAyIDQgNCA2IDYiIC8+CiAgPHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBkPSJNMTIgM3YxOG05LTloLTE4IiAvPgo8L3N2Zz4=' },
                { name: 'Ice', imageUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjQUREOEZGIiBzdHJva2Utd2lkdGg9IjEuNSI+CiAgPHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNMyA3aDh2OGgtOFY3Wm0xMCAwaDh2OGgtOFY3Wm0tMTAgMTBoOHY4aC04di04Wm0xMCAwaDh2OGgtOHYtOFoiIC8+Cjwvc3ZnPg==' },
                { name: 'Mint', imageUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNkNCMjVDIiBzdHJva2Utd2lkdGg9IjEuNSI+CiAgPHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNMTIgMjFWM200IDZjLTMgMC00IDMtNCAzcy0xLTMtNC0zbTEwIDVjLTMgMC00IDMtNCAzcy0xLTMtNC0zIiAvPgo8L3N2Zz4=' },
                { name: 'Sugar', imageUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRjVFRkU2IiBzdHJva2Utd2lkdGg9IjEuNSI+CiAgPHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNNiAzaDEybDIgNXYxNEg0VjhMNiAzWiIgLz4KICA8cGF0aCBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1jaW5lam9pbj0icm91bmQiIGQ9Ik00IDhIMjBNNiAzaDMuNUw4IDEwLjVIOVYyME04IDEwaDgiIC8+CiAgPGNpcmNsZSBjeD0iMTYiIGN5PSIxMiIgcj0iMSIgLz4KICA8Y2lyY2xlIGN4PSIxNyIgY3k9IjE2IiByPSIwLjUiIC8+Cjwvc3ZnPg==' },
                { name: 'Lemon', imageUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkRDNDFBIiBzdHJva2Utd2lkdGg9IjEuNSI+CiAgPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iOSIgLz4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI0IiAvPgo8cGF0aCBzdHJva2UtbGluZWNhcD0icm91bmQiIGQ9Ik0xMiAzVjIxTTMgMTJIMjFNNS42NCA1Ljc0bDEyLjcyIDEyLjUyTTUuNjQgMTguMzZsMTIuNzItMTIuNjIiIC8+Cjwvc3ZnPg==' },
                { name: 'Orange', imageUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkY3NzAwIiBzdHJva2Utd2lkdGg9IjEuNSI+CiAgPHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNMTQgNGMuNS0xLjUgMi0yIDMtMiIgLz4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjE0IiByPSI3IiAvPgo8L3N2Zz4=' }
            ],
            questions: [
                { questionText: 'Devinez la chanson et l\'artiste', answer: 'Bon Jovi - Livin\' On A Prayer', type: QuestionType.LIVE, points: 2, timer: 30 },
                { questionText: 'Devinez la chanson et l\'artiste', answer: 'Guns N\' Roses - Sweet Child O\' Mine', type: QuestionType.LIVE },
                { questionText: 'Nommez cette ballade rock !', clue: 'Sortie en 1987 par un groupe britannique.', answer: 'Def Leppard - Pour Some Sugar On Me', type: QuestionType.LIVE }
            ]
        },
        {
            name: 'Bandes Originales de Films',
            prizePool: [
                { name: 'Vodka', imageUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRjVFRkU2IiBzdHJva2Utd2lkdGg9IjEuNSI+CiAgPHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNOSAySDdWNWg0VjJNMTAgNWgxMEw4IDIySDZMMTAgNVoiIC8+Cjwvc3ZnPg==' },
                { name: 'Ginger Beer', imageUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjQ0E5ODdCIiBzdHJva2Utd2lkdGg9IjEuNSI+CiAgPHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNNiAzSDE4VjIxSDZWM1oiIC8+CiAgPHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNMTYgOGwtMyA0IDYgNW0tOS04bDMgNi01IDMiIC8+Cjwvc3ZnPg==' },
                { name: 'Lime Juice', imageUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNkNCMjVDIiBzdHJva2Utd2lkdGg9IjEuNSI+CiAgPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iOSIgLz4KICA8cGF0aCBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGQ9Ik0xNSAzYy0yIDItNCA0LTYgNk05IDNjMiAyIDQgNCA2IDYiIC8+CiAgPHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBkPSJNMTIgM3YxOG05LTloLTE4IiAvPgo8L3N2Zz4=' },
                { name: 'Mint Sprig', imageUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNkNCMjVDIiBzdHJva2Utd2lkdGg9IjEuNSI+CiAgPHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNMTIgMjFWM200IDZjLTMgMC00IDMtNCAzcy0xLTMtNC0zbTEwIDVjLTMgMC00IDMtNCAzcy0xLTMtNC0zIiAvPgo8L3N2Zz4=' },
                { name: 'Cranberry Juice', imageUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRDY1OUEyIiBzdHJva2Utd2lkdGg9IjEuNSI+CiAgPGNpcmNsZSBjeD0iOS41IiBjeT0iOS41IiByPSIyLjUiIC8+CiAgPGNpcmNsZSBjeD0iMTQuNSIgY3k9IjkuNSIgcj0iMi41IiAvPgo8Y2lyY2xlIGN4PSIxMiIgY3k9IjE1IiByPSI0IiAvPgo8L3N2Zz4=' },
                { name: 'Triple Sec', imageUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkY3NzAwIiBzdHJva2Utd2lkdGg9IjEuNSI+CiAgPHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNOSAySDdWNWg0VjJNMTAgNWgxMEw4IDIySDZMMTAgNVptMyAxMWwtMi01IiAvPgo8L3N2Zz4=' },
                { name: 'Salt', imageUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRjVFRkU2IiBzdHJva2Utd2lkdGg9IjEuNSI+CiAgPGNpcmNsZSBjeD0iNiIgY3k9IjYiIHI9IjEiIC8+CiAgPGNpcmNsZSBjeD0iMTIiIGN5PSI2IiByPSIwLjUiIC8+CiAgPGNpcmNsZSBjeD0iMTYiIGN5PSI4IiByPSIxIiAvPgo8Y2lyY2xlIGN4PSI4IiBjeT0iMTAiIHI9IjAuNSIgLz4KPGNpcmNsZSBjeD0iMTQiIGN5PSIxMiIgcj0iMSIgLz4KPGNpcmNsZSBjeD0iOSIgY3k9IjE1IiByPSIwLjUiIC8+CiAgPGNpcmNsZSBjeD0iMTYiIGN5PSIxNyIgcj0iMSIgLz4KPC9zdmc+' },
                { name: 'Tequila', imageUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZDRTkxIiBzdHJva2Utd2lkdGg9IjEuNSI+CiAgPHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2EtbGluZWpvaW49InJvdW5kIiBkPSJNOSAySDdWNWg0VjJNMTAgNWgxMEw4IDIySDZMMTAgNVoiIC8+CiAgPHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNMTMgNC41TDExIDEyTTcgMmgxME0xMyA0LjVMMTUgMTIiIC8+Cjwvc3ZnPg==' }
            ],
            questions: [
                { questionText: 'De quel film provient ce thème iconique ?', answer: 'Star Wars - Main Theme', type: QuestionType.LIVE, points: 3 },
                { questionText: 'Devinez la chanson et l\'artiste', answer: 'Pharrell Williams - Happy', clue: 'De Moi, Moche et Méchant 2', type: QuestionType.LIVE, timer: 20 },
                { questionText: 'Cette chanson a remporté un Oscar. Nommez le film.', answer: 'Titanic - My Heart Will Go On', type: QuestionType.LIVE, points: 1 }
            ]
        },
        {
            name: 'Succès sans lendemain',
            prizePool: [
                { name: 'White Rum', imageUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRjVFRkU2IiBzdHJva2Utd2lkdGg9IjEuNSI+CiAgPHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNOSAySDdWNWg0VjJNMTAgNWgxMEw4IDIySDZMMTAgNVoiIC8+Cjwvc3ZnPg==' },
                { name: 'Cola', imageUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRDY1OUEyIiBzdHJva2Utd2lkdGg9IjEuNSI+CiAgPHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2EtbGluZWpvaW49InJvdW5kIiBkPSJNNiAzSDE4VjIxSDZWM1oiIC8+CiAgPHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNOSAxN2M0LTYgNC0xMSAwLTE0IiAvPgo8L3N2Zz4=' },
                { name: 'Lemon Wedge', imageUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkRDNDFBIiBzdHJva2Utd2lkdGg9IjEuNSI+CiAgPHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNMjEgMTJjMC00Ljk3LTQuMDMtOS05LTlzLTkgNC4wMy05IDloMTBaIiAvPgo8L3N2Zz4=' },
                { name: 'A paper umbrella', imageUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRjE1RTc5IiBzdHJva2Utd2lkdGg9IjEuNSI+CiAgPHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNMjEuMDcgMTJMMTIgMjEuMDdNMjEuMDcgMTJBNy44MSA3LjgxIDAgMSAwIDEyIDIxLjA3TTIuOTMgMTJsOSA5LjA3TTIgMTJoMG0tMi0ySDJtMjAgMmgwTTIzIDloMG0wIDZIMjFNMTIgMlYyMW0wIDBMMiAxMm0xMC4wNyA5LjA3YTcuODEgNy44MSAwIDAgMS05LjA3LTkuMDciIC8+Cjwvc3ZnPg==' },
                { name: 'Angostura Bitters', imageUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjQ0E5ODdCIiBzdHJva2Utd2lkdGg9IjEuNSI+CiAgPHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNOSAySDdWNWg0VjJNMTAgNWgxMEw4IDIySDZMMTAgNVoiIC8+CiAgPHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNMTMgMTNsMy0zLTEtMy0zIDMtMSA0IDIgMloiIC8+Cjwvc3ZnPg==' },
                { name: 'Whiskey', imageUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjQ0E5ODdCIiBzdHJva2Utd2lkdGg9IjEuNSI+CiAgPHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNMjAgMjFIM2wtMS0xNFY1aDE4djJIMjBaTTMgMjFoMTdNMTEgNUw5IDNoLTEuNU04IDIxaDhNMyA1aDE3IiAvPgo8L3N2Zz4=' },
                { name: 'Simple Syrup', imageUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRjVFRkU2IiBzdHJva2Utd2lkdGg9IjEuNSI+CiAgPHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNOSAySDdWNWg0VjJNMTAgNWgxMEw4IDIySDZMMTAgNVoiIC8+CiAgPHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNNiA5aDEybS05IDNsNi0zIiAvPgo8L3N2Zz4=' },
                { name: 'Cherry', imageUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRTU0ODQ4IiBzdHJva2Utd2lkdGg9IjEuNSI+CiAgPGNpcmNsZSBjeD0iOCIgY3k9IjE2IiByPSIzIiAvPgo8Y2lyY2xlIGN4PSIxNiIgY3k9IjE3IiByPSI0IiAvPgo8cGF0aCBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGQ9Ik0xNiA0VjE3TTggNFYxNm04LTljNC0zIDYtNSA2LTUiIC8+Cjwvc3ZnPg==' }
            ],
            questions: [
                 { questionText: 'Devinez la chanson et l\'artiste', answer: 'Los Del Rio - Macarena', type: QuestionType.LIVE },
                 { questionText: 'Devinez la chanson et l\'artiste', clue: 'Connu pour son riff de synthé distinctif.', answer: 'A-ha - Take On Me', type: QuestionType.LIVE, points: 2 },
                 { questionText: 'Cette chanson a été un énorme succès en 2012.', answer: 'Gotye - Somebody That I Used To Know', type: QuestionType.LIVE }
            ]
        }
    ]
};