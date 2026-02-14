import React from 'react';
import { style } from 'typestyle';
import { Spin, Typography } from 'antd';
import { useAppSelector, useAppDispatch } from '../hooks';
import { useOnlinePlay } from '../hooks/useOnlinePlay';
import Chess from '../components/chess/Chess';
import Dot from '../components/chess/Dot';
import Box from '../components/chess/Box';
import AI from '../components/AI/AI';
import ButtonGroup from '../components/button/ButtonGroup';
import WinnerModel from '../components/button/WinnerModel';
import { boardClick } from '../models/chessSlice';

import bgImg from '../assets/style/bg.png';
import background from '../assets/background.png';

const ChessBoard: React.FC = () => {
  const chessState = useAppSelector((state) => state.chess);
  const dispatch = useAppDispatch();
  useOnlinePlay();

  const backgroundStyle = style({
    backgroundImage: `url(${background})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    width: '100%',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 0'
  });

  const boxStyle = style({
    backgroundImage: `url(${bgImg})`,
    width: '507px',
    height: '567px',
    position: 'relative',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    borderRadius: '4px'
  });

  const buttonGroupStyle = style({
    marginTop: '30px',
    width: '507px'
  });

  const handleBoardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    dispatch(boardClick({
      x: e.clientX,
      y: e.clientY,
      offsetLeft: rect.left,
      offsetTop: rect.top
    }));
  };

  return (
    <div className={backgroundStyle}>
      {chessState.onlineMatching && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
          }}
        >
          <Spin size="large" />
          <Typography.Text style={{ color: '#fff', fontSize: 18 }}>
            Đang tìm đối thủ (WebSocket)...
          </Typography.Text>
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
        
        {chessState.nextPace && chessState.nextPace.map((position, index) => (
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
      
      <div className={buttonGroupStyle}>
        <ButtonGroup 
          mode={chessState.mode} 
          side={chessState.side} 
          showModel={chessState.showModel} 
          historyLength={chessState.history.length} 
        />
      </div>
      
      <WinnerModel 
        mode={chessState.mode} 
        color={chessState.color} 
        winner={chessState.winner} 
      />
    </div>
  );
};

export default ChessBoard;
