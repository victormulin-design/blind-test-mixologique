import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import type { Team } from '../types';

type BuzzerState = {
    status: 'OPEN' | 'BUZZED' | 'LOCKED';
    buzzedTeamId: string | null;
    lockedOutTeamIds: string[];
};

type ConnectedTeam = {
    connId: string;
    teamId: string;
    teamName: string;
};

type BuzzerContextType = {
    hostId: string | null;
    connectedTeams: ConnectedTeam[];
    buzzerState: BuzzerState;
    resetBuzzer: () => void;
    handleIncorrect: () => void;
};

const BuzzerContext = createContext<BuzzerContextType | undefined>(undefined);

export const BuzzerProvider: React.FC<{ children: React.ReactNode; teams: Team[] }> = ({ children, teams }) => {
    const [hostId, setHostId] = useState<string | null>(null);
    const [connections, setConnections] = useState<any[]>([]);
    const [connectedTeams, setConnectedTeams] = useState<ConnectedTeam[]>([]);
    const [buzzerState, setBuzzerState] = useState<BuzzerState>({
        status: 'OPEN',
        buzzedTeamId: null,
        lockedOutTeamIds: [],
    });
    const peerRef = useRef<Peer | null>(null);

    useEffect(() => {
        const peer = new Peer();
        peerRef.current = peer;

        peer.on('open', (id) => {
            setHostId(id);
        });

        peer.on('connection', (conn) => {
            conn.on('open', () => {
                setConnections(prev => [...prev, conn]);
                // Send team list to the new connection
                conn.send({ type: 'TEAM_LIST', payload: teams });
            });

            conn.on('data', (data: any) => {
                if (data.type === 'REGISTER' && data.payload.teamId) {
                    setConnectedTeams(prev => {
                        const existing = prev.find(t => t.connId === conn.peer);
                        if (existing) return prev;
                        const team = teams.find(t => t.id === data.payload.teamId);
                        if (team) {
                           return [...prev, { connId: conn.peer, teamId: team.id, teamName: team.name }];
                        }
                        return prev;
                    });
                }
                if (data.type === 'BUZZ') {
                    handleBuzz(conn.peer);
                }
            });
            
            conn.on('close', () => {
                setConnections(prev => prev.filter(c => c.peer !== conn.peer));
                setConnectedTeams(prev => prev.filter(t => t.connId !== conn.peer));
            });
        });

        return () => {
            peer.destroy();
        };
    }, [teams]);
    
    const handleBuzz = (connId: string) => {
        setBuzzerState(prev => {
            const team = connectedTeams.find(t => t.connId === connId);
            if (prev.status === 'OPEN' && team && !prev.lockedOutTeamIds.includes(team.teamId)) {
                return { ...prev, status: 'BUZZED', buzzedTeamId: team.teamId };
            }
            return prev;
        });
    };
    
    const resetBuzzer = () => {
        setBuzzerState({ status: 'OPEN', buzzedTeamId: null, lockedOutTeamIds: [] });
        broadcast({ type: 'RESET_BUZZER' });
    };

    const handleIncorrect = () => {
        setBuzzerState(prev => {
            if (prev.status !== 'BUZZED' || !prev.buzzedTeamId) return prev;
            
            const newLockedOut = [...prev.lockedOutTeamIds, prev.buzzedTeamId];
            const allTeamsLocked = teams.every(team => newLockedOut.includes(team.id));

            broadcast({ type: 'LOCK', payload: newLockedOut });

            if (allTeamsLocked) {
                return { ...prev, status: 'LOCKED', buzzedTeamId: null, lockedOutTeamIds: newLockedOut };
            }

            return { status: 'OPEN', buzzedTeamId: null, lockedOutTeamIds: newLockedOut };
        });
    };

    const broadcast = (data: any) => {
        connections.forEach(conn => conn.send(data));
    };

    const value = { hostId, connectedTeams, buzzerState, resetBuzzer, handleIncorrect };

    return (
        <BuzzerContext.Provider value={value}>
            {children}
        </BuzzerContext.Provider>
    );
};

export const useBuzzer = () => {
    return useContext(BuzzerContext);
};
