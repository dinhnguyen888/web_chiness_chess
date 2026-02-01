import React from 'react';
import { Button } from 'antd';
import { style } from 'typestyle';
import { useAppDispatch } from '../../hooks';
import {
  startClick, changeSide, toggleAI, clearChess, showHint, regretMove
} from '../../models/chessSlice';
import StartModel from './StartModel';

interface ButtonGroupProps {
  mode: number;
  side: number;
  showModel: boolean;
  historyLength: number;
}

const ButtonGroup: React.FC<ButtonGroupProps> = ({ mode, side, showModel, historyLength }) => {
  const dispatch = useAppDispatch();

  const ButtonStyle = style({
    margin: '0 15px'
  });

  const renderThirdButton = () => {
    if (mode === 2) {
      // 模式为2代表人机对弈的某种特殊情况 hoặc machine vs machine
      return (
        <Button
          size='large'
          onClick={() => dispatch(toggleAI())}
          className={ButtonStyle}
          disabled={side === 0}
        >
          {Math.abs(side) === 2 ? 'Tiếp tục' : 'Tạm dừng'}
        </Button>
      );
    } else {
      return (
        <Button
          size='large'
          className={ButtonStyle}
          disabled={side === 0 || historyLength <= 1}
          onClick={() => dispatch(regretMove())}
        >
          Đi lại
        </Button>
      );
    }
  };

  return (
    <div>
      <div style={{ height: '100%', width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Button
          type='primary'
          size='large'
          className={ButtonStyle}
          disabled={(mode === 2) && (Math.abs(side) === 1)}
          onClick={() => dispatch(startClick())}
        >
          Bắt đầu
        </Button>
        <Button
          size='large'
          className={ButtonStyle}
          disabled={(mode === 2) || (side === 0)}
          onClick={() => dispatch(showHint())}
        >
          Gợi ý
        </Button>
        {renderThirdButton()}
        <Button
          size='large'
          className={ButtonStyle}
          disabled={(side === 0) || (mode === 2 && Math.abs(side) === 1)}
          onClick={() => dispatch(changeSide())}
        >
          Đổi bên
        </Button>
        <Button
          size='large'
          className={ButtonStyle}
          disabled={(side === 0) || (mode === 2)}
          onClick={() => dispatch(clearChess())}
        >
          Chấp quân
        </Button>
      </div>
      <StartModel visible={showModel} />
    </div>
  );
};

export default ButtonGroup;
