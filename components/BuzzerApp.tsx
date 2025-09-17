import React, { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';

type Team = { id: string; name: string };
type HostMessage = { type: 'TEAM_LIST'; payload: Team[] } | { type: 'RESET_BUZZER' } | { type: 'LOCK'; payload: string[] };

const BuzzerApp: React.FC = () => {
    const [status, setStatus] = useState('Connecting to server...');
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [isLocked, setIsLocked] = useState(false);
    
    const wakeLockRef = useRef<any>(null);
    const peerRef = useRef<Peer | null>(null);
    const connRef = useRef<any>(null);

    useEffect(() => {
        document.body.className = 'bg-gray-900 text-gray-100 font-sans';
        
        const acquireWakeLock = async () => {
            if ('wakeLock' in navigator) {
                try {
                    wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
                    console.log('Screen Wake Lock is active.');
                } catch (err: any) {
                    console.error(`${err.name}, ${err.message}`);
                }
            }
        };
        acquireWakeLock();

        const urlParams = new URLSearchParams(window.location.search);
        const hostId = urlParams.get('hostId');

        if (!hostId) {
            setStatus('Error: Host ID not found in URL.');
            return;
        }

        const peer = new Peer();
        peerRef.current = peer;

        peer.on('open', (id) => {
            console.log('My peer ID is: ' + id);
            const connection = peer.connect(hostId);
            connRef.current = connection;
            
            connection.on('open', () => {
                setStatus('Connected to host! Waiting for teams...');
            });

            connection.on('data', (data: HostMessage) => {
                if (data.type === 'TEAM_LIST') {
                    setTeams(data.payload);
                    setStatus('Please select your team.');
                }
                if (data.type === 'RESET_BUZZER') {
                    setIsLocked(false);
                }
                if (data.type === 'LOCK') {
                    // Use functional update to get the latest selectedTeam state
                    // without needing it in the dependency array.
                    setSelectedTeam(currentSelectedTeam => {
                        if (currentSelectedTeam && data.payload.includes(currentSelectedTeam.id)) {
                            setIsLocked(true);
                        }
                        return currentSelectedTeam;
                    });
                }
            });

             connection.on('close', () => {
                setStatus('Disconnected from host. Please refresh and rejoin.');
                connRef.current = null;
            });
            connection.on('error', (err) => {
                setStatus('Connection error. Please refresh.');
                console.error(err);
            });
        });
        
        peer.on('error', (err) => {
             setStatus('Could not establish connection. Check Host ID.');
             console.error(err);
        });

        return () => {
            if (wakeLockRef.current) {
                wakeLockRef.current.release();
                wakeLockRef.current = null;
            }
            if (connRef.current) {
                connRef.current.close();
            }
            if (peerRef.current) {
                peerRef.current.destroy();
            }
        };
    }, []); // Empty dependency array ensures this effect runs only once.

    const handleTeamSelect = (team: Team) => {
        setSelectedTeam(team);
        if (connRef.current) {
            connRef.current.send({ type: 'REGISTER', payload: { teamId: team.id } });
        }
    };

    const handleBuzz = () => {
        if (connRef.current && selectedTeam && !isLocked) {
            connRef.current.send({ type: 'BUZZ' });
        }
    };

    if (!selectedTeam) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold mb-4">{status}</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
                    {teams.map(team => (
                        <button key={team.id} onClick={() => handleTeamSelect(team)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-4 rounded-lg text-xl">
                            {team.name}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    const buttonColor = isLocked ? 'bg-gray-600' : 'bg-red-600';
    const buttonText = isLocked ? 'LOCKED' : 'BUZZ!';

    return (
        <div className="min-h-screen flex flex-col items-center justify-center select-none" onTouchStart={handleBuzz} onMouseDown={handleBuzz}>
            <div className="text-center mb-8">
                <p className="text-xl">Team</p>
                <h2 className="text-4xl font-bold">{selectedTeam.name}</h2>
            </div>
            <div className={`w-64 h-64 sm:w-80 sm:h-80 rounded-full flex items-center justify-center transition-colors ${buttonColor}`}>
                <span className="text-5xl sm:text-7xl font-bold text-white tracking-widest">{buttonText}</span>
            </div>
        </div>
    );
};

export default BuzzerApp;