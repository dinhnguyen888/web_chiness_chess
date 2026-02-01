import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { message } from 'antd';
import { nextPace } from './chessInfo';

export interface ChessProps {
  name: string;
  type: string;
  side: 1 | -1;
  position: [number, number];
}

export interface gameOptions {
  mode: number;
  difficulty: number;
  side: number;
  color: string;
}

export interface gameState {
  side: number;
  click: ChessProps | null;
  board: (string | undefined)[][];
  nextPace: Array<[number, number]> | null;
  chessChange: [[number, number], [number, number], number] | null;
  color: string;
  showModel: boolean;
  mode: number;
  difficulty: number;
  winner: number | null;
  clearChessMode: boolean;
  history: Array<(string | undefined)[][]>;
  paceHistory: string[];
}

const initialState: gameState = {
  side: 0,
  click: null,
  board: [],
  nextPace: null,
  color: 'r',
  chessChange: null,
  showModel: false,
  mode: 1,
  difficulty: 2,
  winner: null,
  clearChessMode: false,
  history: [],
  paceHistory: [],
};

const chessSlice = createSlice({
  name: 'chess',
  initialState,
  reducers: {
    startClick(state) {
      state.showModel = true;
      if (state.winner) {
        state.side = 0;
      }
      state.winner = null;
    },
    onModelOK(state, action: PayloadAction<gameOptions>) {
      const payload = action.payload;
      state.side = payload.color === 'r' ? payload.side : 0 - payload.side;
      state.difficulty = payload.difficulty;
      state.mode = payload.mode;
      state.color = payload.color;
      const initialBoard = [
        ['C0', 'M0', 'X0', 'S0', 'J0', 'S1', 'X1', 'M1', 'C1'],
        [undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
        [undefined, 'P0', undefined, undefined, undefined, undefined, undefined, 'P1', undefined],
        ['Z0', undefined, 'Z1', undefined, 'Z2', undefined, 'Z3', undefined, 'Z4'],
        [undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
        [undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
        ['z0', undefined, 'z1', undefined, 'z2', undefined, 'z3', undefined, 'z4'],
        [undefined, 'p0', undefined, undefined, undefined, undefined, undefined, 'p1', undefined],
        [undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
        ['c0', 'm0', 'x0', 's0', 'j0', 's1', 'x1', 'm1', 'c1']
      ];
      state.board = initialBoard;
      state.click = null;
      state.nextPace = null;
      state.chessChange = null;
      state.showModel = false;
      state.history = state.side === 1 ? [initialBoard.map(row => [...row])] : [];
      state.paceHistory = [];
    },
    onModelCancel(state) {
      state.showModel = false;
    },
    chessClick(state, action: PayloadAction<ChessProps>) {
      if (state.mode === 2 || (state.mode === 1 && state.side === -1)) return state;
      
      if (state.clearChessMode) {
        state.clearChessMode = false;
        state.click = null;
        state.nextPace = null;
        state.chessChange = null;
        const [i, j] = action.payload.position;
        if (!state.board[i][j]) return state;
        if (state.board[i][j] === 'J0' || state.board[i][j] === 'j0') {
          message.error('Tướng và Soái không thể chấp được đâu nhé!');
        } else {
          state.board[i][j] = undefined;
        }
        return state;
      }

      if (state.click) {
        const [i, j] = action.payload.position;
        const [oldi, oldj] = state.click.position;
        const canMove = state.nextPace?.some(item => item[0] === j && item[1] === i);
        
        if (canMove) {
          if (state.board[i][j] === 'J0') {
            state.winner = 1;
            state.side = 0;
          } else if (state.board[i][j] === 'j0') {
            state.winner = -1;
            state.side = 0;
          }
          state.board[i][j] = state.click.name;
          state.board[oldi][oldj] = undefined;
          state.chessChange = [[i, j], [oldi, oldj], state.click! .side];
          state.side = -state.side;
          state.history.push(state.board.map(row => [...row]));
          state.paceHistory.push(state.chessChange.join());
        }
        state.nextPace = null;
        state.click = null;
      } else {
        const chess = action.payload;
        if (state.side !== chess.side) return state;
        const [i, j] = chess.position;
        state.click = chess;
        state.nextPace = nextPace[chess.type](j, i, state.board, chess.side);
        
        // 防止长将
        const h = state.paceHistory;
        const l = h.length;
        if (l >= 8 && chess.name !== 'j0' && chess.name !== 'J0') {
          state.nextPace = state.nextPace!.filter(pace => {
             if (h[l-2] === h[l-6] && [[pace[1], pace[0]], [i, j], chess.side].join() === h[l-4]) {
               return false;
             }
             return true;
          });
        }
      }
    },
    boardClick(state, action: PayloadAction<{x: number, y: number, offsetLeft: number, offsetTop: number}>) {
      if (state.mode === 2 || (state.mode === 1 && state.side === -1)) return state;
      
      const { x, y, offsetLeft, offsetTop } = action.payload;
      const chessSize = 54;
      const spacexy = 57;
      const j = Math.round((x - offsetLeft - chessSize / 2 + 5) / spacexy);
      const i = Math.round((y - offsetTop - chessSize / 2 + 5) / spacexy);

      if (state.clearChessMode) {
        state.clearChessMode = false;
        state.click = null;
        state.nextPace = null;
        state.chessChange = null;
        if (i < 0 || i > 9 || j < 0 || j > 8) return state;
        if (!state.board[i][j]) return state;
        if (state.board[i][j] === 'J0' || state.board[i][j] === 'j0') {
          message.error('Tướng và Soái không thể chấp được đâu nhé!');
        } else {
          state.board[i][j] = undefined;
        }
        return state;
      }

      if (state.click) {
        const [oldi, oldj] = state.click.position;
        const canMove = state.nextPace?.some(item => item[0] === j && item[1] === i);
        
        if (canMove) {
          if (state.board[i][j] === 'J0') {
            state.winner = 1;
            state.side = 0;
          } else if (state.board[i][j] === 'j0') {
            state.winner = -1;
            state.side = 0;
          }
          state.board[i][j] = state.click.name;
          state.board[oldi][oldj] = undefined;
          state.chessChange = [[i, j], [oldi, oldj], state.click.side];
          state.side = -state.side;
          state.history.push(state.board.map(row => [...row]));
          state.paceHistory.push(state.chessChange.join());
        }
        state.nextPace = null;
        state.click = null;
      }
    },
    AIClick(state, action: PayloadAction<number[]>) {
      const move = action.payload;
      if (move[0] === undefined) return state;
      const [oldx, oldy, x, y] = move;
      const key = state.board[oldy][oldx];
      if (state.board[y][x] === 'j0') {
        state.winner = -1;
        state.side = 0;
      } else if (state.board[y][x] === 'J0') {
        state.winner = 1;
        state.side = 0;
      }
      state.board[y][x] = key;
      state.board[oldy][oldx] = undefined;
      state.chessChange = [[y, x], [oldy, oldx], state.side];
      state.side = -state.side;
      state.history.push(state.board.map(row => [...row]));
      state.paceHistory.push(state.chessChange.join());
      if (state.mode === 4 || state.mode === 12) {
        state.mode = state.mode / 4;
      }
    },
    toggleAI(state) {
      state.side = Math.abs(state.side) === 2 ? state.side / 2 : state.side * 2;
    },
    onGameOver(state) {
      state.winner = null;
      state.side = 0;
    },
    changeSide(state) {
      state.board = state.board.reverse().map(row => {
        return row.map(key => {
          if (!key) return key;
          const newKey = key[0] >= 'a' ? key[0].toUpperCase() : key[0].toLowerCase();
          return newKey + key[1];
        });
      });
      state.color = state.color === 'r' ? 'b' : 'r';
      state.side = -state.side;
      state.nextPace = null;
      state.click = null;
      const c = state.chessChange;
      if (c) {
        state.chessChange = [[9 - c[0][0], c[0][1]], [9 - c[1][0], c[1][1]], -c[2]];
      }
      if (state.mode === 1) {
        state.history = [];
      } else if (state.mode === 3) {
        state.history = [state.board.map(row => [...row])];
      }
    },
    clearChess(state) {
      state.clearChessMode = true;
    },
    showHint(state) {
      state.mode = state.mode * 4;
    },
    regretMove(state) {
      if (state.history.length <= 1) return state;
      if (state.mode === 1) {
        state.history.pop();
        state.history.pop();
        state.board = state.history[state.history.length - 1].map(row => [...row]);
      } else if (state.mode === 3) {
        state.history.pop();
        state.board = state.history[state.history.length - 1].map(row => [...row]);
        state.side = -state.side;
      }
      state.click = null;
      state.nextPace = null;
      state.chessChange = null;
    }
  }
});

export const {
  startClick, onModelOK, onModelCancel, chessClick, boardClick,
  AIClick, toggleAI, onGameOver, changeSide, clearChess, showHint, regretMove
} = chessSlice.actions;

export default chessSlice.reducer;
