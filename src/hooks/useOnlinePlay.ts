import { useEffect, useRef } from 'react';
import { message } from 'antd';
import { useAppDispatch, useAppSelector } from './index';
import {
  applyRemoteMove, onlineMatched, onlineAborted, updateRoomList, addChatMessage,
  hostRoomCreated, playerJoinedRoom, guestJoined, guestLeft,
} from '../models/chessSlice';
import { store } from '../store';

function wsUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  if (import.meta.env.DEV) {
    return `${proto}//${window.location.host}/ws`;
  }
  return `${proto}//${window.location.hostname}:8080`;
}

export let globalWs: WebSocket | null = null;

export function useOnlinePlay() {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((s) => s.chess.mode);
  const roomStatus = useAppSelector((s) => s.chess.roomStatus);
  const paceHistory = useAppSelector((s) => s.chess.paceHistory);
  const chessChange = useAppSelector((s) => s.chess.chessChange);
  const board = useAppSelector((s) => s.chess.board);
  const winner = useAppSelector((s) => s.chess.winner);
  const playerName = useAppSelector((s) => s.chess.playerName);

  const wsRef = useRef<WebSocket | null>(null);
  const lastSentPaceLenRef = useRef(0);

  useEffect(() => {
    if (mode !== 5) {
      wsRef.current?.close();
      wsRef.current = null;
      globalWs = null;
      lastSentPaceLenRef.current = 0;
      return;
    }

    lastSentPaceLenRef.current = 0;
    const ws = new WebSocket(wsUrl());
    wsRef.current = ws;
    globalWs = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'list_rooms', name: playerName }));
    };

    ws.onmessage = (ev) => {
      let data: unknown;
      try {
        data = JSON.parse(ev.data as string);
      } catch {
        return;
      }
      const msg = data as Record<string, unknown>;

      if (msg.type === 'room_list') {
        dispatch(updateRoomList(msg.rooms as any));
        return;
      }

      // Host đã tạo phòng thành công → chuyển sang màn hình phòng chờ
      if (msg.type === 'room_created') {
        dispatch(hostRoomCreated({ roomId: msg.roomId as string, roomName: msg.roomName as string }));
        return;
      }

      // Khách đã join phòng → chờ host bắt đầu
      if (msg.type === 'room_joined') {
        message.info(`Đã vào phòng. Chờ chủ phòng bắt đầu...`);
        dispatch(playerJoinedRoom({ roomId: msg.roomId as string, hostName: msg.hostName as string }));
        return;
      }

      // Host nhận notify có khách vào
      if (msg.type === 'guest_joined') {
        message.success(`${msg.guestName} đã vào phòng!`);
        dispatch(guestJoined(msg.guestName as string));
        return;
      }

      // Host nhận notify khách rời phòng
      if (msg.type === 'guest_left') {
        message.warning('Khách đã rời phòng');
        dispatch(guestLeft());
        return;
      }

      if (msg.type === 'chat') {
        dispatch(addChatMessage({ sender: msg.sender as string, message: msg.message as string }));
        return;
      }

      if (msg.type === 'error') {
        message.error(msg.message as string);
        return;
      }

      if (msg.type === 'matched' && typeof msg.color === 'string' && typeof msg.orderSide === 'number') {
        const opponentName = typeof msg.opponentName === 'string' ? msg.opponentName : 'Opponent';
        message.success(`Trận đấu bắt đầu! Đối thủ: ${opponentName}`);
        lastSentPaceLenRef.current = 0;
        dispatch(onlineMatched({ color: msg.color, orderSide: msg.orderSide as number, opponentName }));
        return;
      }

      if (msg.type === 'queue') {
        message.info('Đang chờ đối thủ...');
        return;
      }

      if (msg.type === 'opponent_left') {
        message.warning('Đối thủ đã thoát');
        dispatch(onlineAborted());
        ws.send(JSON.stringify({ type: 'list_rooms' }));
        return;
      }

      if (msg.type === 'move') {
        const from = msg.from as unknown;
        const to = msg.to as unknown;
        const piece = msg.piece as unknown;
        const win = msg.winner as unknown;
        if (!Array.isArray(from) || !Array.isArray(to) || from.length !== 2 || to.length !== 2 || typeof piece !== 'string') {
          return;
        }
        dispatch(
          applyRemoteMove({
            from: [Number(from[0]), Number(from[1])],
            to: [Number(to[0]), Number(to[1])],
            piece,
            winner: win === undefined || win === null ? null : Number(win),
          })
        );
        lastSentPaceLenRef.current = store.getState().chess.paceHistory.length;
        return;
      }
    };

    ws.onerror = () => {
      message.error('Lỗi kết nối WebSocket');
    };

    ws.onclose = () => {
      if (wsRef.current === ws) wsRef.current = null;
    };

    return () => {
      ws.close();
      if (wsRef.current === ws) wsRef.current = null;
    };
  }, [mode, dispatch]);

  useEffect(() => {
    if (mode !== 5 || roomStatus !== 'playing') return;
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    if (paceHistory.length <= lastSentPaceLenRef.current) return;
    if (!chessChange) return;

    const [[i, j], [oldi, oldj]] = chessChange;
    const piece = board[i]?.[j];
    if (!piece) return;

    lastSentPaceLenRef.current = paceHistory.length;
    ws.send(
      JSON.stringify({
        type: 'move',
        from: [oldi, oldj],
        to: [i, j],
        piece,
        winner: winner ?? null,
      })
    );
  }, [mode, roomStatus, paceHistory, chessChange, board, winner]);
}
