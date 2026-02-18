import React, { useState } from 'react';
import { Input, Button, List, Typography, Space, Checkbox, Spin, Tag, Divider } from 'antd';
import { UserOutlined, TeamOutlined, PlayCircleOutlined, ReloadOutlined, PlusOutlined, LoginOutlined } from '@ant-design/icons';
import { useAppSelector } from '../../hooks';
import { globalWs } from '../../hooks/useOnlinePlay';

const LobbyModal: React.FC = () => {
  const roomStatus = useAppSelector(s => s.chess.roomStatus);
  const rooms = useAppSelector(s => s.chess.rooms);
  const mode = useAppSelector(s => s.chess.mode);
  const playerName = useAppSelector(s => s.chess.playerName);
  const currentRoomId = useAppSelector(s => s.chess.currentRoomId);
  const currentRoomName = useAppSelector(s => s.chess.currentRoomName);
  const guestName = useAppSelector(s => s.chess.guestName);
  const opponentName = useAppSelector(s => s.chess.opponentName);

  const [roomName, setRoomName] = useState('');
  const [search, setSearch] = useState('');
  const [autoStart, setAutoStart] = useState(false);

  if (mode !== 5 || roomStatus === 'playing') return null;

  const send = (payload: object) => {
    if (globalWs && globalWs.readyState === WebSocket.OPEN) {
      globalWs.send(JSON.stringify(payload));
    }
  };

  const handleCreate = () => {
    if (!roomName.trim()) return;
    send({ type: 'create_room', roomName: roomName.trim(), name: playerName, autoStart });
    setRoomName('');
  };

  const handleJoin = (roomId: string) => {
    send({ type: 'join_room', roomId, name: playerName });
  };

  const handleStartGame = () => {
    send({ type: 'start_game', roomId: currentRoomId, name: playerName });
  };

  const handleSearch = () => {
    send({ type: 'search_room', query: search.trim(), name: playerName });
  };

  const handleRefresh = () => {
    send({ type: 'list_rooms', name: playerName });
  };

  const handleExit = () => {
    window.location.reload();
  };

  // ── Màn chờ trong phòng (Host hoặc Guest) ──────────────────────────────────
  if (roomStatus === 'waiting_in_room') {
    const isHost = !!currentRoomId && !opponentName; // Host: biết roomId, chưa có opponentName
    const hasGuest = !!guestName;

    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'linear-gradient(135deg, rgba(20,24,36,0.97) 0%, rgba(36,28,20,0.97) 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 16, padding: '40px 48px', width: 520, backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)', textAlign: 'center',
        }}>
          <Typography.Title level={3} style={{ color: '#f5d76e', marginBottom: 4 }}>
            {isHost ? `🏠 Phòng: ${currentRoomName}` : `⚔️ Phòng của ${opponentName}`}
          </Typography.Title>
          <Typography.Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, display: 'block', marginBottom: 32 }}>
            ID Phòng: <strong style={{ color: '#fff' }}>#{currentRoomId}</strong>
          </Typography.Text>

          {/* Player slots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 36 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
                boxShadow: '0 4px 16px rgba(231,76,60,0.4)',
              }}>
                <UserOutlined style={{ fontSize: 32, color: '#fff' }} />
              </div>
              <Tag color="red" style={{ fontSize: 13, padding: '2px 12px' }}>Đỏ (Chủ phòng)</Tag>
              <div style={{ marginTop: 8, color: '#f5d76e', fontWeight: 600, fontSize: 15 }}>
                {isHost ? playerName : opponentName}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 24, fontWeight: 700 }}>
              VS
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: hasGuest || !isHost
                  ? 'linear-gradient(135deg, #2c3e50, #1a252f)'
                  : 'rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
                border: hasGuest || !isHost ? '2px solid rgba(255,255,255,0.2)' : '2px dashed rgba(255,255,255,0.15)',
                boxShadow: hasGuest ? '0 4px 16px rgba(0,0,0,0.3)' : 'none',
              }}>
                {hasGuest || !isHost
                  ? <UserOutlined style={{ fontSize: 32, color: '#ddd' }} />
                  : <Spin size="default" />}
              </div>
              <Tag color="default" style={{ fontSize: 13, padding: '2px 12px' }}>Đen (Khách)</Tag>
              <div style={{ marginTop: 8, fontWeight: 600, fontSize: 15, color: hasGuest || !isHost ? '#ccc' : 'rgba(255,255,255,0.3)' }}>
                {isHost ? (hasGuest ? guestName : 'Đang chờ...') : playerName}
              </div>
            </div>
          </div>

          {/* Host controls */}
          {isHost ? (
            <div>
              <Button
                type="primary" size="large" icon={<PlayCircleOutlined />}
                disabled={!hasGuest}
                onClick={handleStartGame}
                style={{
                  width: '100%', height: 48, fontSize: 16, borderRadius: 8,
                  background: hasGuest ? 'linear-gradient(90deg, #e74c3c, #c0392b)' : undefined,
                  border: 'none', marginBottom: 12,
                }}
              >
                {hasGuest ? 'Bắt đầu trận đấu!' : 'Chờ người chơi vào...'}
              </Button>
              <Typography.Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                Chia sẻ ID phòng <strong style={{ color: '#f5d76e' }}>#{currentRoomId}</strong> cho bạn bè để họ tham gia
              </Typography.Text>
            </div>
          ) : (
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15 }}>
              <Spin size="small" style={{ marginRight: 10 }} />
              Chờ chủ phòng bắt đầu trận đấu...
            </div>
          )}

          <Divider style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '28px 0 16px' }} />
          <Button onClick={handleExit} danger type="text" style={{ color: 'rgba(255,100,100,0.7)' }}>
            Rời phòng
          </Button>
        </div>
      </div>
    );
  }

  // ── Màn sảnh chờ (listing) ─────────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'linear-gradient(135deg, rgba(20,24,36,0.97) 0%, rgba(36,28,20,0.97) 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 16, padding: '32px 36px', width: 660, maxHeight: '85vh',
        backdropFilter: 'blur(20px)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto',
      }}>
        <Typography.Title level={3} style={{ color: '#f5d76e', margin: 0, textAlign: 'center' }}>
          <TeamOutlined style={{ marginRight: 10 }} />Sảnh Cờ Tướng
        </Typography.Title>

        {/* Tạo phòng */}
        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10, padding: '14px 16px',
        }}>
          <Typography.Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, display: 'block', marginBottom: 10 }}>
            <PlusOutlined style={{ marginRight: 6 }} />Tạo phòng mới
          </Typography.Text>
          <Space style={{ width: '100%' }}>
            <Input
              placeholder="Tên phòng..."
              value={roomName}
              onChange={e => setRoomName(e.target.value)}
              onPressEnter={handleCreate}
              style={{ background: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.15)', color: '#fff', width: 240 }}
            />
            <Checkbox
              checked={autoStart}
              onChange={e => setAutoStart(e.target.checked)}
              style={{ color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap' }}
            >
              Tự bắt đầu
            </Checkbox>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} disabled={!roomName.trim()}>
              Tạo
            </Button>
          </Space>
        </div>

        {/* Tìm phòng + List */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Input.Search
              placeholder="Tìm ID hoặc tên phòng..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onSearch={handleSearch}
              style={{ width: 280, background: 'rgba(0,0,0,0.3)' }}
            />
            <Button icon={<ReloadOutlined />} onClick={handleRefresh} style={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.15)', background: 'transparent' }}>
              Làm mới
            </Button>
          </div>

          <List
            dataSource={rooms}
            locale={{ emptyText: <span style={{ color: 'rgba(255,255,255,0.3)' }}>Chưa có phòng nào. Hãy tạo phòng mới!</span> }}
            renderItem={item => (
              <List.Item
                style={{
                  background: 'rgba(255,255,255,0.04)', borderRadius: 8, marginBottom: 8,
                  border: '1px solid rgba(255,255,255,0.08)', padding: '10px 16px',
                }}
                actions={[
                  <Button
                    key="join"
                    disabled={item.isPlaying || item.host === playerName}
                    type="primary"
                    icon={<LoginOutlined />}
                    onClick={() => handleJoin(item.id)}
                    size="small"
                    danger={item.isPlaying}
                  >
                    {item.host === playerName ? 'Phòng bạn' : item.isPlaying ? 'Đang chơi' : 'Vào phòng'}
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={
                    <span style={{ color: '#f5d76e', fontWeight: 600 }}>
                      #{item.id} · {item.name}
                    </span>
                  }
                  description={
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                      🔴 {item.host}
                      {item.guest
                        ? <span style={{ marginLeft: 12 }}>⚫ {item.guest}</span>
                        : <span style={{ marginLeft: 12, color: 'rgba(255,255,255,0.25)' }}>⚫ Chờ khách...</span>
                      }
                      {item.autoStart && <Tag color="blue" style={{ marginLeft: 12, fontSize: 11 }}>Tự bắt đầu</Tag>}
                    </span>
                  }
                />
              </List.Item>
            )}
            style={{ maxHeight: 320, overflowY: 'auto' }}
          />
        </div>

        <div style={{ textAlign: 'center' }}>
          <Button onClick={handleExit} danger type="text" style={{ color: 'rgba(255,100,100,0.6)' }}>
            Thoát
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LobbyModal;
