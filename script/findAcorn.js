// 지뢰찾기와 같은 규칙이지만, 지뢰 대신 도토리를 숨겨서 찾는 미니게임이다.
// 난이도별로 맵 크기와 도토리 개수가 달라진다.
const ACORN_DIFFICULTIES = {
    easy: { rows: 8, cols: 8, count: 10, label: '쉬움' },
    normal: { rows: 10, cols: 10, count: 20, label: '보통' },
    hard: { rows: 12, cols: 12, count: 30, label: '어려움' },
};

let acornDifficulty = 'easy';
let ACORN_ROWS = ACORN_DIFFICULTIES[acornDifficulty].rows;
let ACORN_COLS = ACORN_DIFFICULTIES[acornDifficulty].cols;
let ACORN_COUNT = ACORN_DIFFICULTIES[acornDifficulty].count;

let acornBoard = [];
let acornRevealedCount = 0;
let acornGameOver = false;

// 난이도 버튼을 누르면 맵 크기/도토리 개수를 바꾸고 게임을 새로 시작한다.
function setAcornDifficulty(diff) {
    if (!ACORN_DIFFICULTIES[diff]) return;

    acornDifficulty = diff;
    ACORN_ROWS = ACORN_DIFFICULTIES[diff].rows;
    ACORN_COLS = ACORN_DIFFICULTIES[diff].cols;
    ACORN_COUNT = ACORN_DIFFICULTIES[diff].count;

    document.querySelectorAll('.acorn-diff-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.diff === diff);
    });

    startAcornGame();
}

// 게임 창을 열고 닫는 토글 버튼 핸들러. 인라인으로 펼쳐지는 대신
// 화면 가운데에 뜨는 팝업 창(+ 뒷배경 딤 처리)으로 동작한다.
function findAcorn() {
    const panel = document.querySelector('#acorn-window');
    const backdrop = document.querySelector('#acorn-backdrop');
    const isHidden = panel.style.display === 'none' || panel.style.display === '';

    panel.style.display = isHidden ? 'block' : 'none';
    backdrop.style.display = isHidden ? 'block' : 'none';

    if (isHidden) {
        startAcornGame();
    }
}

function startAcornGame() {
    acornGameOver = false;
    acornRevealedCount = 0;
    acornBoard = createAcornBoard();
    renderAcornBoard();
    document.querySelector('#acorn-status').textContent =
        `🌰 도토리 ${ACORN_COUNT}개가 숨어있어요. 칸을 클릭해서 피해보세요!`;
}

// 1. 빈 보드를 만들고, 2. 도토리를 무작위로 심고, 3. 칸마다 인접 도토리 개수를 계산한다.
function createAcornBoard() {
    const cells = [];
    for (let r = 0; r < ACORN_ROWS; r++) {
        const row = [];
        for (let c = 0; c < ACORN_COLS; c++) {
            row.push({ isAcorn: false, revealed: false, flagged: false, count: 0 });
        }
        cells.push(row);
    }

    let placed = 0;
    while (placed < ACORN_COUNT) {
        const r = Math.floor(Math.random() * ACORN_ROWS);
        const c = Math.floor(Math.random() * ACORN_COLS);
        if (!cells[r][c].isAcorn) {
            cells[r][c].isAcorn = true;
            placed++;
        }
    }

    for (let r = 0; r < ACORN_ROWS; r++) {
        for (let c = 0; c < ACORN_COLS; c++) {
            if (cells[r][c].isAcorn) continue;
            cells[r][c].count = countNeighborAcorns(cells, r, c);
        }
    }

    return cells;
}

function countNeighborAcorns(cells, r, c) {
    let count = 0;
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < ACORN_ROWS && nc >= 0 && nc < ACORN_COLS && cells[nr][nc].isAcorn) {
                count++;
            }
        }
    }
    return count;
}

function renderAcornBoard() {
    const grid = document.querySelector('#acorn-grid');
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${ACORN_COLS}, 26px)`;

    for (let r = 0; r < ACORN_ROWS; r++) {
        for (let c = 0; c < ACORN_COLS; c++) {
            const cell = document.createElement('div');
            cell.className = 'acorn-cell';
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.addEventListener('click', onAcornCellClick);
            cell.addEventListener('contextmenu', onAcornCellFlag);
            grid.appendChild(cell);
        }
    }
}

function getAcornCellEl(r, c) {
    return document.querySelector(`.acorn-cell[data-row="${r}"][data-col="${c}"]`);
}

// 🌰 이모지는 밤이라 도토리 느낌이 안 나서, 갓(모자) + 열매를 직접 도트로 그려 넣는다.
function showAcornIcon(el) {
    el.classList.add('is-acorn');
    el.innerHTML = '<span class="pixel-acorn"></span>';
}

function onAcornCellClick(event) {
    if (acornGameOver) return;
    const r = Number(event.currentTarget.dataset.row);
    const c = Number(event.currentTarget.dataset.col);
    revealAcornCell(r, c);
}

// 도토리가 없는 칸을 열었을 때, 주변 8칸까지 이어서 자동으로 열어주는 재귀 함수 (플러드 필)
function revealAcornCell(r, c) {
    if (r < 0 || r >= ACORN_ROWS || c < 0 || c >= ACORN_COLS) return;

    const cellData = acornBoard[r][c];
    if (cellData.revealed || cellData.flagged) return;

    cellData.revealed = true;
    acornRevealedCount++;

    const el = getAcornCellEl(r, c);

    if (cellData.isAcorn) {
        showAcornIcon(el);
        endAcornGame(false);
        return;
    }

    el.classList.add('revealed');

    if (cellData.count > 0) {
        el.textContent = cellData.count;
        el.classList.add('num-' + cellData.count);
    } else {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr !== 0 || dc !== 0) {
                    revealAcornCell(r + dr, c + dc);
                }
            }
        }
    }

    checkAcornWin();
}

function onAcornCellFlag(event) {
    event.preventDefault(); // 오른쪽 클릭 메뉴 대신 깃발 표시로 사용
    if (acornGameOver) return;

    const r = Number(event.currentTarget.dataset.row);
    const c = Number(event.currentTarget.dataset.col);
    const cellData = acornBoard[r][c];
    if (cellData.revealed) return;

    cellData.flagged = !cellData.flagged;
    event.currentTarget.classList.toggle('flagged', cellData.flagged);
    event.currentTarget.textContent = cellData.flagged ? '🚩' : '';
}

function checkAcornWin() {
    const totalSafeCells = ACORN_ROWS * ACORN_COLS - ACORN_COUNT;
    if (acornRevealedCount >= totalSafeCells) {
        endAcornGame(true);
    }
}

function endAcornGame(won) {
    acornGameOver = true;

    // 모든 도토리 위치를 공개해서 정답을 보여준다.
    for (let r = 0; r < ACORN_ROWS; r++) {
        for (let c = 0; c < ACORN_COLS; c++) {
            if (acornBoard[r][c].isAcorn) {
                showAcornIcon(getAcornCellEl(r, c));
            }
        }
    }

    const status = document.querySelector('#acorn-status');
    status.textContent = won
        ? '🎉 축하합니다! 도토리를 모두 피해서 클리어했어요!'
        : '💥 도토리를 밟았습니다! 다시하기를 눌러 재도전하세요.';
}
