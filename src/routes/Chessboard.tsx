import React from 'react';
import { style } from 'typestyle';
import { UserOutlined } from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../hooks';
import { useOnlinePlay } from '../hooks/useOnlinePlay';
import Chess from '../components/chess/Chess';
import Dot from '../components/chess/Dot';
import Box from '../components/chess/Box';
import AI from '../components/AI/AI';
import ButtonGroup from '../components/button/ButtonGroup';
import WinnerModel from '../components/button/WinnerModel';
import { boardClick } from '../models/chessSlice';
import LobbyModal from '../components/lobby/LobbyModal';
import ChatBox from '../components/lobby/ChatBox';

import bgImg from '../assets/style/bg.png';
import background from '../assets/background.png';

const shellStyle = style({
  height: '100vh',
  width: '100vw',
  overflow: 'hidden',
  backgroundImage: `linear-gradient(165deg, rgba(18, 22, 30, 0.92) 0%, rgba(32, 28, 24, 0.88) 50%, rgba(22, 26, 34, 0.92) 100%), url(${background})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundAttachment: 'fixed',
});

const contentRowStyle = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%',
  margin: '0 auto',
});

const chatAsideStyle = style({
  position: 'absolute',
  left: '0',
  top: '0',
  width: '320px',
  height: '100vh',
  zIndex: 10,
});

const gameColumnStyle = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
});

const namePillStyle = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 16px',
  borderRadius: 999,
  background: 'rgba(0,0,0,0.45)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: 'rgba(255,255,255,0.92)',
  fontSize: 15,
  marginBottom: 12,
  backdropFilter: 'blur(8px)',
});

const nameAccentStyle = style({
  color: '#f5d76e',
  fontWeight: 600,
});

const boxStyle = style({
  backgroundImage: `url(${bgImg})`,
  width: '507px',
  height: '567px',
  position: 'relative',
  boxShadow: '0 16px 48px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06) inset',
  borderRadius: '8px',
});

const buttonGroupStyle = style({
  marginTop: '24px',
  width: '507px',
});

const ChessBoard: React.FC = () => {
  const chessState = useAppSelector((state) => state.chess);
  const dispatch = useAppDispatch();
  useOnlinePlay();

  const isOnlinePlaying = chessState.mode === 5 && chessState.roomStatus === 'playing';

  const handleBoardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    dispatch(
      boardClick({
        x: e.clientX,
        y: e.clientY,
        offsetLeft: rect.left,
        offsetTop: rect.top,
      })
    );
  };

  return (
    <div className={shellStyle}>
      <LobbyModal />

      <div className={contentRowStyle}>
        {isOnlinePlaying && (
          <aside className={chatAsideStyle} aria-label="Khung chat">
            <ChatBox />
          </aside>
        )}

        <main className={gameColumnStyle}>
          {isOnlinePlaying && (
            <div className={namePillStyle}>
              <UserOutlined />
              <span>Đối thủ:</span>
              <span className={nameAccentStyle}>{chessState.opponentName || 'Đối thủ'}</span>
            </div>
          )}

          <div className={boxStyle} onClick={handleBoardClick}>
            {chessState.board.map((row, i) => {
              return row.map((item, j) => {
                if (item) {
                  return (
                    <Chess
                      key={`${item}-${i}-${j}`}
                      name={item}
                      type={item[0].toLowerCase()}
                      side={item[0] >= 'a' ? 1 : -1}
                      position={[i, j]}
                      color={chessState.color}
                      control={chessState.click}
                    />
                  );
                }
                return null;
              });
            })}

            {chessState.nextPace &&
              chessState.nextPace.map((position, index) => (
                <Dot position={position} key={`dot-${index}`} />
              ))}

            {chessState.chessChange && (
              <Box chessChange={chessState.chessChange} color={chessState.color} />
            )}

            <AI
              treeDepth={chessState.difficulty}
              mode={chessState.mode}
              board={chessState.board}
              side={chessState.side}
              paceHistory={chessState.paceHistory}
            />
          </div>

          {isOnlinePlaying && (
            <div className={namePillStyle} style={{ marginTop: 12, marginBottom: 0 }}>
              <UserOutlined />
              <span>Bạn:</span>
              <span className={nameAccentStyle}>{chessState.playerName || 'Bạn'}</span>
            </div>
          )}

          <div className={buttonGroupStyle}>
            <ButtonGroup
              mode={chessState.mode}
              side={chessState.side}
              showModel={chessState.showModel}
              historyLength={chessState.history.length}
            />
          </div>
        </main>
      </div>

      <WinnerModel mode={chessState.mode} color={chessState.color} winner={chessState.winner} />
    </div>
  );
};

export default ChessBoard;
