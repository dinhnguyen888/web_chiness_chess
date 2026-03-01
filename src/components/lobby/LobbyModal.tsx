import React from 'react';
import { useAppSelector } from '../../hooks';
import LobbyScreen from './LobbyScreen';
import RoomWaitingScreen from './RoomWaitingScreen';

/**
 * Entry point cho toàn bộ Lobby UI.
 * Chỉ quyết định hiển thị màn nào dựa vào roomStatus.
 * Mọi logic đã được delegate xuống các component con.
 */
const LobbyModal: React.FC = () => {
  const mode = useAppSelector(s => s.chess.mode);
  const roomStatus = useAppSelector(s => s.chess.roomStatus);

  if (mode !== 5 || roomStatus === 'playing') return null;
  if (roomStatus === 'waiting_in_room') return <RoomWaitingScreen />;
  return <LobbyScreen />;
};

export default LobbyModal;
