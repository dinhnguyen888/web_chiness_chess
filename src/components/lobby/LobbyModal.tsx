import React, { useState } from 'react';
import { Modal, Input, Button, List, Typography, Space } from 'antd';
import { useAppSelector } from '../../hooks';
import { globalWs } from '../../hooks/useOnlinePlay';

const LobbyModal: React.FC = () => {
  const roomStatus = useAppSelector(s => s.chess.roomStatus);
  const rooms = useAppSelector(s => s.chess.rooms);
  const mode = useAppSelector(s => s.chess.mode);
  const playerName = useAppSelector(s => s.chess.playerName);
  const [roomName, setRoomName] = useState('');
  const [search, setSearch] = useState('');

  if (mode !== 5 || roomStatus !== 'listing') return null;

  const handleCreate = () => {
    if (!roomName.trim()) return;
    if (globalWs && globalWs.readyState === WebSocket.OPEN) {
      globalWs.send(JSON.stringify({ type: 'create_room', roomName: roomName.trim(), name: playerName }));
    }
  };

  const handleJoin = (roomId: string) => {
    if (globalWs && globalWs.readyState === WebSocket.OPEN) {
      globalWs.send(JSON.stringify({ type: 'join_room', roomId, name: playerName }));
    }
  };

  const handleSearch = () => {
    if (globalWs && globalWs.readyState === WebSocket.OPEN) {
      globalWs.send(JSON.stringify({ type: 'search_room', query: search.trim(), name: playerName }));
    }
  };

  const handleRefresh = () => {
    if (globalWs && globalWs.readyState === WebSocket.OPEN) {
      globalWs.send(JSON.stringify({ type: 'list_rooms', name: playerName }));
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ background: '#fff', width: 600, padding: 24, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
        <Typography.Title level={3}>Sảnh Chờ - Cờ Tướng</Typography.Title>
        <Space style={{ marginBottom: 16 }}>
          <Input placeholder="Nhập tên phòng mới..." value={roomName} onChange={e => setRoomName(e.target.value)} />
          <Button type="primary" onClick={handleCreate}>Tạo phòng</Button>
        </Space>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Input.Search placeholder="Tìm ID hoặc tên" value={search} onChange={e => setSearch(e.target.value)} onSearch={handleSearch} enterButton style={{ width: 200 }} />
          <Button onClick={handleRefresh}>Làm mới</Button>
        </div>

        <List
          bordered
          dataSource={rooms}
          renderItem={item => (
            <List.Item
              actions={[
                <Button disabled={item.isPlaying} type="primary" onClick={() => handleJoin(item.id)}>
                  {item.isPlaying ? 'Đang chơi' : 'Tham gia'}
                </Button>
              ]}
            >
              <List.Item.Meta
                title={`[#${item.id}] ${item.name}`}
                description={`Chủ phòng: ${item.host}`}
              />
            </List.Item>
          )}
          style={{ maxHeight: 300, overflowY: 'auto' }}
        />
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Button onClick={() => window.location.reload()} danger>Thoát</Button>
        </div>
      </div>
    </div>
  );
};

export default LobbyModal;
